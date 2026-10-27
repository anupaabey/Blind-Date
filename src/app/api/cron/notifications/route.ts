import { privileged } from '@/lib/supabase/server';
import { timingSafeEqual } from 'node:crypto';
export async function GET(request: Request) {
  const auth = request.headers.get('authorization') ?? '';
  const wanted = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (
    !process.env.CRON_SECRET ||
    auth.length !== wanted.length ||
    !timingSafeEqual(Buffer.from(auth), Buffer.from(wanted))
  )
    return new Response('Unauthorized', { status: 401 });
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
    return Response.json({ status: 'unconfigured', sent: 0 }, { status: 503 });
  const db = privileged();
  const { error: q } = await db.rpc('queue_reminders');
  if (q) return new Response('Queue unavailable', { status: 503 });
  const { data, error } = await db.rpc('claim_emails');
  if (error) return new Response('Queue unavailable', { status: 503 });
  let sent = 0;
  for (const row of data ?? []) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': row.id,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: row.email,
          subject: row.subject,
          text: row.body + '\n\nSign in to your dashboard: ' + process.env.SITE_URL + '/dashboard',
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        const { error: e } = await db
          .from('notification_outbox')
          .update({ delivered_at: new Date().toISOString(), claim_until: null })
          .eq('id', row.id);
        if (!e) sent++;
      }
    } catch {
      /* Remains queued for bounded retry. */
    }
  }
  return Response.json({ claimed: data?.length ?? 0, sent });
}
