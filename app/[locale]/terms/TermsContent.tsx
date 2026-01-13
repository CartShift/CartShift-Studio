'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Icon } from '@/components/ui/Icon';

const LAST_UPDATED = 'December 2024';

interface SectionProps {
  id: string;
  number: number;
  title: string;
  children: React.ReactNode;
}

const Section = ({ id, number, title, children }: SectionProps) => (
  <section id={id} className="scroll-mt-24">
    <div className="flex items-start gap-4 mb-4">
      <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 dark:from-purple-500/30 dark:to-purple-600/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm border border-purple-500/20">
        {number}
      </span>
      <h2 className="text-xl md:text-2xl font-bold text-surface-900 dark:text-white pt-1.5">
        {title}
      </h2>
    </div>
    <div className="ps-14">{children}</div>
  </section>
);

export default function TermsContent() {
  const t = useTranslations('terms');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-surface-100 via-white to-white dark:from-surface-900 dark:via-surface-950 dark:to-surface-950 pt-24 sm:pt-28 md:pt-32 pb-16 md:pb-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-500/5 to-accent-500/5 blur-3xl" />
          <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-500/5 to-pink-500/5 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors mb-6"
          >
            <Icon name="arrow-left" size={16} />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <Icon name="file-text" size={24} />
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-sm font-medium">
              Legal
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-surface-900 dark:text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl">
            {t('subtitle')}
          </p>

          <div className="flex items-center gap-4 mt-6 pt-6 border-t border-surface-200/60 dark:border-surface-800">
            <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-500">
              <Icon name="calendar" size={16} />
              <span>{t('lastUpdated')}: {LAST_UPDATED}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-[240px_1fr] gap-8 md:gap-12">
          {/* Table of Contents - Sticky Sidebar */}
          <aside className="hidden md:block">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4 uppercase tracking-wider">
                {t('toc')}
              </h3>
              <nav className="space-y-1 max-h-[calc(100vh-150px)] overflow-y-auto">
                <a href="#agreement" className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all">
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">1</span>
                  <span className="truncate">{t('sections.agreement.title')}</span>
                </a>
                <a href="#services" className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all">
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">2</span>
                  <span className="truncate">{t('sections.services.title')}</span>
                </a>
                <a href="#projectAgreements" className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all">
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">3</span>
                  <span className="truncate">{t('sections.projectAgreements.title')}</span>
                </a>
                <a href="#payment" className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all">
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">4</span>
                  <span className="truncate">{t('sections.payment.title')}</span>
                </a>
                <a href="#ip" className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all">
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">5</span>
                  <span className="truncate">{t('sections.ip.title')}</span>
                </a>
                <a href="#clientResponsibilities" className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all">
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">6</span>
                  <span className="truncate">{t('sections.clientResponsibilities.title')}</span>
                </a>
                <a href="#liability" className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all">
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">7</span>
                  <span className="truncate">{t('sections.liability.title')}</span>
                </a>
                <a href="#warranties" className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all">
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">8</span>
                  <span className="truncate">{t('sections.warranties.title')}</span>
                </a>
                <a href="#termination" className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all">
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">9</span>
                  <span className="truncate">{t('sections.termination.title')}</span>
                </a>
                <a href="#confidentiality" className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all">
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">10</span>
                  <span className="truncate">{t('sections.confidentiality.title')}</span>
                </a>
                <a href="#governingLaw" className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all">
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">11</span>
                  <span className="truncate">{t('sections.governingLaw.title')}</span>
                </a>
                <a href="#changes" className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all">
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">12</span>
                  <span className="truncate">{t('sections.changes.title')}</span>
                </a>
                <a href="#contact" className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-all">
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">13</span>
                  <span className="truncate">{t('sections.contact.title')}</span>
                </a>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="space-y-12">
            {/* Section 1: Agreement to Terms */}
            <Section id="agreement" number={1} title={t('sections.agreement.title')}>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200/60 dark:border-purple-500/20">
                <p className="text-surface-700 dark:text-surface-300">
                  {t('sections.agreement.content')}
                </p>
              </div>
            </Section>

            {/* Section 2: Services */}
            <Section id="services" number={2} title={t('sections.services.title')}>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {t('sections.services.intro')}
              </p>
              <ul className="space-y-3">
                {(t.raw('sections.services.items') as string[]).map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-surface-600 dark:text-surface-400">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-500/10 dark:bg-accent-500/20 flex items-center justify-center mt-0.5">
                      <Icon name="check" size={12} className="text-accent-600 dark:text-accent-400" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Section 3: Project Agreements */}
            <Section id="projectAgreements" number={3} title={t('sections.projectAgreements.title')}>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {t('sections.projectAgreements.intro')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(t.raw('sections.projectAgreements.items') as string[]).map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-surface-100/50 dark:bg-surface-800/50 border border-surface-200/60 dark:border-surface-700/50">
                    <Icon name="file-text" size={16} className="text-purple-600 dark:text-purple-400" />
                    <span className="text-sm text-surface-700 dark:text-surface-300">{item}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Section 4: Payment Terms */}
            <Section id="payment" number={4} title={t('sections.payment.title')}>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {t('sections.payment.intro')}
              </p>
              <ul className="space-y-3">
                {(t.raw('sections.payment.items') as string[]).map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-surface-600 dark:text-surface-400">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-success/10 dark:bg-success/20 flex items-center justify-center mt-0.5">
                      <Icon name="dollar-sign" size={12} className="text-success" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Section 5: Intellectual Property */}
            <Section id="ip" number={5} title={t('sections.ip.title')}>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {t('sections.ip.intro')}
              </p>
              <ul className="space-y-3">
                {(t.raw('sections.ip.items') as string[]).map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-surface-600 dark:text-surface-400">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center mt-0.5">
                      <Icon name="award" size={12} className="text-amber-600 dark:text-amber-400" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Section 6: Client Responsibilities */}
            <Section id="clientResponsibilities" number={6} title={t('sections.clientResponsibilities.title')}>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {t('sections.clientResponsibilities.intro')}
              </p>
              <ul className="space-y-3">
                {(t.raw('sections.clientResponsibilities.items') as string[]).map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-surface-600 dark:text-surface-400">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center mt-0.5">
                      <Icon name="user" size={12} className="text-blue-600 dark:text-blue-400" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Section 7: Limitation of Liability */}
            <Section id="liability" number={7} title={t('sections.liability.title')}>
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-500/20">
                <div className="flex items-start gap-3">
                  <Icon name="alert-triangle" size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-surface-700 dark:text-surface-300">
                    {t('sections.liability.content')}
                  </p>
                </div>
              </div>
            </Section>

            {/* Section 8: Warranties */}
            <Section id="warranties" number={8} title={t('sections.warranties.title')}>
              <p className="text-surface-600 dark:text-surface-400">
                {t('sections.warranties.content')}
              </p>
            </Section>

            {/* Section 9: Termination */}
            <Section id="termination" number={9} title={t('sections.termination.title')}>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {t('sections.termination.intro')}
              </p>
              <ul className="space-y-3">
                {(t.raw('sections.termination.items') as string[]).map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-surface-600 dark:text-surface-400">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center mt-0.5">
                      <Icon name="x" size={12} className="text-surface-500" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Section 10: Confidentiality */}
            <Section id="confidentiality" number={10} title={t('sections.confidentiality.title')}>
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/60 dark:border-emerald-500/20">
                <div className="flex items-start gap-3">
                  <Icon name="lock" size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-surface-700 dark:text-surface-300">
                    {t('sections.confidentiality.content')}
                  </p>
                </div>
              </div>
            </Section>

            {/* Section 11: Governing Law */}
            <Section id="governingLaw" number={11} title={t('sections.governingLaw.title')}>
              <div className="p-4 rounded-xl bg-surface-100/50 dark:bg-surface-800/50 border border-surface-200/60 dark:border-surface-700/50">
                <div className="flex items-start gap-3">
                  <Icon name="globe" size={20} className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-surface-700 dark:text-surface-300">
                    {t('sections.governingLaw.content')}
                  </p>
                </div>
              </div>
            </Section>

            {/* Section 12: Changes to Terms */}
            <Section id="changes" number={12} title={t('sections.changes.title')}>
              <p className="text-surface-600 dark:text-surface-400">
                {t('sections.changes.content')}
              </p>
            </Section>

            {/* Section 13: Contact */}
            <Section id="contact" number={13} title={t('sections.contact.title')}>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {t('sections.contact.intro')}
              </p>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200/60 dark:border-purple-500/20">
                <div className="flex items-center gap-3">
                  <Icon name="mail" size={20} className="text-purple-600 dark:text-purple-400" />
                  <div>
                    <span className="text-sm text-surface-500 dark:text-surface-500">{t('sections.contact.email')}:</span>
                    <a
                      href="mailto:hello@cart-shift.com"
                      className="block text-purple-600 dark:text-purple-400 font-medium hover:underline"
                    >
                      hello@cart-shift.com
                    </a>
                  </div>
                </div>
              </div>
            </Section>
          </main>
        </div>
      </div>
    </div>
  );
}
