import { callbackVerified, gatewayConfigured } from '@/lib/payments';
import { privileged } from '@/lib/supabase/server';
import { z } from 'zod';
export async function POST(request: Request) {
  if (!gatewayConfigured()) return new Response('Gateway not configured', { status: 503 });
  const raw = await request.text();
  if (raw.length > 16384) return new Response('Payload too large', { status: 413 });
  const f = new URLSearchParams(raw);
  if (!callbackVerified(f, process.env.PAYHERE_MERCHANT_ID!, process.env.PAYHERE_MERCHANT_SECRET!))
    return new Response('Invalid callback signature', { status: 401 });
  const order = z.uuid().safeParse(f.get('order_id'));
  const provider = f.get('payment_id');
  if (!order.success || !provider || provider.length > 150)
    return new Response('Invalid payment details', { status: 422 });
  const db = privileged();
  const { data: p } = await db.from('payments').select('mode').eq('id', order.data).single();
  if (!p || p.mode !== (process.env.PAYHERE_MODE ?? 'sandbox'))
    return new Response('Payment mode mismatch', { status: 422 });
  if (!['2', '-1', '-2', '-3', '0'].includes(f.get('status_code') ?? ''))
    return new Response('Unknown status', { status: 422 });
  if (f.get('status_code') === '0') return new Response('Pending');
  if (f.get('status_code') === '-3')
    return new Response('Chargeback requires merchant review', { status: 422 });
  const { error } = await db.rpc('record_payment', {
    order_id: order.data,
    provider,
    amount: Number(f.get('payhere_amount')),
    currency_code: 'LKR',
    successful: f.get('status_code') === '2',
  });
  return new Response(error ? 'Callback could not be applied' : 'OK', {
    status: error ? 422 : 200,
  });
}
