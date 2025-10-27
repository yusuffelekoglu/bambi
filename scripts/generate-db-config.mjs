#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

// Simple generator: parses interfaces in types/*.d.ts and emits astro:db table definitions
const typesDir = path.resolve('types');
const outFile = path.resolve('db/tables.generated.ts');

function trimLines(s){ return s.replace(/\r/g,'').trim(); }

async function main(){
  const dirents = await fs.readdir(typesDir);
  const files = dirents.filter(f => f.endsWith('.d.ts'));

  const ifaceRegex = /export interface\s+(\w+)\s*{([^}]*)}/gs;
  // capture optional trailing inline comment after the semicolon (e.g. `id: number; //PK`)
  const propRegex = /([\w]+)(\?)?\s*:\s*([^;]+);(?:\s*\/\/\s*(.+))?/g;

  const interfaces = {};

  for(const f of files){
    const content = await fs.readFile(path.join(typesDir,f),'utf8');
    let m;
    while((m = ifaceRegex.exec(content)) !== null){
      const name = m[1];
      const body = m[2];
      const props = {};
      let p;
      while((p = propRegex.exec(body)) !== null){
        // store both the raw type, optional flag and any trailing inline comment
        props[p[1]] = { type: trimLines(p[3]), comment: p[4] ? trimLines(p[4]) : null, optional: !!p[2] };
      }
      interfaces[name] = props;
    }
  }

  function resolveType(t){
    if(!t) return 'json';
    t = t.replace(/\s+/g, '');
  const refMatch = /^(\w+)\[['"](\w+)['"]\]$/;
    const arrMatch = /^(.+)\[\]$/;
    const recordMatch = /^Record<.+>$/;
    if(refMatch.test(t)){
      const [, iname, prop] = t.match(refMatch);
      const resolved = interfaces[iname]?.[prop];
      if(resolved) return resolveType(resolved.type);
      return 'json';
    }
    if(arrMatch.test(t)) return 'json';
    if(recordMatch.test(t)) return 'json';
    if(t === 'string') return 'text';
    if(t === 'number') return 'number';
    if(t === 'boolean') return 'boolean';
    if(t === 'Date') return 'date';
    if(t === 'any' || t === 'object') return 'json';
    return 'json';
  }

  // Build dependency map so we can emit referenced tables before referrers
  const refRegex = /^(\w+)\[['"](\w+)['"]\]$/;
  const deps = {};
  for(const [iname, props] of Object.entries(interfaces)){
    deps[iname] = new Set();
    for(const [, pinfo] of Object.entries(props)){
      const t = pinfo.type.replace(/\s+/g,'');
      const m = t.match(refRegex);
      if(m){ deps[iname].add(m[1]); }
    }
  }

  const emitOrder = [];
  const processed = new Set();
  const keys = Object.keys(interfaces);
  while(processed.size < keys.length){
    let progressed = false;
    for(const k of keys){
      if(processed.has(k)) continue;
      const d = Array.from(deps[k] || []);
      const allMet = d.every(x => processed.has(x));
      if(allMet){ emitOrder.push(k); processed.add(k); progressed = true; }
    }
    if(!progressed){
      // cyclic or unresolved refs — just push remaining in original order to avoid infinite loop
      for(const k of keys){ if(!processed.has(k)){ emitOrder.push(k); processed.add(k); }}
    }
  }

  const rows = [];
  rows.push("import { defineTable, column } from \"astro:db\";");
  rows.push('');

  for(const iname of emitOrder){
    const props = interfaces[iname];
    const exportName = iname.startsWith('I') ? iname.slice(1) : iname;
    rows.push(`export const ${exportName} = defineTable({`);
    rows.push('  columns: {');
    // detect if any property explicitly declares PK in this interface
    const explicitPKExists = Object.values(props).some(p => typeof p.comment === 'string' && /PK/i.test(p.comment));
    for(const [pname, pinfo] of Object.entries(props)){
      const mapped = resolveType(pinfo.type);
      // determine options: primaryKey, optional, unique, references
      const optsArr = [];
      const explicitPK = typeof pinfo.comment === 'string' && /PK/i.test(pinfo.comment);
      const explicitUnique = typeof pinfo.comment === 'string' && /UNIQUE/i.test(pinfo.comment);
      const isPK = explicitPK || (pname === 'id' && !explicitPKExists);
      if(isPK) optsArr.push('primaryKey: true');
      if(pinfo.optional) optsArr.push('optional: true');
      if(explicitUnique) optsArr.push('unique: true');

      // detect reference pattern like Other['id'] or Other["id"]
      const t = pinfo.type.replace(/\s+/g,'');
      const m = t.match(refRegex);
      if(m){
        const [, refIface, refProp] = m;
        const refExport = refIface.startsWith('I') ? refIface.slice(1) : refIface;
        // check target property to ensure it is PK or UNIQUE (or named id)
        const target = interfaces[refIface]?.[refProp];
        const targetIsKey = refProp === 'id' || (target && typeof target.comment === 'string' && /PK|UNIQUE/i.test(target.comment));
        if(targetIsKey){
          // emit a single reference value (not an array) to match astro:db column `references` type
          optsArr.push(`references: () => ${refExport}.columns.${refProp}`);
        } else {
          console.warn(`Skipping column-level reference for ${pname} -> ${refExport}.columns.${refProp} because target column may not be primary/unique`);
        }
      }

      const opts = optsArr.length ? `{ ${optsArr.join(', ')} }` : '';
      rows.push(`    ${pname}: column.${mapped}(${opts}),`);
    }
    rows.push('  },');
    rows.push('});');
    rows.push('');
  }

  // write the generated tables file
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, rows.join('\n'), 'utf8');
  console.log('Wrote', outFile);

  // Also generate db/config.ts that imports the generated tables and exports defineDb
  const configPath = path.resolve('db/config.ts');
  const tableExports = emitOrder.map(n => (n.startsWith('I') ? n.slice(1) : n));
  const configLines = [];
  configLines.push("import { defineDb } from \"astro:db\";");
  configLines.push('');
  configLines.push('// Generated by scripts/generate-db-config.mjs');
  configLines.push("import { " + tableExports.join(', ') + " } from './tables.generated';");
  configLines.push('');
  configLines.push('export default defineDb({');
  configLines.push('  tables: {');
  for(const t of tableExports){ configLines.push(`    ${t},`); }
  configLines.push('  },');
  configLines.push('});');

  await fs.writeFile(configPath, configLines.join('\n'), 'utf8');
  console.log('Wrote', configPath);
}

main().catch(err => { console.error(err); process.exit(1); });
