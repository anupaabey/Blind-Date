import { describe, it, expect } from 'vitest';
import { ageOn, phone, registration, questionnaire } from '../src/lib/validation';
import { districts, provinces, isLocation } from '../src/lib/locations';
import { compatibility, eligiblePair, type Candidate } from '../src/lib/matching';
import { createHash } from 'node:crypto';
import { callbackVerified, checkoutHash } from '../src/lib/payments';
const candidate: Candidate = {
  id: 'a',
  dob: '1997-01-01',
  resident: true,
  country: 'LK',
  gender: 'Man',
  district: 'Colombo',
  eligible: true,
  genders: ['Woman'],
  age_min: 18,
  age_max: 45,
  goal: 'Long-term relationship',
  districts: ['Colombo'],
  smoking: 'Never',
  drinking: 'Never',
  no_smoking: true,
  no_drinking: true,
  answers: Array(24).fill(4),
};
const partner = { ...candidate, id: 'b', gender: 'Woman', genders: ['Man'] };
describe('Sri Lankan adult eligibility', () => {
  it('uses Colombo calendar boundaries for the 18th birthday', () => {
    expect(ageOn('2008-10-28', new Date('2026-10-27T18:29:59Z'))).toBe(17);
    expect(ageOn('2008-10-28', new Date('2026-10-27T18:30:00Z'))).toBe(18);
  });
  it('rejects invalid calendar dates', () => expect(ageOn('2000-02-30')).toBe(-1));
  it('normalizes local and international Sri Lankan mobile numbers', () => {
    expect(phone.parse('077 123 4567')).toBe('+94771234567');
    expect(phone.parse('+94 (77) 123-4567')).toBe('+94771234567');
    expect(phone.safeParse('+447712345678').success).toBe(false);
    expect(phone.safeParse('+94111234567').success).toBe(false);
  });
  it('includes all 25 districts and nine provinces', () => {
    expect(districts).toHaveLength(25);
    expect(Object.keys(provinces)).toHaveLength(9);
    expect(isLocation('Colombo', 'Colombo')).toBe(true);
    expect(isLocation('Colombo', 'London')).toBe(false);
    expect(isLocation('Galle', 'Colombo')).toBe(false);
  });
  it('rejects foreign residency, missing consent and underage registration', () => {
    const p = {
      first_name: 'Demo',
      email: 'demo@example.com',
      password: 'long-local-password',
      phone: '+94771234567',
      dob: '1997-01-01',
      gender: 'Woman',
      country: 'LK',
      province: 'Western',
      district: 'Colombo',
      city: 'Colombo',
      resident: true,
      consent: true,
    };
    expect(registration.safeParse(p).success).toBe(true);
    for (const v of [
      { country: 'GB' },
      { resident: false },
      { consent: false },
      { dob: '2020-01-01' },
      { city: 'London' },
    ])
      expect(registration.safeParse({ ...p, ...v }).success).toBe(false);
  });
});
describe('Explainable mutual compatibility', () => {
  it('requires both people’s gender, age, residency and intentions', () => {
    expect(eligiblePair(candidate, partner)).toBe(true);
    for (const p of [
      { genders: ['Woman'] },
      { age_min: 90 },
      { resident: false },
      { country: 'US' },
      { goal: 'Other' },
      { eligible: false },
      { district: 'Galle' },
      { smoking: 'Regularly' },
    ])
      expect(eligiblePair(candidate, { ...partner, ...p })).toBe(false);
  });
  it('excludes blocked or rejected users', () =>
    expect(eligiblePair(candidate, partner, ['b'])).toBe(false));
  it('computes actual weighted answer similarities', () => {
    const a = Array(24).fill(5);
    expect(compatibility(a, a)).toEqual({
      score: 100,
      breakdown: { values: 35, interests: 25, lifestyle: 20, personality: 20 },
    });
    expect(compatibility(a, Array(24).fill(1)).score).toBe(0);
    expect(compatibility(a, [...Array(6).fill(1), ...Array(18).fill(5)]).score).toBe(65);
    expect(() => compatibility([5], a)).toThrow();
  });
});
describe('PayHere verification', () => {
  const md5 = (s: string) => createHash('md5').update(s).digest('hex').toUpperCase();
  const secret = 'fictional-test-secret';
  const fields = () =>
    new URLSearchParams({
      merchant_id: '123',
      order_id: 'order',
      payhere_amount: '2500.00',
      payhere_currency: 'LKR',
      status_code: '2',
      md5sig: md5('123order2500.00LKR2' + md5(secret)),
    });
  it('requires a valid merchant signature, amount and LKR currency', () => {
    expect(callbackVerified(fields(), '123', secret)).toBe(true);
    for (const [key, v] of [
      ['payhere_amount', '2.00'],
      ['payhere_currency', 'USD'],
      ['merchant_id', 'other'],
      ['md5sig', 'invalid'],
    ]) {
      const f = fields();
      f.set(key, v);
      expect(callbackVerified(f, '123', secret)).toBe(false);
    }
  });
  it('signs a fixed LKR checkout hash', () =>
    expect(checkoutHash('123', 'order', '2500.00', secret)).toBe(
      md5('123order2500.00LKR' + md5(secret)),
    ));
});
