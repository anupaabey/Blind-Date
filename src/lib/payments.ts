import { createHash, timingSafeEqual } from 'node:crypto';
const md5 = (s: string) => createHash('md5').update(s).digest('hex').toUpperCase();
export const checkoutHash = (merchant: string, order: string, amount: string, secret: string) =>
  md5(merchant + order + amount + 'LKR' + md5(secret));
export function callbackVerified(f: URLSearchParams, merchant: string, secret: string) {
  if (
    f.get('merchant_id') !== merchant ||
    f.get('payhere_currency') !== 'LKR' ||
    !/^\d+\.\d{2}$/.test(f.get('payhere_amount') ?? '')
  )
    return false;
  const expected = md5(
    merchant +
      f.get('order_id') +
      f.get('payhere_amount') +
      'LKR' +
      f.get('status_code') +
      md5(secret),
  );
  const received = (f.get('md5sig') ?? '').toUpperCase();
  return (
    /^[A-F0-9]{32}$/.test(received) && timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  );
}
export const gatewayConfigured = () =>
  Boolean(
    process.env.PAYHERE_MERCHANT_ID &&
    process.env.PAYHERE_MERCHANT_SECRET &&
    ['sandbox', 'live'].includes(process.env.PAYHERE_MODE ?? 'sandbox'),
  );
