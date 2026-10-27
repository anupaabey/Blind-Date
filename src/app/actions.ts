'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { registration, questionnaire, phone } from '@/lib/validation';
import { requireUser, requireAdmin } from '@/lib/auth';
import { supabase, privileged } from '@/lib/supabase/server';
import { z } from 'zod';
type State = { error?: string; success?: string };
const text = (f: FormData, k: string) => String(f.get(k) ?? '');
const checked = (f: FormData, k: string) => f.get(k) === 'on';
const error = (e: unknown) => ({
  error: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
});
export async function signUp(_: State, form: FormData): Promise<State> {
  try {
    const p = registration.parse({
      first_name: text(form, 'first_name'),
      email: text(form, 'email'),
      password: text(form, 'password'),
      phone: text(form, 'phone'),
      dob: text(form, 'dob'),
      gender: text(form, 'gender'),
      country: text(form, 'country'),
      province: text(form, 'province'),
      district: text(form, 'district'),
      city: text(form, 'city'),
      resident: checked(form, 'resident'),
      consent: checked(form, 'consent'),
    });
    const db = await supabase();
    const { password, email, ...meta } = p;
    const { error: e } = await db.auth.signUp({
      email,
      password,
      options: {
        data: meta,
        emailRedirectTo: `${process.env.SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
      },
    });
    if (e) return { error: e.message };
    return {
      success:
        'Check your email to confirm your account, then sign in to complete your questionnaire. Outside Colombo? You’ll join our Sri Lanka-only waitlist.',
    };
  } catch (e) {
    if (e instanceof z.ZodError) return { error: e.issues.map((i) => i.message).join(' ') };
    return error(e);
  }
}
export async function login(_: State, f: FormData): Promise<State> {
  let ok = false;
  try {
    const db = await supabase();
    const { error: e } = await db.auth.signInWithPassword({
      email: text(f, 'email'),
      password: text(f, 'password'),
    });
    if (e) return { error: e.message };
    ok = true;
  } catch (e) {
    return error(e);
  }
  if (ok) redirect('/dashboard');
  return {};
}
export async function logout() {
  const db = await supabase();
  await db.auth.signOut();
  redirect('/');
}
export async function recover(_: State, f: FormData): Promise<State> {
  try {
    const db = await supabase();
    const { error: e } = await db.auth.resetPasswordForEmail(z.email().parse(text(f, 'email')), {
      redirectTo: `${process.env.SITE_URL ?? 'http://localhost:3000'}/auth/callback?next=/reset-password`,
    });
    if (e) return { error: e.message };
    return { success: 'If this email has an account, a password reset link is on its way.' };
  } catch (e) {
    return error(e);
  }
}
export async function resetPassword(_: State, f: FormData): Promise<State> {
  try {
    const { db } = await requireUser();
    const password = z.string().min(12).max(128).parse(text(f, 'password'));
    const { error: e } = await db.auth.updateUser({ password });
    if (e) return { error: e.message };
    return { success: 'Your password has been updated.' };
  } catch (e) {
    return error(e);
  }
}
export async function sendPhoneOtp(_: State, f: FormData): Promise<State> {
  try {
    const { db, user } = await requireUser();
    const { data: p } = await db.from('profiles').select('phone').eq('id', user.id).single();
    const number = phone.parse(text(f, 'phone'));
    if (number !== p?.phone) return { error: 'Use the mobile number on your registered profile.' };
    const { error: e } = await db.auth.updateUser({ phone: number });
    if (e) return { error: e.message };
    return { success: 'If SMS is configured, a code has been sent. Enter it below.' };
  } catch (e) {
    return error(e);
  }
}
export async function verifyPhoneOtp(_: State, f: FormData): Promise<State> {
  try {
    const { db, user } = await requireUser();
    const { data: p } = await db.from('profiles').select('phone').eq('id', user.id).single();
    const number = phone.parse(text(f, 'phone'));
    if (number !== p?.phone) return { error: 'Use your registered number.' };
    const { error: e } = await db.auth.verifyOtp({
      phone: number,
      token: text(f, 'token'),
      type: 'phone_change',
    });
    return e ? { error: e.message } : { success: 'Phone verified.' };
  } catch (e) {
    return error(e);
  }
}
export async function saveQuestionnaire(_: State, f: FormData): Promise<State> {
  try {
    const { db } = await requireUser();
    const data = questionnaire.parse(JSON.parse(text(f, 'payload')));
    const { error: e } = await db.rpc('save_questionnaire', { payload: data });
    if (e) return { error: e.message };
    revalidatePath('/dashboard');
    return {
      success:
        'Your answers and privacy choices are saved. Your profile is ready for eligibility review.',
    };
  } catch (e) {
    return error(e);
  }
}
export async function rpcAction(f: FormData) {
  const operation = text(f, 'operation');
  const back = operation.startsWith('admin:') ? '/admin' : '/dashboard';
  const ctx = operation.startsWith('admin:') ? await requireAdmin() : await requireUser();
  let name: string;
  let args: Record<string, unknown>;
  try {
    switch (operation) {
      case 'resume':
        name = 'resume_matching';
        args = { declaration: checked(f, 'resident') };
        break;
      case 'pause':
        name = 'pause_matching';
        args = {};
        break;
      case 'accept':
      case 'decline':
        name = 'decide_invitation';
        args = { invitation: z.uuid().parse(text(f, 'id')), accept: operation === 'accept' };
        break;
      case 'cancel':
        name = 'change_booking';
        args = { booking: z.uuid().parse(text(f, 'id')), operation: 'cancel' };
        break;
      case 'reschedule':
        name = 'change_booking';
        args = {
          booking: z.uuid().parse(text(f, 'id')),
          operation: 'reschedule',
          new_time: new Date(text(f, 'date') + 'T' + text(f, 'time') + ':00+05:30').toISOString(),
        };
        break;
      case 'report':
        name = 'report_match';
        args = {
          invitation: z.uuid().parse(text(f, 'id')),
          reason: text(f, 'reason'),
          block: checked(f, 'block'),
        };
        break;
      case 'feedback':
        name = 'submit_feedback';
        args = {
          booking: z.uuid().parse(text(f, 'id')),
          payload: {
            ...Object.fromEntries(
              ['enjoyed', 'comfortable', 'safe', 'another', 'recommend', 'exchange_consent'].map(
                (k) => [k, checked(f, k)],
              ),
            ),
            note: text(f, 'note'),
          },
        };
        break;
      case 'admin:generate':
        name = 'generate_recommendations';
        args = {};
        break;
      case 'admin:approve':
      case 'admin:reject':
        name = 'review_recommendation';
        args = {
          recommendation: z.uuid().parse(text(f, 'id')),
          approve: operation === 'admin:approve',
          hours: Number(text(f, 'hours') || 72),
        };
        break;
      case 'admin:manual':
        name = 'manual_pair';
        args = { a: z.uuid().parse(text(f, 'a')), b: z.uuid().parse(text(f, 'b')) };
        break;
      default:
        if (!operation.startsWith('admin:')) throw Error('Unsupported operation.');
        name = 'admin_action';
        args = {
          operation: operation.slice(6),
          target: z.uuid().parse(text(f, 'id')),
          note: text(f, 'note'),
        };
    }
    const { error: e } = await ctx.db.rpc(name, args);
    if (e) throw Error(e.message);
  } catch (e) {
    redirect(
      back +
        '?message=' +
        encodeURIComponent(e instanceof Error ? e.message : 'Unable to complete this request.'),
    );
  }
  revalidatePath(back);
  redirect(back + '?message=' + encodeURIComponent('Your changes have been saved.'));
}
export async function bookDate(_: State, f: FormData): Promise<State> {
  let id: string | null = null;
  try {
    const { db } = await requireUser();
    const date = new Date(text(f, 'date') + 'T' + text(f, 'time') + ':00+05:30');
    const { data, error: e } = await db.rpc('request_booking', {
      invitation: z.uuid().parse(text(f, 'invitation')),
      venue: z.uuid().parse(text(f, 'venue')),
      package: text(f, 'package'),
      date_time: date.toISOString(),
    });
    if (e) return { error: e.message };
    id = data;
  } catch (e) {
    return error(e);
  }
  if (id) redirect('/dashboard?message=Booking+requested.+Venue+confirmation+is+pending.');
  return {};
}
export async function deleteAccount(_: State, f: FormData): Promise<State> {
  try {
    const { db, user } = await requireUser();
    if (text(f, 'confirmation') !== 'DELETE') return { error: 'Type DELETE to confirm.' };
    const { error: e } = await db.auth.signInWithPassword({
      email: user.email!,
      password: text(f, 'password'),
    });
    if (e) return { error: 'Please confirm your current password.' };
    const admin = privileged();
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();
    if (profileError) return { error: 'Account lookup failed; your account was retained.' };
    // Cancel active dates and move paid dates to refund review before cascading profile removal.
    if (profile.status !== 'suspended') {
      const { error: pauseError } = await db.rpc('pause_matching');
      if (pauseError) return { error: pauseError.message };
    }
    for (;;) {
      const { data: files, error: listError } = await admin.storage
        .from('private-media')
        .list(user.id, { limit: 100 });
      if (listError)
        return { error: 'Media lookup failed; your account was retained. Contact support.' };
      if (!files?.length) break;
      const { error: e } = await admin.storage
        .from('private-media')
        .remove(files.map((file) => `${user.id}/${file.name}`));
      if (e) return { error: 'Media removal failed; your account was retained. Contact support.' };
    }
    const { error: del } = await admin.auth.admin.deleteUser(user.id);
    if (del) return { error: del.message };
    await db.auth.signOut();
  } catch (e) {
    return error(e);
  }
  redirect('/?deleted=1');
}
export async function venueAction(_: State, f: FormData): Promise<State> {
  try {
    const { db } = await requireAdmin();
    const payload = {
      id: text(f, 'id'),
      name: text(f, 'name'),
      country: 'LK',
      district: text(f, 'district'),
      city: text(f, 'city'),
      address: text(f, 'address'),
      contact: text(f, 'contact'),
      vetted: checked(f, 'vetted'),
      active: checked(f, 'active'),
      is_demo: checked(f, 'is_demo'),
    };
    if (payload.name.length < 2 || payload.address.length < 5 || payload.contact.length < 5)
      return { error: 'Complete the venue details and reservation contact.' };
    const { error: e } = await db.rpc('save_venue', { payload });
    if (e) return { error: e.message };
    revalidatePath('/admin');
    return { success: 'Venue saved. Only vetted and active venues appear in booking.' };
  } catch (e) {
    return error(e);
  }
}
export async function packageAction(f: FormData) {
  const { db } = await requireAdmin();
  const { error: e } = await db.rpc('update_package', {
    package: text(f, 'package'),
    amount: Number(text(f, 'amount')),
    enabled: checked(f, 'active'),
  });
  if (e) redirect('/admin?message=' + encodeURIComponent(e.message));
  revalidatePath('/pricing');
  revalidatePath('/');
  revalidatePath('/admin');
  redirect('/admin?message=Package+updated.');
}
export async function contactAction(_: State, f: FormData): Promise<State> {
  try {
    if (text(f, 'website')) return { success: 'Thank you.' };
    const { headers } = await import('next/headers');
    const { createHash } = await import('node:crypto');
    const h = await headers();
    const ip = h.get('x-vercel-forwarded-for') ?? h.get('x-forwarded-for') ?? 'local';
    const key = createHash('sha256')
      .update(ip.split(',')[0] + new Date().toISOString().slice(0, 10))
      .digest('hex');
    const values = z
      .object({
        sender: z.string().trim().min(2).max(80),
        email_address: z.email(),
        body: z.string().trim().min(10).max(3000),
      })
      .parse({
        sender: text(f, 'name'),
        email_address: text(f, 'email'),
        body: text(f, 'message'),
      });
    const { error: e } = await privileged().rpc('contact_request', { ...values, rate_key: key });
    if (e) return { error: e.message };
    return {
      success:
        'Your message is saved for our team. Please don’t send passwords or identity documents.',
    };
  } catch (e) {
    return error(e);
  }
}
export async function residenceAction(_: State, f: FormData): Promise<State> {
  try {
    const { db } = await requireUser();
    const { error: e } = await db.rpc('update_residence', {
      district_name: text(f, 'district'),
      city_name: text(f, 'city'),
    });
    if (e) return { error: e.message };
    revalidatePath('/dashboard');
    return {
      success: 'Your location is updated. Matching is paused for a new eligibility review.',
    };
  } catch (e) {
    return error(e);
  }
}
