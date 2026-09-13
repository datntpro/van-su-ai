/**
 * Node script asserting fixed-date lunar conversion.
 * Usage: npm run test:calendar
 */
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';
import ts from 'typescript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcPath = join(__dirname, '../src/lib/calendar.ts');
const source = readFileSync(srcPath, 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2019,
  },
});

const module = { exports: {} };
vm.runInNewContext(outputText, {
  module,
  exports: module.exports,
  require: createRequire(import.meta.url),
  console,
});

const { solarToLunar, FIXED_TEST_DATE, getCanChiDay } = module.exports;
const lunar = solarToLunar(
  FIXED_TEST_DATE.day,
  FIXED_TEST_DATE.month,
  FIXED_TEST_DATE.year,
  7,
);

const expected = { year: 2026, month: 8, day: 3, leap: false };
const ok =
  lunar.year === expected.year &&
  lunar.month === expected.month &&
  lunar.day === expected.day &&
  lunar.leap === expected.leap;

console.log('Fixed date:', FIXED_TEST_DATE);
console.log('Lunar:', lunar);
console.log(
  'Can Chi day:',
  getCanChiDay(FIXED_TEST_DATE.day, FIXED_TEST_DATE.month, FIXED_TEST_DATE.year),
);

if (!ok) {
  console.error('ASSERT FAILED: expected', expected);
  process.exit(1);
}
console.log('ASSERT OK');
