import '../portfolio-v5/portfolio-v5.css';
import '../portfolio-v5/portfolio-v5-refresh.css';
import '../portfolio-v5/portfolio-v5-immersive.css';
import '../portfolio-v5/portfolio-v5-motion.css';
import '../portfolio-v5/portfolio-v5-experience.css';
import '../portfolio-v5/portfolio-v5-editorial-next.css';
import '../portfolio-v5/yotam-alive.css';
import '../portfolio-v5/yotam-alive-labs.css';
import '../portfolio-v5/yotam-alive-widget.css';
import PortfolioMotion from '../portfolio-v5/PortfolioMotion';
import AliveExperience from '../portfolio-v5/AliveExperience';
import { getPortfolioShowcases } from '@/lib/portfolio-showcase';

export default async function PersonalPortfolioLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const language = locale === 'he' ? 'he' : 'en';
  return <>
    <PortfolioMotion>{children}</PortfolioMotion>
    <AliveExperience locale={language} projects={getPortfolioShowcases(language)} />
  </>;
}
