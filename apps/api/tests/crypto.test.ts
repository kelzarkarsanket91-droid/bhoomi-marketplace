import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptData, decryptData, maskAadhaar, maskPan, hashOtpCode, verifyOtpCode } from '../src/services/crypto.service.js';

test('AES-256-GCM: encrypts and decrypts Aadhaar and PAN correctly', () => {
  const sampleAadhaar = '482910394821';
  const encrypted = encryptData(sampleAadhaar);

  assert.notEqual(encrypted, sampleAadhaar);
  const parts = encrypted.split(':');
  assert.equal(parts.length, 3, 'Payload must be cipher:iv:tag');

  const decrypted = decryptData(encrypted);
  assert.equal(decrypted, sampleAadhaar);
});

test('maskAadhaar: masks 12-digit number leaving only last 4 digits visible', () => {
  const masked = maskAadhaar('582910384729');
  assert.equal(masked, 'XXXX-XXXX-4729');
});

test('maskPan: masks 10-char PAN leaving first 5 and last character visible', () => {
  const masked = maskPan('ABCDE1234F');
  assert.equal(masked, 'ABCDE****F');
});

test('verifyOtpCode: verifies correct OTP and rejects altered codes', () => {
  const code = '739201';
  const hash = hashOtpCode(code);

  assert.equal(verifyOtpCode('739201', hash), true);
  assert.equal(verifyOtpCode('739202', hash), false);
  assert.equal(verifyOtpCode('000000', hash), false);
});
