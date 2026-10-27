import 'server-only';
import { redirect } from 'next/navigation';
import { configured, supabase } from './supabase/server';
export async function requireUser() {
  if (!configured()) redirect('/login?message=Account+services+are+not+configured+yet.');
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect('/login');
  return { db, user };
}
export async function requireAdmin() {
  const ctx = await requireUser();
  const { data } = await ctx.db.rpc('is_admin');
  if (!data) redirect('/dashboard?message=Administrator+access+required.');
  return ctx;
}
