import './portfolio-v5/portfolio-v5.css';
import './portfolio-v5/portfolio-v5-refresh.css';
import './portfolio-v5/portfolio-v5-immersive.css';
import './portfolio-v5/portfolio-v5-motion.css';
import PortfolioMotion from './portfolio-v5/PortfolioMotion';

export default function PortfolioSiteLayout({ children }: { children: React.ReactNode }) {
  return <PortfolioMotion>{children}</PortfolioMotion>;
}
