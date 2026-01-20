import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import enMessages from '../messages/en.json';
import heMessages from '../messages/he.json';

const messages = {
  en: enMessages,
  he: heMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as 'en' | 'he')) {
    locale = routing.defaultLocale;
  }

  return {
    locale: locale as 'en' | 'he',
    messages: messages[locale as 'en' | 'he'],
    timeZone: 'UTC',
  };
});
