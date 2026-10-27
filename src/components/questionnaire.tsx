'use client';
import { useActionState, useState } from 'react';
import { questions, genders, goals, interests } from '@/lib/questions';
import { districts } from '@/lib/locations';
import { saveQuestionnaire } from '@/app/actions';
import { Submit, FormMessage } from './forms';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
type Draft = {
  display_name: string;
  occupation: string;
  introduction: string;
  genders: string[];
  age_min: number;
  age_max: number;
  goal: string;
  districts: string[];
  travel: boolean;
  nearby: boolean;
  max_km: number;
  smoking: string;
  drinking: string;
  no_smoking: boolean;
  no_drinking: boolean;
  interests: string[];
  experience: string;
  share_age: boolean;
  share_district: boolean;
  share_interests: boolean;
  share_score: boolean;
  answers: number[];
};
export function Questionnaire({ initial }: { initial: Partial<Draft> }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    display_name: '',
    occupation: '',
    introduction: '',
    genders: [],
    age_min: 18,
    age_max: 45,
    goal: goals[0],
    districts: ['Colombo'],
    travel: true,
    nearby: false,
    max_km: 30,
    smoking: 'Never',
    drinking: 'Never',
    no_smoking: false,
    no_drinking: false,
    interests: [],
    experience: 'Coffee',
    share_age: false,
    share_district: false,
    share_interests: false,
    share_score: false,
    answers: Array(24).fill(0),
    ...initial,
  });
  const [state, action] = useActionState(saveQuestionnaire, {});
  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  const toggle = (key: 'genders' | 'districts' | 'interests', v: string) =>
    set(key, draft[key].includes(v) ? draft[key].filter((x) => x !== v) : [...draft[key], v]);
  const labels = ['Your story', 'Your person', 'Your personality', 'Your privacy'];
  const missing = draft.answers.filter((x) => !x).length;
  return (
    <div className="onboarding">
      <span className="eyebrow">LET’S GET TO KNOW THE REAL YOU</span>
      <h1>
        A little more <em>you.</em>
      </h1>
      <p>Thoughtful answers make for more thoughtful connections. You can edit these anytime.</p>
      <div className="progress-steps">
        {labels.map((l, i) => (
          <button
            type="button"
            className={step === i ? 'active' : ''}
            onClick={() => setStep(i)}
            key={l}
          >
            {String(i + 1).padStart(2, '0')} · {l}
          </button>
        ))}
      </div>
      <form action={action}>
        <input type="hidden" name="payload" value={JSON.stringify(draft)} />
        <FormMessage state={state} />
        <div className="panel">
          {step === 0 && (
            <>
              <h2>Your story, in your words.</h2>
              <p className="form-hint">
                Your name, introduction and occupation are private to you and the matchmaking team.
              </p>
              <label className="field">
                <span>Display name</span>
                <input
                  value={draft.display_name}
                  onChange={(e) => set('display_name', e.target.value)}
                  maxLength={40}
                />
              </label>
              <label className="field">
                <span>Occupation · optional</span>
                <input
                  value={draft.occupation}
                  onChange={(e) => set('occupation', e.target.value)}
                  maxLength={80}
                />
              </label>
              <label className="field">
                <span>A little introduction · optional</span>
                <textarea
                  value={draft.introduction}
                  onChange={(e) => set('introduction', e.target.value)}
                  maxLength={400}
                  placeholder="What makes a lovely day for you?"
                />
              </label>
              <h4>The things you love</h4>
              <div className="chip-grid">
                {interests.map((v) => (
                  <label className="chip" key={v}>
                    <input
                      type="checkbox"
                      checked={draft.interests.includes(v)}
                      onChange={() => toggle('interests', v)}
                    />
                    {v}
                  </label>
                ))}
              </div>
              <label className="field">
                <span>Your ideal first date</span>
                <select
                  value={draft.experience}
                  onChange={(e) => set('experience', e.target.value)}
                >
                  {['Coffee', 'Dinner', 'Mystery', 'Premium'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          {step === 1 && (
            <>
              <h2>What are you hoping to find?</h2>
              <h4>I’m open to meeting</h4>
              <div className="chip-grid">
                {genders.map((v) => (
                  <label className="chip" key={v}>
                    <input
                      type="checkbox"
                      checked={draft.genders.includes(v)}
                      onChange={() => toggle('genders', v)}
                    />
                    {v}
                  </label>
                ))}
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>Minimum partner age</span>
                  <input
                    type="number"
                    min={18}
                    max={100}
                    value={draft.age_min}
                    onChange={(e) => set('age_min', Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  <span>Maximum partner age</span>
                  <input
                    type="number"
                    min={draft.age_min}
                    max={100}
                    value={draft.age_max}
                    onChange={(e) => set('age_max', Number(e.target.value))}
                  />
                </label>
              </div>
              <label className="field">
                <span>My relationship intention</span>
                <select value={draft.goal} onChange={(e) => set('goal', e.target.value)}>
                  {goals.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
              <h4>Preferred dating districts · Sri Lanka only</h4>
              <div className="chip-grid">
                {districts.map((v) => (
                  <label className="chip" key={v}>
                    <input
                      type="checkbox"
                      checked={draft.districts.includes(v)}
                      onChange={() => toggle('districts', v)}
                    />
                    {v}
                  </label>
                ))}
              </div>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={draft.travel}
                  onChange={(e) => set('travel', e.target.checked)}
                />
                I’m willing to travel beyond my town.
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={draft.nearby}
                  onChange={(e) => {
                    set('nearby', e.target.checked);
                    if (e.target.checked)
                      set(
                        'districts',
                        Array.from(new Set([...draft.districts, 'Colombo', 'Gampaha', 'Kalutara'])),
                      );
                  }}
                />
                Include nearby launch-region districts (Colombo, Gampaha and Kalutara) in my
                preferences.
              </label>
              <label className="field">
                <span>Maximum preferred travel distance · {draft.max_km} km</span>
                <input
                  type="range"
                  min={0}
                  max={300}
                  step={5}
                  value={draft.max_km}
                  onChange={(e) => set('max_km', Number(e.target.value))}
                />
              </label>
              <p className="form-hint">
                Matching uses approximate straight-line distances between town centres, not home
                addresses. Bookings launch in Colombo only.
              </p>
              <div className="form-grid">
                {(['smoking', 'drinking'] as const).map((k) => (
                  <label className="field" key={k}>
                    <span>My {k} habits</span>
                    <select value={draft[k]} onChange={(e) => set(k, e.target.value)}>
                      {['Never', 'Occasionally', 'Regularly'].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <h4>My dealbreakers</h4>
              <div className="mt-4">
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={draft.no_smoking}
                    onChange={(e) => set('no_smoking', e.target.checked)}
                  />
                  I only want to meet a non-smoker.
                </label>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={draft.no_drinking}
                    onChange={(e) => set('no_drinking', e.target.checked)}
                  />
                  I only want to meet someone who does not drink.
                </label>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2>The way you see the world.</h2>
              <p>
                There are no right answers. These help us look for shared values, interests,
                lifestyle and communication preferences.
              </p>
              <span className="badge mt-4">{24 - missing} of 24 answered</span>
              {questions.map(([category, prompt], i) => (
                <fieldset className="question" key={prompt}>
                  <legend>
                    {String(i + 1).padStart(2, '0')} · {prompt}
                  </legend>
                  <div className="scale">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n}>
                        <input
                          type="radio"
                          name={'q' + i}
                          value={n}
                          checked={draft.answers[i] === n}
                          onChange={() =>
                            set(
                              'answers',
                              draft.answers.map((v, j) => (j === i ? n : v)),
                            )
                          }
                          aria-label={`${n} of 5 for question ${i + 1}`}
                        />
                        {n}
                      </label>
                    ))}
                  </div>
                  <div className="scale-labels">
                    <span>Strongly disagree</span>
                    <span>Strongly agree</span>
                  </div>
                </fieldset>
              ))}
            </>
          )}
          {step === 3 && (
            <>
              <h2>Your privacy, your choice.</h2>
              <p>
                We never share your photo, full name, exact town, contact information or private
                answers in an invitation. Choose which anonymous highlights a potential match may
                see.
              </p>
              <div className="mt-6">
                {(
                  [
                    ['share_age', 'My broad age range (e.g. 25–29)'],
                    ['share_district', 'My district (never my town or exact address)'],
                    ['share_interests', 'Only interests we have in common'],
                    ['share_score', 'Our questionnaire similarity score'],
                  ] as const
                ).map(([key, label]) => (
                  <label className="check-label" key={key}>
                    <input
                      type="checkbox"
                      checked={draft[key]}
                      onChange={(e) => set(key, e.target.checked)}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div className="notice">
                Compatibility is a transparent questionnaire comparison, not a scientific prediction
                of romance. Values 35%, interests 25%, lifestyle 20%, personality and communication
                20%.
              </div>
              <p className="form-hint">
                Contact exchange is a separate choice, only after a completed date and only when
                both people independently consent. You can revoke future anonymous sharing by
                changing these settings.
              </p>
              {missing > 0 && (
                <div className="notice">
                  You still have {missing} unanswered personality questions. Return to step 3 to
                  finish before saving.
                </div>
              )}
              <Submit>Save my profile & preferences</Submit>
            </>
          )}
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="button button-outline"
            disabled={step === 0}
            onClick={() => {
              setStep((s) => s - 1);
              window.scrollTo({ top: 100, behavior: 'smooth' });
            }}
          >
            <ArrowLeft size={15} /> Previous
          </button>
          {step < 3 && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                setStep((s) => s + 1);
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
            >
              Next chapter <ArrowRight size={15} />
            </button>
          )}
        </div>
        <span className="privacy-label">
          <LockKeyhole size={13} /> Answers stay private. Save at the final step to persist changes.
        </span>
      </form>
    </div>
  );
}
