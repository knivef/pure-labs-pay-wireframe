#!/usr/bin/env node
/*
 * Copy guardrails for the Pure Labs Pay wireframe.
 *
 *   node scripts/check-copy.js
 *
 * Exits 1 on any hit, so it can sit in a pre-commit hook or a build step.
 * It scans .html, .css, .js and .txt, and skips this folder: the rules below
 * contain the banned words themselves, so a self scan would always fail.
 *
 * Every rule traces back to CLAUDE.md. Where a rule has an exception, the
 * exception is an exact string, never a loose pattern, so nothing slips
 * through by accident.
 */

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var SKIP_DIRS = ['scripts', 'node_modules', '.git', 'assets'];
var EXTENSIONS = ['.html', '.css', '.js', '.txt'];

/* ---------------------------------------------------------------- rules */

var BANNED = [
  'guaranteed approval', 'guaranteed', 'no reserve', 'no reserves',
  'instant approval', 'anonymous', 'no kyc', 'offshore',
  'cure', 'cures', 'treat', 'treats', 'treated', 'treating',
  'heal', 'heals', 'healing', 'fda approved',
  'best rates', 'lowest rates', 'zero fees'
];

/* "bank" is banned only as a description of us, so the check looks for the
   claim rather than the word. "is not a bank" is the required disclosure. */
var BANK_CLAIM = /\b(we are|we're|is|as) an? (bank|acquirer)\b/i;

var TERMS_WORDS = /\b(rate|rates|fee|fees|reserve|reserves|approval|limit|limits)\b/i;
var FIGURE = /(\$\s?[0-9][0-9.,]*\s?[kKmM]?\b|[0-9][0-9.]*\s?%|\b[0-9]+\s?(day|days|business days)\b)/;

/* The merchant's own ranges, which Rule B asks the forms to collect. Exact
   strings only, and only inside the three forms. */
var RANGE_ALLOW = [
  'Under $25k', '$25k to $100k', '$100k to $500k', '$500k to $1M',
  'Over $500k', 'Over $1M', 'Under $50', '$50 to $150', 'Over $150',
  'Under 0.5%', '0.5% to 1%', 'Over 1%'
];
var RANGE_FILES = ['apply.html', 'peptides.html', 'kratom.html'];

var REQUIREMENT_PHRASES = ['processing history required', 'minimum', 'no startups'];

/* A form region, for the rules that only apply outside the forms. */
function inFormRegion(lines, index) {
  var depth = 0;
  for (var i = 0; i <= index; i++) {
    if (/<form[\s>]/.test(lines[i])) { depth++; }
    if (/<\/form>/.test(lines[i])) { depth--; }
  }
  return depth > 0;
}

var PEPTIDE_WORDS = /\b(dose|doses|dosage|dosing|inject|injects|injected|injection|injections|human[ -]use|weight loss)\b/i;
var PEPTIDE_ALLOW = [
  'No human-use, dosing or health claims on research products',
  'never mentions dosing'
];

var KRATOM_WORDS = /\b(pain|anxiety|energy|relief|withdrawal)\b/i;

/* ---------------------------------------------------------------- engine */

var hits = [];

function hit(file, line, rule, text) {
  hits.push({ file: file, line: line, rule: rule, text: text.trim().slice(0, 120) });
}

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.indexOf(entry.name) === -1) { walk(path.join(dir, entry.name), out); }
      return;
    }
    if (EXTENSIONS.indexOf(path.extname(entry.name)) > -1) { out.push(path.join(dir, entry.name)); }
  });
  return out;
}

function allowedRange(line, file) {
  if (RANGE_FILES.indexOf(path.basename(file)) === -1) { return false; }
  return RANGE_ALLOW.some(function (range) { return line.indexOf(range) > -1; });
}

function check(file) {
  var rel = path.relative(ROOT, file);
  var base = path.basename(file);
  var lines = fs.readFileSync(file, 'utf8').split('\n');

  lines.forEach(function (line, i) {
    var n = i + 1;
    var lower = line.toLowerCase();

    /* 1. dashes */
    if (line.indexOf('—') > -1) { hit(rel, n, 'em dash', line); }
    if (line.indexOf('–') > -1) { hit(rel, n, 'en dash', line); }

    /* 2. banned phrases */
    BANNED.forEach(function (phrase) {
      var pattern = new RegExp('\\b' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      if (pattern.test(lower)) { hit(rel, n, 'banned phrase: ' + phrase, line); }
    });
    if (BANK_CLAIM.test(line) && !/is not an? (bank|acquirer)/i.test(line)) {
      hit(rel, n, 'describes us as a bank or acquirer', line);
    }

    /* 3. a figure next to a commercial term */
    if (FIGURE.test(line) && TERMS_WORDS.test(line) && !allowedRange(line, file)) {
      hit(rel, n, 'figure near a commercial term', line);
    }

    /* 4. the history requirement, stated outside a form */
    REQUIREMENT_PHRASES.forEach(function (phrase) {
      if (lower.indexOf(phrase) > -1 && !inFormRegion(lines, i)) {
        hit(rel, n, 'requirement wording outside a form: ' + phrase, line);
      }
    });

    /* 5. peptide rules */
    if (base === 'peptides.html' && PEPTIDE_WORDS.test(line)) {
      var allowed = PEPTIDE_ALLOW.some(function (ok) { return line.indexOf(ok) > -1; });
      if (!allowed) { hit(rel, n, 'peptide copy implies human use or dosing', line); }
    }

    /* 6. kratom rules */
    if (base === 'kratom.html' && KRATOM_WORDS.test(line)) {
      hit(rel, n, 'kratom copy reads as a health claim', line);
    }
  });
}

walk(ROOT, []).forEach(check);

/* ---------------------------------------------------------------- report */

var byRule = {};
hits.forEach(function (h) { byRule[h.rule] = (byRule[h.rule] || 0) + 1; });

if (!hits.length) {
  console.log('check-copy: clean. No dashes, banned phrases, published figures or category claims.');
  process.exit(0);
}

console.log('check-copy: ' + hits.length + ' hit(s)\n');
hits.forEach(function (h) {
  console.log(h.file + ':' + h.line + '  [' + h.rule + ']');
  console.log('    ' + h.text);
});
console.log('\nsummary');
Object.keys(byRule).sort().forEach(function (rule) {
  console.log('  ' + byRule[rule] + '  ' + rule);
});
process.exit(1);
