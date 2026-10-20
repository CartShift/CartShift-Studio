import { setRequestLocale } from 'next-intl/server';
import '../portfolio-v5/portfolio-v5.css';
import '../portfolio-v5/portfolio-v5-refresh.css';
import '../portfolio-v5/portfolio-v5-immersive.css';
import '../portfolio-v5/portfolio-v5-motion.css';
import PortfolioMotion from '../portfolio-v5/PortfolioMotion';

// This is an independent personal portfolio, not a CartShift website/dashboard
// shell. Keep its runtime free of Firebase, auth, and the agency's UI providers.
export default async function YotamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale === 'he' ? 'he' : 'en');
  return <PortfolioMotion>{children}</PortfolioMotion>;
}
