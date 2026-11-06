import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectLanguage, resolveLanguage } from './language';

const ENGLISH = 'Hello, how are you?';
const AMHARIC = 'ሰላም ነው? እንዴት ነህ?';

test('detectLanguage: English text is en', () => {
  assert.equal(detectLanguage(ENGLISH), 'en');
});

test('detectLanguage: Amharic text is am', () => {
  assert.equal(detectLanguage(AMHARIC), 'am');
});

test('detectLanguage: mixed text goes to the majority script', () => {
  assert.equal(detectLanguage('This is a test with አማርኛ inside.'), 'en');
  assert.equal(detectLanguage('ይህ የአማርኛ ጽሑፍ ነው API'), 'am');
});

test('detectLanguage: an equal letter count is am', () => {
  assert.equal(detectLanguage('ሰላም abc'), 'am');
});

test('detectLanguage: empty string is en', () => {
  assert.equal(detectLanguage(''), 'en');
});

test('detectLanguage: text with no letters is en', () => {
  assert.equal(detectLanguage('12345 !@#$'), 'en');
});

test('detectLanguage: Ethiopic punctuation and numerals are not letters', () => {
  assert.equal(detectLanguage('።፩፪፫'), 'en');
});

test("resolveLanguage: 'auto' detects from the text", () => {
  assert.equal(resolveLanguage('auto', AMHARIC), 'am');
  assert.equal(resolveLanguage('auto', ENGLISH), 'en');
});

test('resolveLanguage: explicit language wins over the text', () => {
  assert.equal(resolveLanguage('en', AMHARIC), 'en');
  assert.equal(resolveLanguage('am', ENGLISH), 'am');
});

test('resolveLanguage: unknown value falls back to detection', () => {
  assert.equal(resolveLanguage('fr', AMHARIC), 'am');
  assert.equal(resolveLanguage('fr', ENGLISH), 'en');
});

test('resolveLanguage: missing value falls back to detection', () => {
  assert.equal(resolveLanguage(undefined, AMHARIC), 'am');
});
