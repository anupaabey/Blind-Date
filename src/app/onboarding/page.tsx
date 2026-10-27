import { requireUser } from '@/lib/auth';
import { Questionnaire } from '@/components/questionnaire';
export const metadata = { title: 'Your personality & preferences' };
export default async function Page() {
  const { db, user } = await requireUser();
  const [profile, prefs, answers, interests] = await Promise.all([
    db.from('profiles').select('*').eq('id', user.id).single(),
    db.from('dating_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    db
      .from('questionnaire_answers')
      .select('question_id,answer')
      .eq('user_id', user.id)
      .order('question_id'),
    db.from('interests').select('name').eq('user_id', user.id),
  ]);
  if (profile.error) throw Error(profile.error.message);
  const p = profile.data;
  const values = Array(24).fill(0);
  answers.data?.forEach((a) => {
    values[a.question_id - 1] = a.answer;
  });
  return (
    <div className="container">
      <Questionnaire
        initial={{
          display_name: p.display_name,
          occupation: p.occupation,
          introduction: p.introduction,
          share_age: p.share_age,
          share_district: p.share_district,
          share_interests: p.share_interests,
          share_score: p.share_score,
          ...prefs.data,
          interests: interests.data?.map((i) => i.name) ?? [],
          answers: values,
        }}
      />
    </div>
  );
}
