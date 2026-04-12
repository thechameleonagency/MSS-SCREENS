/**
 * Scans all src .tsx files for input, select, textarea opening tags and writes
 * docs/generated/ui-field-catalog.md
 *
 * Run: node scripts/generate-ui-field-catalog.mjs
 * Or: npm run docs:ui-catalog
 *
 * Limitations (by design): extracts opening tags only; does not resolve components
 * that render inputs internally. Multiline tags supported via brace/string scan.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'docs', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'ui-field-catalog.md');

const TAG_START = /<(input|select|textarea)\b/g;

/** Find index after the closing `>` or `/>` of a tag starting at `<` */
function scanTagEnd(content, startLt) {
  let i = startLt;
  let quote = null;
  let braceDepth = 0;

  while (i < content.length) {
    const c = content[i];
    const prev = i > 0 ? content[i - 1] : '';

    if (quote) {
      if (c === quote && prev !== '\\') quote = null;
      i++;
      continue;
    }

    if (c === '"' || c === "'" || c === '`') {
      quote = c;
      i++;
      continue;
    }

    if (c === '{') braceDepth++;
    else if (c === '}' && braceDepth > 0) braceDepth--;

    if (braceDepth === 0) {
      if (c === '/' && content[i + 1] === '>') {
        return i + 2;
      }
      if (c === '>') {
        return i + 1;
      }
    }
    i++;
  }
  return content.length;
}

/** Pull common attributes from a tag slice (best-effort string literals). */
function parseAttrs(tag) {
  const getStr = (name) => {
    const m = tag.match(new RegExp(`${name}=("([^"]*)"|'([^']*)')`));
    if (m) return (m[1] || m[2] || '').trim();
    return '';
  };
  const getJsxNum = (name) => {
    const m = tag.match(new RegExp(`\\b${name}=\\{([^}]+)\\}`));
    return m ? m[1].trim() : '';
  };
  const type = getStr('type');
  const name = getStr('name');
  const id = getStr('id');
  const placeholder = getStr('placeholder');
  const ariaLabel = getStr('aria-label');
  const min = getJsxNum('min');
  const max = getJsxNum('max');
  const step = getJsxNum('step');
  const required = /\brequired\b/.test(tag) ? 'yes' : '';
  const parts = [];
  if (type) parts.push(`type=${type}`);
  if (name) parts.push(`name=${name}`);
  if (id) parts.push(`id=${id}`);
  if (placeholder) parts.push(`placeholder=${placeholder}`);
  if (ariaLabel) parts.push(`aria-label=${ariaLabel}`);
  if (min) parts.push(`min=${min}`);
  if (max) parts.push(`max=${max}`);
  if (step) parts.push(`step=${step}`);
  if (required) parts.push('required');
  return parts.length ? parts.join(' · ') : '(no static id/name/type/placeholder)';
}

function walkTsx(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkTsx(p, out);
    else if (ent.isFile() && ent.name.endsWith('.tsx')) out.push(p);
  }
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function main() {
  const files = [];
  walkTsx(SRC, files);
  files.sort((a, b) => rel(a).localeCompare(rel(b)));

  /** @type {Map<string, { tag: string, attrs: string, line: number }[]>} */
  const byFile = new Map();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    let match;
    TAG_START.lastIndex = 0;
    while ((match = TAG_START.exec(content)) !== null) {
      const start = match.index;
      const end = scanTagEnd(content, start);
      const tagSlice = content.slice(start, end);
      const tagName = match[1];
      const line = content.slice(0, start).split(/\r?\n/).length;
      const oneLine = tagSlice.replace(/\s+/g, ' ').trim();
      const preview = oneLine.length > 200 ? `${oneLine.slice(0, 197)}…` : oneLine;
      const attrs = parseAttrs(tagSlice);

      const relPath = rel(file);
      if (!byFile.has(relPath)) byFile.set(relPath, []);
      byFile.get(relPath).push({ tag: tagName, attrs, line, preview });
    }
  }

  const total = [...byFile.values()].reduce((s, arr) => s + arr.length, 0);

  const now = new Date().toISOString();
  let md = `# Generated UI field catalog

**Do not edit by hand.** Regenerate with \`npm run docs:ui-catalog\`.

- **Generated:** ${now}
- **Source:** \`src/**/*.tsx\` (opening tags: \`<input>\`, \`<select>\`, \`<textarea>\`)
- **Total tags:** ${total}
- **Files with matches:** ${byFile.size}

## Notes

- Attributes shown are **string literals** only where regex could read them; \`value={state}\` and similar appear as \`(no static …)\`.
- **Controlled** React inputs often have no \`name\` — see the **preview** column.
- Tags spanning unusual nested braces may be truncated incorrectly; re-check the source line if needed.

## Catalog (by file)

`;

  for (const [filePath, rows] of [...byFile.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    md += `### \`${filePath}\`\n\n`;
    md += '| Line | Tag | Parsed attrs | Preview |\n';
    md += '|------|-----|--------------|--------|\n';
    for (const r of rows) {
      const prev = r.preview.replace(/\|/g, '\\|');
      const attrs = r.attrs.replace(/\|/g, '\\|');
      md += `| ${r.line} | \`${r.tag}\` | ${attrs} | \`${prev}\` |\n`;
    }
    md += '\n';
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, md, 'utf8');
  console.log(`Wrote ${rel(OUT_FILE)} (${total} tags in ${byFile.size} files)`);
}

main();
