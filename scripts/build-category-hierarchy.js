/**
 * Builds a JSON category hierarchy from the NK Master xlsx file.
 * Reads the "DAM" sheet, extracts WebCode and Webname columns, and outputs a nested hierarchy.
 *
 * Usage: node scripts/build-category-hierarchy.js [path-to-xlsx]
 * Default path: NK Master Kategorihierarki_kopia130226.xlsx in project root
 */

import XLSX from 'xlsx';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const defaultPaths = [
  join(projectRoot, 'NK Master Kategorihierarki_kopia130226.xlsx'),
  join(process.env.HOME || '', 'Downloads', 'NK Master Kategorihierarki_kopia130226.xlsx'),
];
const xlsxPath = process.argv[2] || defaultPaths.find((p) => existsSync(p)) || defaultPaths[0];
const outputPath = join(projectRoot, 'src', 'data', 'category-hierarchy.json');

function findColumnIndex(headerRow, names) {
  for (const name of names) {
    const idx = headerRow.findIndex(
      (cell) => String(cell || '').trim().toLowerCase().includes(name.toLowerCase())
    );
    if (idx >= 0) return idx;
  }
  return -1;
}

function findHeaderRow(data) {
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i] || [];
    const hasWebCode = row.some((c) => /web\s*code/i.test(String(c || '')));
    const hasWebName = row.some((c) => /web\s*(name|category\s*name)/i.test(String(c || '')));
    if (hasWebCode && hasWebName) return i;
  }
  return 0;
}

function getCell(row, indices) {
  for (const i of indices) {
    const v = row[i];
    if (v != null && String(v).trim()) return String(v).trim().replace(/\t/g, '');
  }
  return '';
}

function buildHierarchy(rows, webCodeIndices, webNameIndices) {
  const items = [];
  const seen = new Set();
  for (let i = 0; i < rows.length; i++) {
    const code = getCell(rows[i], webCodeIndices);
    const name = getCell(rows[i], webNameIndices);
    if (!code || !name) continue;
    // Skip if code doesn't look like a category code (e.g. D11000, N21010, D21010)
    const cleanCode = code.replace(/[\s\t]/g, '');
    if (!/^[A-Z]+\d{4,}$/.test(cleanCode)) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    items.push({ code, name });
  }

  const byCode = new Map();
  for (const item of items) {
    byCode.set(item.code, { code: item.code, name: item.name, children: [] });
  }

  // Build parent map: process in original row order (hierarchy follows spreadsheet order)
  const getLevel = (code) => {
    const m = code.match(/^[A-Z]+(\d)/);
    return m ? parseInt(m[1], 10) : 0;
  };

  const roots = [];
  const lastAtLevel = new Map();

  for (const item of items) {
    const node = byCode.get(item.code);
    const level = getLevel(item.code);
    let parentCode = null;

    // For T-prefixed codes (e.g. TD210201), base code is without T for prefix lookup
    const baseCode = item.code.startsWith('T') ? item.code.slice(1) : item.code;

    // Try prefix match (D31011 under D21010, TD210201 under D21020)
    for (let len = baseCode.length - 1; len >= 1; len--) {
      const candidate = baseCode.slice(0, len);
      if (byCode.has(candidate)) {
        parentCode = candidate;
        break;
      }
    }

    // Fallback: use level digit - parent is last seen at level-1
    if (!parentCode && level > 1) {
      parentCode = lastAtLevel.get(level - 1) || null;
    }

    if (parentCode) {
      byCode.get(parentCode).children.push(node);
    } else {
      roots.push(node);
    }
    if (!item.code.startsWith('T')) {
      lastAtLevel.set(level, item.code);
    }
  }

  return roots;
}

function main() {
  console.log('Reading:', xlsxPath);
  let workbook;
  try {
    workbook = XLSX.read(readFileSync(xlsxPath), { type: 'buffer' });
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('File not found. Please add the xlsx file to the project root:');
      console.error('  NK Master Kategorihierarki_kopia130226.xlsx');
      console.error('Or pass the path as argument: node scripts/build-category-hierarchy.js <path>');
    } else {
      throw err;
    }
    process.exit(1);
  }
  const sheet = workbook.Sheets['DAM'] || workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    console.error('Sheet "DAM" not found. Available sheets:', workbook.SheetNames.join(', '));
    process.exit(1);
  }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const headerRowIndex = findHeaderRow(data);
  const headerRow = data[headerRowIndex] || [];
  const rows = data.slice(headerRowIndex + 1);

  const webCodeIdx = findColumnIndex(headerRow, ['Web Code', 'WebCode', 'Web Category Code']);
  const webNameIdx = findColumnIndex(headerRow, ['Web Name', 'WebName', 'Web Category Name']);

  if (webCodeIdx < 0 || webNameIdx < 0) {
    console.error('Columns not found. Header row:', headerRow);
    process.exit(1);
  }

  // Data can be in adjacent columns (merged cells / layout shifts)
  const webCodeIndices = [
    webCodeIdx,
    webCodeIdx + 1,
    webCodeIdx + 2,
    webCodeIdx - 1,
  ].filter((i) => i >= 0);
  const webNameIndices = [
    webNameIdx,
    webNameIdx + 1,
    webNameIdx + 2,
    webNameIdx - 1,
  ].filter((i) => i >= 0);

  const hierarchy = buildHierarchy(rows, webCodeIndices, webNameIndices);
  const output = JSON.stringify(hierarchy, null, 2);

  const outDir = join(projectRoot, 'src', 'data');
  try {
    mkdirSync(outDir, { recursive: true });
  } catch (_) {}

  writeFileSync(outputPath, output, 'utf8');
  console.log('Written to:', outputPath);
  console.log('Root categories:', hierarchy.length);
}

main();
