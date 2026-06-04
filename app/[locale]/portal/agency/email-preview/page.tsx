import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { EmailPreviewClient } from './EmailPreviewClient';
import {
  renderEmailPreviews,
  type EmailPreviewLocale,
} from '@/lib/email-preview/render-email-previews';

export const metadata: Metadata = {
  title: 'Email previews | CartShift Portal',
};

export default async function EmailPreviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale: EmailPreviewLocale = locale === 'he' ? 'he' : 'en';
  setRequestLocale(activeLocale);

  const [en, he] = await Promise.all([renderEmailPreviews('en'), renderEmailPreviews('he')]);

  return <EmailPreviewClient locale={activeLocale} previewsByLocale={{ en, he }} />;
}
