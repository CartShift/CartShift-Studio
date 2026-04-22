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
      <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-accent-600/10 dark:from-accent-500/30 dark:to-accent-600/20 flex items-center justify-center text-accent-600 dark:text-accent-400 font-bold text-sm border border-accent-500/20">
        {number}
      </span>
      <h2 className="text-xl md:text-2xl font-bold text-surface-900 dark:text-white pt-1.5">
        {title}
      </h2>
    </div>
    <div className="ps-14">{children}</div>
  </section>
);

interface InfoCardProps {
  icon: string;
  title: string;
  description: string;
}

const InfoCard = ({ icon, title, description }: InfoCardProps) => (
  <div className="group p-4 rounded-xl bg-surface-100/50 dark:bg-surface-800/50 border border-surface-200/60 dark:border-surface-700/50 transition-all">
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-500/10 dark:bg-accent-500/20 flex items-center justify-center text-accent-600 dark:text-accent-400">
        <Icon name={icon} size={16} />
      </div>
      <div>
        <h4 className="font-semibold text-surface-900 dark:text-white mb-1">{title}</h4>
        <p className="text-sm text-surface-600 dark:text-surface-400">{description}</p>
      </div>
    </div>
  </div>
);

export default function PrivacyContent() {
  const t = useTranslations('privacy');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-surface-100 via-white to-white dark:from-surface-900 dark:via-surface-950 dark:to-surface-950 pt-24 sm:pt-28 md:pt-32 pb-16 md:pb-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-accent-500/5 to-purple-500/5 blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-accent-500/5 to-emerald-500/5 blur-3xl" />
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white shadow-lg shadow-accent-500/25">
              <Icon name="shield" size={24} />
            </div>
            <span className="px-3 py-1 rounded-full bg-accent-500/10 dark:bg-accent-500/20 text-accent-600 dark:text-accent-400 text-sm font-medium">
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
              <span>
                {t('lastUpdated')}: {LAST_UPDATED}
              </span>
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
              <nav className="space-y-1">
                <a
                  href="#collect"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-all"
                >
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">
                    1
                  </span>
                  <span className="truncate">{t('sections.collect.title')}</span>
                </a>
                <a
                  href="#use"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-all"
                >
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">
                    2
                  </span>
                  <span className="truncate">{t('sections.use.title')}</span>
                </a>
                <a
                  href="#sharing"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-all"
                >
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">
                    3
                  </span>
                  <span className="truncate">{t('sections.sharing.title')}</span>
                </a>
                <a
                  href="#cookies"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-all"
                >
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">
                    4
                  </span>
                  <span className="truncate">{t('sections.cookies.title')}</span>
                </a>
                <a
                  href="#security"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-all"
                >
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">
                    5
                  </span>
                  <span className="truncate">{t('sections.security.title')}</span>
                </a>
                <a
                  href="#rights"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-all"
                >
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">
                    6
                  </span>
                  <span className="truncate">{t('sections.rights.title')}</span>
                </a>
                <a
                  href="#thirdParty"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-all"
                >
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">
                    7
                  </span>
                  <span className="truncate">{t('sections.thirdParty.title')}</span>
                </a>
                <a
                  href="#contact"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-all"
                >
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">
                    8
                  </span>
                  <span className="truncate">{t('sections.contact.title')}</span>
                </a>
                <a
                  href="#changes"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-all"
                >
                  <span className="w-5 h-5 rounded-md bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center text-xs font-medium">
                    9
                  </span>
                  <span className="truncate">{t('sections.changes.title')}</span>
                </a>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="space-y-12">
            {/* Section 1: Information We Collect */}
            <Section id="collect" number={1} title={t('sections.collect.title')}>
              <p className="text-surface-600 dark:text-surface-400 mb-6">
                {t('sections.collect.intro')}
              </p>
              <div className="grid gap-4">
                <InfoCard
                  icon="user"
                  title={t('sections.collect.items.contact.title')}
                  description={t('sections.collect.items.contact.desc')}
                />
                <InfoCard
                  icon="folder"
                  title={t('sections.collect.items.project.title')}
                  description={t('sections.collect.items.project.desc')}
                />
                <InfoCard
                  icon="activity"
                  title={t('sections.collect.items.usage.title')}
                  description={t('sections.collect.items.usage.desc')}
                />
                <InfoCard
                  icon="monitor"
                  title={t('sections.collect.items.device.title')}
                  description={t('sections.collect.items.device.desc')}
                />
              </div>
            </Section>

            {/* Section 2: How We Use Information */}
            <Section id="use" number={2} title={t('sections.use.title')}>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {t('sections.use.intro')}
              </p>
              <ul className="space-y-3">
                {(t.raw('sections.use.items') as string[]).map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-surface-600 dark:text-surface-400"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-success/10 dark:bg-success/20 flex items-center justify-center mt-0.5">
                      <Icon name="check" size={12} className="text-success" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Section 3: Information Sharing */}
            <Section id="sharing" number={3} title={t('sections.sharing.title')}>
              <p className="text-surface-600 dark:text-surface-400 mb-6">
                {t('sections.sharing.intro')}
              </p>
              <div className="grid gap-4">
                <InfoCard
                  icon="server"
                  title={t('sections.sharing.items.providers.title')}
                  description={t('sections.sharing.items.providers.desc')}
                />
                <InfoCard
                  icon="shield"
                  title={t('sections.sharing.items.legal.title')}
                  description={t('sections.sharing.items.legal.desc')}
                />
              </div>
            </Section>

            {/* Section 4: Cookies */}
            <Section id="cookies" number={4} title={t('sections.cookies.title')}>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {t('sections.cookies.intro')}
              </p>
              <ul className="space-y-3 mb-4">
                {(t.raw('sections.cookies.items') as string[]).map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-surface-600 dark:text-surface-400"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-500/10 dark:bg-accent-500/20 flex items-center justify-center mt-0.5">
                      <Icon
                        name="check"
                        size={12}
                        className="text-accent-600 dark:text-accent-400"
                      />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-surface-600 dark:text-surface-400 italic">
                {t('sections.cookies.control')}
              </p>
            </Section>

            {/* Section 5: Data Security */}
            <Section id="security" number={5} title={t('sections.security.title')}>
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-500/20">
                <div className="flex items-start gap-3">
                  <Icon
                    name="lock"
                    size={20}
                    className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-surface-700 dark:text-surface-300">
                    {t('sections.security.content')}
                  </p>
                </div>
              </div>
            </Section>

            {/* Section 6: Your Rights */}
            <Section id="rights" number={6} title={t('sections.rights.title')}>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {t('sections.rights.intro')}
              </p>
              <ul className="space-y-3">
                {(t.raw('sections.rights.items') as string[]).map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-surface-600 dark:text-surface-400"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center mt-0.5">
                      <Icon
                        name="check"
                        size={12}
                        className="text-purple-600 dark:text-purple-400"
                      />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Section 7: Third-Party Services */}
            <Section id="thirdParty" number={7} title={t('sections.thirdParty.title')}>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {t('sections.thirdParty.intro')}
              </p>
              <ul className="space-y-3 mb-4">
                {(t.raw('sections.thirdParty.items') as string[]).map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-surface-600 dark:text-surface-400"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-200/60 dark:bg-surface-800 flex items-center justify-center mt-0.5">
                      <Icon name="external-link" size={12} className="text-surface-500" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-surface-500 dark:text-surface-500 text-sm italic">
                {t('sections.thirdParty.note')}
              </p>
            </Section>

            {/* Section 8: Contact Us */}
            <Section id="contact" number={8} title={t('sections.contact.title')}>
              <p className="text-surface-600 dark:text-surface-400 mb-4">
                {t('sections.contact.intro')}
              </p>
              <div className="p-4 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100/50 dark:from-accent-900/20 dark:to-accent-800/20 border border-accent-200/60 dark:border-accent-500/20">
                <div className="flex items-center gap-3">
                  <Icon name="mail" size={20} className="text-accent-600 dark:text-accent-400" />
                  <div>
                    <span className="text-sm text-surface-500 dark:text-surface-500">
                      {t('sections.contact.email')}:
                    </span>
                    <a
                      href="mailto:hello@cart-shift.com"
                      className="block text-accent-600 dark:text-accent-400 font-medium hover:underline"
                    >
                      hello@cart-shift.com
                    </a>
                  </div>
                </div>
              </div>
            </Section>

            {/* Section 9: Changes */}
            <Section id="changes" number={9} title={t('sections.changes.title')}>
              <p className="text-surface-600 dark:text-surface-400">
                {t('sections.changes.content')}
              </p>
            </Section>
          </main>
        </div>
      </div>
    </div>
  );
}
