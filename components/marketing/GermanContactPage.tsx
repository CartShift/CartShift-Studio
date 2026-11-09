import { Link } from '@/i18n/navigation';
'use client';

import { useState, type FormEvent } from 'react';
import { submitContactForm } from '@/lib/services/contact-client';
import { trackFormSubmission } from '@/components/analytics/GoogleAnalytics';

export function GermanContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'sending') return;
    const form = event.currentTarget;
    const values = new FormData(form);
    setState('sending');
    setError(null);
    try {
      const result = await submitContactForm({
        name: String(values.get('name') || '').trim(),
        email: String(values.get('email') || '').trim(),
        company: String(values.get('company') || '').trim(),
        projectType: String(values.get('projectType') || 'consultation'),
        message: String(values.get('message') || '').trim(),
        locale: 'de',
        attribution: {
          utmSource: new URLSearchParams(window.location.search).get('utm_source')?.slice(0, 160) || undefined,
          utmMedium: new URLSearchParams(window.location.search).get('utm_medium')?.slice(0, 160) || undefined,
          utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign')?.slice(0, 160) || undefined,
          partnerCode: new URLSearchParams(window.location.search).get('partner')?.slice(0, 160) || undefined,
        },
      });
      if (!result.success) throw new Error(result.error || 'Nachricht konnte nicht gesendet werden.');
      trackFormSubmission('contact-form-de');
      setState('success');
      form.reset();
    } catch {
      setError('Die Nachricht konnte gerade nicht gesendet werden. Bitte schreib direkt an hello@cart-shift.com.');
      setState('idle');
    }
  }

  const inputClass = 'mt-2 w-full min-h-12 rounded-xl border border-surface-300 bg-white px-4 py-3 text-surface-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 dark:border-white/20 dark:bg-surface-900 dark:text-white';
  return (
    <form onSubmit={submit} className="space-y-6 rounded-3xl border border-surface-200 bg-white p-7 shadow-xl dark:border-white/10 dark:bg-surface-900 sm:p-10">
      <h2 className="text-2xl font-black">Projektanfrage</h2>
      {state === 'success' ? (
        <div role="status" className="rounded-xl border border-primary-300 bg-primary-50 p-6 text-surface-900">
          <h3 className="font-bold">Vielen Dank für deine Nachricht!</h3>
          <p className="mt-2">Wir melden uns persönlich bei dir.</p>
          <button type="button" className="mt-4 underline" onClick={() => setState('idle')}>Weitere Anfrage senden</button>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="de-name" className="font-semibold">Name *</label>
            <input id="de-name" className={inputClass} name="name" autoComplete="name" maxLength={100} required />
          </div>
          <div>
            <label htmlFor="de-email" className="font-semibold">E-Mail-Adresse *</label>
            <input id="de-email" className={inputClass} type="email" name="email" autoComplete="email" required />
          </div>
          <div>
            <label htmlFor="de-company" className="font-semibold">Unternehmen (optional)</label>
            <input id="de-company" className={inputClass} name="company" autoComplete="organization" maxLength={200} />
          </div>
          <div>
            <label htmlFor="de-type" className="font-semibold">Worum geht es?</label>
            <select id="de-type" className={inputClass} name="projectType" defaultValue="consultation">
              <option value="consultation">Allgemeine Beratung</option>
              <option value="new-shop">Neuen Onlineshop erstellen</option>
              <option value="shopify">Shopify-Shop optimieren</option>
              <option value="wordpress">WordPress-Website entwickeln</option>
              <option value="other">Sonstiges Projekt</option>
            </select>
          </div>
          <div>
            <label htmlFor="de-message" className="font-semibold">Deine Nachricht *</label>
            <textarea id="de-message" className={inputClass} name="message" required rows={5} maxLength={5000} placeholder="Erzähl uns kurz von deiner Idee, den Herausforderungen und deinen Zielen." />
          </div>
          <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-300">
            Wir verwenden deine Angaben ausschließlich zur Bearbeitung deiner Anfrage. Weitere Informationen findest du in unserer <Link href="/privacy" locale="en" hrefLang="en" className="underline">Datenschutzerklärung (Englisch)</Link>.
          </p>
          {error && <p role="alert" className="rounded-lg border border-red-300 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
          <button disabled={state === 'sending'} type="submit" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary-600 px-8 py-3 font-bold text-white hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">
            {state === 'sending' ? 'Wird gesendet …' : 'Nachricht senden'}
          </button>
        </>
      )}
    </form>
  );
}

export function GermanContactPage() {
  return (
    <section className="px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-600 dark:text-primary-300">Kontakt</p>
          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">Lass uns etwas Gutes aufbauen.</h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-surface-600 dark:text-surface-300">Du planst einen neuen Onlineshop, möchtest eine bestehende Website verbessern oder hast eine technische Herausforderung? Erzähl uns davon. Gemeinsam finden wir den nächsten sinnvollen Schritt.</p>
          <div className="mt-10 rounded-2xl border border-surface-200 p-6 dark:border-white/10">
            <p className="font-semibold">Lieber direkt per E-Mail?</p>
            <a href="mailto:hello@cart-shift.com" className="mt-2 inline-block text-lg font-bold text-primary-700 underline underline-offset-4 dark:text-primary-300">hello@cart-shift.com</a>
            <p className="mt-3 text-sm text-surface-600 dark:text-surface-300">Persönliche Rückmeldung nach Verfügbarkeit. Keine automatische Verkaufsserie.</p>
          </div>
        </div>
        <GermanContactForm />
      </div>
    </section>
  );
}
