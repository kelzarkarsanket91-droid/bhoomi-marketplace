import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/services/db.js';
import { otpService } from '../src/services/otp.service.js';

test('OTP: enforces 60-second cooldown on consecutive requests', async () => {
  const target = '9822999001';

  // Request 1
  const first = await otpService.requestOtp(target);
  assert.equal(first.success, true);
  assert.ok(first.cooldownSeconds <= 60);

  // Request 2 immediately
  const second = await otpService.requestOtp(target);
  assert.equal(second.success, false);
  assert.ok(second.message.includes('Please wait'));
});

test('OTP: rejects expired OTP after expiration window', async () => {
  const target = '9822999002';
  const token = await otpService.requestOtp(target);
  assert.ok(token.devOtp);

  // Artificially expire the token in DB
  await prisma.otpToken.updateMany({
    where: { target },
    data: { expiresAt: new Date(Date.now() - 5000) },
  });

  const verification = await otpService.verifyOtp(target, token.devOtp!);
  assert.equal(verification.valid, false);
  assert.ok(verification.message.includes('expired'));
});

test('OTP: enforces maximum 3 attempts and locks token', async () => {
  const target = '9822999003';
  await otpService.requestOtp(target);

  // 1st wrong attempt
  const attempt1 = await otpService.verifyOtp(target, '000000');
  assert.equal(attempt1.valid, false);
  assert.ok(attempt1.message.includes('2 attempt(s) remaining'));

  // 2nd wrong attempt
  const attempt2 = await otpService.verifyOtp(target, '000001');
  assert.equal(attempt2.valid, false);
  assert.ok(attempt2.message.includes('1 attempt(s) remaining'));

  // 3rd wrong attempt
  const attempt3 = await otpService.verifyOtp(target, '000002');
  assert.equal(attempt3.valid, false);

  // 4th attempt should be blocked
  const attempt4 = await otpService.verifyOtp(target, '000003');
  assert.equal(attempt4.valid, false);
  assert.ok(attempt4.message.includes('Maximum'));
});
