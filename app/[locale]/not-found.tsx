import NotClient from '@/components/NotFoundClient';
import { getLocale, getMessages } from 'next-intl/server';
import { BaseClientProviders } from '@/components/providers/BaseClientProviders';
import { pickClientMessages } from '@/lib/i18n/client-messages';

export default async function NotFound() {
  const locale = (await getLocale()) as 'en' | 'he';
  const messages = await getMessages();

  return (
    <BaseClientProviders
      locale={locale}
      messages={pickClientMessages(messages, ['common', 'notFound'])}
    >
      <NotClient />
    </BaseClientProviders>
  );
}
