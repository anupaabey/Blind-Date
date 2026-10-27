// Extend these message resources and add locale routing when reviewed translations are ready.
export const availableLocales = ['en'] as const;
export const plannedLocales = ['si', 'ta'] as const;
export const regionalSettings = {
  country: 'LK',
  currency: 'LKR',
  timeZone: 'Asia/Colombo',
  defaultLocale: 'en-LK',
  adultAge: 18,
} as const;
export const messages = {
  en: {
    serviceRestriction:
      'Our service currently operates exclusively for adults residing in Sri Lanka.',
    waitlist: 'Your Sri Lankan district is on our launch waitlist.',
    bookingPending: 'Your venue reservation awaits confirmation.',
    paymentUnconfigured: 'Payments are unavailable until a merchant gateway is configured.',
  },
} as const;
