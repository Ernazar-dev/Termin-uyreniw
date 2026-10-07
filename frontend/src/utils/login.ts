import type { Rule } from 'antd/es/form';

/** Spaces are never part of a login; letter case is kept as typed (sign-in ignores case). */
export const normalizeLogin = (value: string) => value.replace(/\s+/g, '');

export const loginRules: Rule[] = [
  { required: true, message: 'Kiriw atı kiritiliwi shárt' },
  {
    pattern: /^[A-Za-z0-9][A-Za-z0-9._-]{2,31}$/,
    message: '3–32 belgi: latın háripleri, sanlar, noqta, sızıqsha yamasa astınǵı sızıq',
  },
];
