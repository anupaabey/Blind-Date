export const colombo = (value: string) =>
  new Intl.DateTimeFormat('en-LK', {
    timeZone: 'Asia/Colombo',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
