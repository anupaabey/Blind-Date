import { ageOn } from './validation';
import { questions, weights } from './questions';
export type Candidate = {
  id: string;
  dob: string;
  resident: boolean;
  country: string;
  gender: string;
  district: string;
  eligible: boolean;
  genders: string[];
  age_min: number;
  age_max: number;
  goal: string;
  districts: string[];
  smoking: string;
  drinking: string;
  no_smoking: boolean;
  no_drinking: boolean;
  answers: number[];
};
export function eligiblePair(a: Candidate, b: Candidate, excluded: string[] = []) {
  const accepts = (x: Candidate, y: Candidate) =>
    x.eligible &&
    x.resident &&
    x.country === 'LK' &&
    ageOn(x.dob) >= 18 &&
    x.genders.includes(y.gender) &&
    ageOn(y.dob) >= x.age_min &&
    ageOn(y.dob) <= x.age_max &&
    x.districts.includes(y.district) &&
    (!x.no_smoking || y.smoking === 'Never') &&
    (!x.no_drinking || y.drinking === 'Never');
  return (
    a.id !== b.id && !excluded.includes(b.id) && a.goal === b.goal && accepts(a, b) && accepts(b, a)
  );
}
export function compatibility(a: number[], b: number[]) {
  if (
    a.length !== 24 ||
    b.length !== 24 ||
    [...a, ...b].some((v) => !Number.isInteger(v) || v < 1 || v > 5)
  )
    throw new Error('Complete both questionnaires before scoring.');
  const breakdown = Object.fromEntries(
    Object.entries(weights).map(([category, weight]) => {
      const indexes = questions.map((q, i) => (q[0] === category ? i : -1)).filter((i) => i >= 0);
      const similarity =
        indexes.reduce((s, i) => s + 1 - Math.abs(a[i] - b[i]) / 4, 0) / indexes.length;
      return [category, Math.round(similarity * weight * 10000) / 100];
    }),
  );
  return { score: Math.round(Object.values(breakdown).reduce((a, b) => a + b, 0)), breakdown };
}
