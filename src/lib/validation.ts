import { z } from 'zod';
import { citiesFor, districts } from './locations';
import { genders, goals, questions } from './questions';
export function ageOn(dob: string, now = new Date()): number {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dob) ? new Date(dob + 'T00:00:00Z') : new Date(NaN);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== dob) return -1;
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const [y, m, d] = today.split('-').map(Number),
    [by, bm, bd] = dob.split('-').map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}
export const phone = z
  .string()
  .transform((s) => s.replace(/[\s()-]/g, '').replace(/^07/, '+947'))
  .pipe(
    z.string().regex(/^\+947\d{8}$/, 'Enter a Sri Lankan mobile number, e.g. +94 77 123 4567.'),
  );
export const registration = z
  .object({
    first_name: z.string().trim().min(2).max(60),
    email: z.email(),
    password: z.string().min(12).max(128),
    phone,
    dob: z.string().refine((d) => ageOn(d) >= 18 && ageOn(d) <= 110, 'You must be 18 or older.'),
    gender: z.enum(genders),
    country: z.literal('LK', { error: 'Our service currently operates exclusively in Sri Lanka.' }),
    province: z.string(),
    district: z.string().refine((d) => districts.includes(d), 'Choose a Sri Lankan district.'),
    city: z.string(),
    resident: z.literal(true, { error: 'Please confirm that you currently reside in Sri Lanka.' }),
    consent: z.literal(true, {
      error: 'Please agree to the terms and privacy policy to register.',
    }),
  })
  .refine((v) => citiesFor(v.district).includes(v.city), 'Choose a listed Sri Lankan city.');
export const questionnaire = z
  .object({
    display_name: z.string().trim().min(2).max(40),
    occupation: z.string().trim().max(80),
    introduction: z.string().trim().max(400),
    genders: z.array(z.enum(genders)).min(1),
    age_min: z.number().int().min(18).max(100),
    age_max: z.number().int().min(18).max(100),
    goal: z.enum(goals),
    districts: z.array(z.string().refine((d) => districts.includes(d))).min(1),
    travel: z.boolean(),
    nearby: z.boolean(),
    max_km: z.number().int().min(0).max(500),
    smoking: z.enum(['Never', 'Occasionally', 'Regularly']),
    drinking: z.enum(['Never', 'Occasionally', 'Regularly']),
    no_smoking: z.boolean(),
    no_drinking: z.boolean(),
    interests: z.array(z.string().max(40)).max(10),
    experience: z.enum(['Coffee', 'Dinner', 'Mystery', 'Premium']),
    share_age: z.boolean(),
    share_district: z.boolean(),
    share_interests: z.boolean(),
    share_score: z.boolean(),
    answers: z.array(z.number().int().min(1).max(5)).length(questions.length),
  })
  .refine((v) => v.age_max >= v.age_min, 'Maximum age must be above minimum age.');
export function money(value: number) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value);
}
