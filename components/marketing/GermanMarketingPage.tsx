import NextLink from 'next/link';
import { Link } from '@/i18n/navigation';

type PageKind = 'home' | 'shopify' | 'wordpress' | 'seo';

const pages = {
  home: {
    eyebrow: 'Websites & E-Commerce für Unternehmen',
    title: 'Dein Unternehmen verdient einen starken digitalen Auftritt.',
    intro: 'Wir entwickeln moderne Onlineshops und Websites, die zu deinem Geschäft passen – mit durchdachter Gestaltung, sauberer Technik und einem klaren Weg vom ersten Gespräch bis zum Launch.',
    primary: 'Projekt besprechen',
    features: [
      { title: 'Neuen Onlineshop starten', body: 'Du verkaufst bisher vor Ort? Wir planen und entwickeln einen Onlineshop, der zu deinem Sortiment und deinen Abläufen passt.', href: '/solutions/shopify', action: 'Shopify entdecken' },
      { title: 'Bestehenden Shop verbessern', body: 'Schnellere Ladezeiten, verständlichere Kaufprozesse, technische SEO und individuelle Funktionen – gezielt statt auf Verdacht.', href: '/solutions/shopify', action: 'Shop-Optimierung' },
      { title: 'Professionelle Website entwickeln', body: 'Für Dienstleistungen, Marken und Teams: eine Website mit klarer Botschaft, gutem Design und einer zuverlässigen technischen Basis.', href: '/solutions/wordpress', action: 'WordPress entdecken' },
    ],
  },
  shopify: {
    eyebrow: 'Shopify Entwicklung & Beratung',
    title: 'Ein Shopify-Shop, der sich richtig anfühlt. Und zuverlässig funktioniert.',
    intro: 'Ob erster Onlineshop oder Weiterentwicklung eines bestehenden Stores: Wir unterstützen bei Konzeption, Design, Shopify-Implementierung, technischen Integrationen und Optimierung.',
    primary: 'Shopify-Projekt anfragen',
    features: [
      { title: 'Shopify-Shop erstellen', body: 'Einrichtung, Theme-Anpassung, Produktstruktur, Navigation und Kaufprozess – abgestimmt auf das Geschäftsmodell.', href: '/contact', action: 'Projekt anfragen' },
      { title: 'Conversion & Performance', body: 'Wir untersuchen Engpässe, verbessern die Nutzerführung und optimieren Geschwindigkeit und mobile Darstellung.', href: '/contact', action: 'Shop verbessern' },
      { title: 'Erweiterungen & Automatisierung', body: 'Individuelle Shopify-Funktionen, Integrationen und wiederkehrende Bestellungen – ohne unnötige Komplexität.', href: '/contact', action: 'Vorhaben besprechen' },
    ],
  },
  seo: {
    eyebrow: 'Technische SEO & Sichtbarkeit',
    title: 'Besser gefunden werden. Mit einer Website, die technisch überzeugt.',
    intro: 'Wir analysieren technische SEO-Probleme in Shopify- und WordPress-Projekten und setzen sinnvolle Verbesserungen um – von Indexierung und Seitengeschwindigkeit bis zu internen Links und strukturierten Daten.',
    primary: 'SEO-Projekt besprechen',
    features: [
      { title: 'Technisches SEO-Audit', body: 'Wir prüfen Crawling, Indexierung, technische Fehler und die grundlegende Seitenstruktur.', href: '/contact', action: 'Audit anfragen' },
      { title: 'Shopify & WordPress SEO', body: 'Individuelle Verbesserungen an Templates, Seitentypen, Ladezeiten und der internen Verlinkung.', href: '/contact', action: 'Optimierung besprechen' },
      { title: 'Messbare Prioritäten', body: 'Statt SEO-Versprechen ohne Grundlage: konkrete Maßnahmen nach Wirkung, Aufwand und technischer Machbarkeit.', href: '/contact', action: 'Beratung anfragen' },
    ],
  },
  wordpress: {
    eyebrow: 'WordPress Websites & Entwicklung',
    title: 'WordPress-Websites, die mehr können als nur gut aussehen.',
    intro: 'Wir entwickeln individuelle Websites mit WordPress – für Unternehmen, redaktionelle Plattformen und Marken, die Wert auf Performance, Pflegeleichtigkeit und Gestaltung legen.',
    primary: 'Website-Projekt anfragen',
    features: [
      { title: 'Individuelles Webdesign', body: 'Eine Website mit klarem Konzept, responsiver Gestaltung und einer Struktur, in der sich Besucher sofort zurechtfinden.', href: '/contact', action: 'Projekt anfragen' },
      { title: 'Technische Qualität', body: 'Performance, Accessibility, technische SEO und eine solide Basis für die Weiterentwicklung.', href: '/contact', action: 'Beratung anfragen' },
      { title: 'Wartung & Weiterentwicklung', body: 'Gezielte Verbesserungen an Themes, Funktionen, Sicherheit und Veröffentlichungsprozessen.', href: '/contact', action: 'Anforderungen besprechen' },
    ],
  },
} as const;

const faqs = {
  shopify: [
    ['Ist Shopify für mein Geschäft geeignet?', 'Das hängt von Sortiment, internen Abläufen und den gewünschten Funktionen ab. Wir prüfen gemeinsam, ob Shopify die richtige Grundlage ist.'],
    ['Kann ein bestehender Shop optimiert werden?', 'Ja. Wir können an Design, Performance, SEO, Navigation, Checkout-Nähe und individuellen Funktionen arbeiten, ohne direkt alles neu zu bauen.'],
    ['Bietet ihr auch Unterstützung nach dem Launch?', 'Ja. Je nach Projekt vereinbaren wir gezielte Weiterentwicklung und technische Unterstützung.'],
  ],
  seo: [
    ['Was umfasst ein technisches SEO-Audit?', 'Wir untersuchen unter anderem Indexierung, Seitenstruktur, Geschwindigkeit und technische Suchmaschinen-Signale. Der genaue Umfang hängt von der Website ab.'],
    ['Könnt ihr die Probleme auch direkt beheben?', 'Ja. Unser Schwerpunkt liegt auf technischer Umsetzung – nicht nur auf einem Bericht mit Empfehlungen.'],
    ['Garantiert ihr bessere Google-Rankings?', 'Nein. Rankings hängen von vielen Faktoren ab. Wir arbeiten an nachvollziehbaren technischen Verbesserungen, nicht mit unrealistischen Garantien.'],
  ],
  wordpress: [
    ['Kann ich Inhalte später selbst ändern?', 'Ja. Wir planen die Inhaltsverwaltung so, dass regelmäßige Änderungen ohne Entwicklungsaufwand möglich sind.'],
    ['Übernehmt ihr bestehende WordPress-Websites?', 'Wir können eine bestehende Website prüfen und sinnvolle Verbesserungen oder einen strukturierten Relaunch planen.'],
    ['Wie lange dauert die Umsetzung?', 'Das hängt von Umfang, Inhalt und Integrationen ab. Nach einem Gespräch können wir den Aufwand realistisch einschätzen.'],
  ],
} as const;

export function GermanMarketingPage({ kind }: { kind: PageKind }) {
  const data = pages[kind];
  const isHome = kind === 'home';

  return (
    <>
      <section className="relative overflow-hidden bg-surface-950 px-5 py-24 text-white sm:py-32 md:px-8">
        <div className="pointer-events-none absolute -end-32 -top-44 h-[28rem] w-[28rem] rounded-full bg-primary-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-56 start-0 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-6 text-xs font-bold uppercase tracking-[.2em] text-primary-300">{data.eyebrow}</p>
          <h1 className="max-w-5xl text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">{data.title}</h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-surface-200 sm:text-xl">{data.intro}</p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-7 py-3 text-sm font-bold text-surface-950 transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{data.primary}</Link>
            <a href="#leistungen" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-7 py-3 text-sm font-semibold text-white hover:bg-white/10">Leistungen ansehen</a>
          </div>
          <p className="mt-8 text-sm text-surface-300">Persönliche Zusammenarbeit · Technisch fundiert · Keine Lösungen von der Stange</p>
        </div>
      </section>

      <section id="leistungen" className="scroll-mt-24 px-5 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-600 dark:text-primary-300">Was wir für dich tun können</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">{isHome ? 'Von der Idee zur digitalen Präsenz.' : 'Die richtige Unterstützung für deinen nächsten Schritt.'}</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {data.features.map((feature, index) => (
              <article key={feature.title} className="flex flex-col rounded-3xl border border-surface-200 bg-surface-50 p-7 dark:border-white/10 dark:bg-surface-900">
                <span className="text-sm font-bold text-primary-600 dark:text-primary-300">0{index + 1}</span>
                <h3 className="mt-5 text-2xl font-bold">{feature.title}</h3>
                <p className="mt-4 flex-1 leading-relaxed text-surface-600 dark:text-surface-300">{feature.body}</p>
                <Link href={feature.href} className="mt-8 inline-flex min-h-11 items-center font-semibold text-primary-700 underline decoration-primary-300 underline-offset-4 dark:text-primary-300">{feature.action} →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {isHome ? (
        <section className="border-y border-surface-200 bg-surface-50 px-5 py-20 dark:border-white/10 dark:bg-surface-900 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-600 dark:text-primary-300">Einblick in unsere Arbeit</p>
              <h2 className="mt-4 text-3xl font-black sm:text-5xl">Keine leeren Versprechen. Reale Projekte.</h2>
              <p className="mt-5 max-w-xl leading-relaxed text-surface-600 dark:text-surface-300">Wir zeigen transparent, welche Probleme wir angegangen sind, wie wir Lösungen umgesetzt haben und was dokumentiert wurde. Unsere ausführlichen Projektberichte sind aktuell auf Englisch verfügbar.</p>
            </div>
            <div className="grid gap-4">
              <NextLink href="/en/work/i-love-my-honeypot-eco-ecommerce" hrefLang="en" className="rounded-2xl border border-surface-200 bg-white p-6 font-semibold transition-colors hover:border-primary-400 dark:border-white/10 dark:bg-surface-950">I Love My Honeypot · Shopify <span className="block pt-2 text-sm font-normal text-surface-500">Projektbericht auf Englisch ↗</span></NextLink>
              <NextLink href="/en/work/stiletto-piercing-disposable-jewelry-supply" hrefLang="en" className="rounded-2xl border border-surface-200 bg-white p-6 font-semibold transition-colors hover:border-primary-400 dark:border-white/10 dark:bg-surface-950">Stiletto Piercing · E-Commerce <span className="block pt-2 text-sm font-normal text-surface-500">Projektbericht auf Englisch ↗</span></NextLink>
            </div>
          </div>
        </section>
      ) : (
        <section className="border-y border-surface-200 bg-surface-50 px-5 py-20 dark:border-white/10 dark:bg-surface-900 md:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-black sm:text-4xl">Häufige Fragen</h2>
            <div className="mt-8 space-y-3">
              {faqs[kind].map(([question,answer]) => (
                <details key={question} className="group rounded-xl border border-surface-200 bg-white p-5 dark:border-white/10 dark:bg-surface-950">
                  <summary className="cursor-pointer text-lg font-semibold">{question}</summary>
                  <p className="mt-4 leading-relaxed text-surface-600 dark:text-surface-300">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-5 py-24 md:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-surface-950 p-9 text-center text-white sm:p-16">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-primary-300">Nächster Schritt</p>
          <h2 className="mt-5 text-3xl font-black sm:text-5xl">Erzähl uns von deinem Projekt.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-surface-200">Ob neue Website, erster Onlineshop oder konkretes technisches Problem: Wir schauen gemeinsam, was wirklich sinnvoll ist.</p>
          <Link href="/contact" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-7 py-3 font-bold text-surface-950 hover:bg-surface-100">Unverbindlich anfragen</Link>
        </div>
      </section>
    </>
  );
}
