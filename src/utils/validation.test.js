import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeInput, validatePassword, validatePhone } from './validation.js';

test('sanitizeInput trims and removes control characters', () => {
  assert.equal(sanitizeInput('  John\n   '), 'John');
  assert.equal(sanitizeInput('  Jo<3   '), 'Jo3');
});

test('validatePassword requires stronger complexity', () => {
  assert.equal(validatePassword('Abc12345!'), '');
  assert.equal(validatePassword('abc12345!'), 'Password must include at least one uppercase letter.');
  assert.equal(validatePassword('ABC12345!'), 'Password must include at least one lowercase letter.');
  assert.equal(validatePassword('Abcdefgh!'), 'Password must include at least one number.');
  assert.equal(validatePassword('Abcdefgh1'), 'Password must include at least one special character.');
});

test('validatePhone rejects letters and accepts only digits or separators', () => {
  assert.equal(validatePhone('+63 912 345 6789'), '');
  assert.equal(validatePhone('09123456789'), '');
  assert.equal(validatePhone('0912abc6789'), 'Contact number can only contain numbers and allowed separators.');
});
