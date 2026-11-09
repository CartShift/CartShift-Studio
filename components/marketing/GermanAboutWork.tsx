import NextLink from 'next/link';
import { Link } from '@/i18n/navigation';

export function GermanAboutPage() {
  return (
    <>
      <section className="bg-surface-950 px-5 py-24 text-white md:px-8 md:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-300">Über uns</p>
          <h1 className="mt-5 max-w-5xl text-4xl font-black leading-tight sm:text-6xl">Technik verstehen. Unternehmen verstehen. Beides zusammenbringen.</h1>
          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-surface-200">CartShift Studio entwickelt Websites, Onlineshops und digitale Produkte. Wir verbinden praktische Entwicklungserfahrung mit einem Blick für Nutzer, Geschäftsprozesse und langfristige Wartbarkeit.</p>
        </div>
      </section>
      <section className="px-5 py-24 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          <div><h2 className="text-3xl font-black sm:text-4xl">Persönlich statt anonymer Agenturprozess.</h2><p className="mt-6 leading-relaxed text-surface-600 dark:text-surface-300">Hinter CartShift stehen Yotam Faraggi und Adi Zelter. Yotam arbeitet als Senior Product Engineer in Berlin und bringt langjährige Full-Stack-Erfahrung ein. Adi verbindet Umsetzung mit Geschäftsstrategie und Kundenbetreuung.</p><p className="mt-4 leading-relaxed text-surface-600 dark:text-surface-300">Unser Ansatz ist einfach: erst verstehen, was ein Unternehmen wirklich braucht. Dann eine Lösung entwickeln, die sich sinnvoll betreiben und weiterentwickeln lässt.</p></div>
          <div className="rounded-3xl border border-surface-200 bg-surface-50 p-8 dark:border-white/10 dark:bg-surface-900"><h3 className="text-2xl font-bold">Wofür wir stehen</h3><ul className="mt-6 space-y-5 leading-relaxed text-surface-600 dark:text-surface-300"><li><strong>Klare Kommunikation.</strong> Verständliche Entscheidungen statt unnötigem Fachjargon.</li><li><strong>Saubere Umsetzung.</strong> Design, Funktion und technische Qualität gehören zusammen.</li><li><strong>Nachhaltige Lösungen.</strong> Keine unnötige Komplexität – sondern das, was dem Unternehmen tatsächlich hilft.</li></ul></div>
        </div>
      </section>
      <section className="border-t border-surface-200 px-5 py-20 text-center dark:border-white/10 md:px-8"><h2 className="text-3xl font-black">Lass uns dein Projekt kennenlernen.</h2><p className="mx-auto mt-4 max-w-xl text-surface-600 dark:text-surface-300">Wir beraten ehrlich, welches Vorgehen und welche Plattform zu deinen Zielen passen.</p><Link href="/contact" className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-primary-600 px-7 font-bold text-white">Kontakt aufnehmen</Link></section>
    </>
  );
}

const selectedProjects = [
  { name: 'I Love My Honeypot', platform: 'Shopify', detail: 'Strukturierte Einkaufserfahrung mit Produktberatung und klarem Weg durch den Katalog.', slug: 'i-love-my-honeypot-eco-ecommerce' },
  { name: 'Stiletto Piercing', platform: 'E-Commerce', detail: 'Arbeit an einer spezialisierten Commerce-Plattform mit Fokus auf Produktstruktur und Benutzerführung.', slug: 'stiletto-piercing-disposable-jewelry-supply' },
  { name: 'Alondon', platform: 'Web-Plattform', detail: 'Digitale Inhalte und Community-Funktionen für ein redaktionelles Angebot.', slug: 'alondon-community-portal' },
] as const;

export function GermanWorkPage() {
  return (
    <>
      <section className="bg-surface-950 px-5 py-24 text-white md:px-8 md:py-32"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-primary-300">Ausgewählte Arbeiten</p><h1 className="mt-5 text-4xl font-black sm:text-6xl">Unsere Projekte. Unsere Herangehensweise.</h1><p className="mt-7 max-w-3xl text-lg leading-relaxed text-surface-200">Ein Einblick in reale Projekte aus E-Commerce, Webentwicklung und digitalen Plattformen. Ausführliche technische Case Studies stehen derzeit auf Englisch zur Verfügung.</p></div></section>
      <section className="px-5 py-24 md:px-8"><div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">{selectedProjects.map(p => (
        <article key={p.slug} className="flex flex-col rounded-3xl border border-surface-200 bg-surface-50 p-7 dark:border-white/10 dark:bg-surface-900"><p className="text-sm font-bold text-primary-600 dark:text-primary-300">{p.platform}</p><h2 className="mt-5 text-2xl font-black">{p.name}</h2><p className="mt-5 flex-1 leading-relaxed text-surface-600 dark:text-surface-300">{p.detail}</p><NextLink href={`/en/work/${p.slug}`} hrefLang="en" className="mt-8 min-h-11 font-bold text-primary-700 underline underline-offset-4 dark:text-primary-300">Case Study ansehen (EN) ↗</NextLink></article>
      ))}</div></section>
      <section className="border-t border-surface-200 px-5 py-20 text-center dark:border-white/10"><h2 className="text-3xl font-black">Dein Projekt könnte das nächste sein.</h2><Link href="/contact" className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-primary-600 px-7 font-bold text-white">Projekt besprechen</Link></section>
    </>
  );
}
