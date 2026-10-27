import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const db = await supabase();
  let error: unknown = true;
  if (code) ({ error } = await db.auth.exchangeCodeForSession(code));
  else if (token_hash && (type === 'email' || type === 'recovery' || type === 'signup'))
    ({ error } = await db.auth.verifyOtp({ token_hash, type }));
  const next =
    url.searchParams.get('next') === '/reset-password' ? '/reset-password' : '/dashboard';
  return NextResponse.redirect(
    new URL(
      error ? '/login?message=This+verification+link+is+invalid+or+expired.' : next,
      process.env.SITE_URL ?? url.origin,
    ),
  );
}
