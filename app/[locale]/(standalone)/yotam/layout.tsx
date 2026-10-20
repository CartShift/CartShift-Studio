import '../portfolio-v5/portfolio-v5.css';
import '../portfolio-v5/portfolio-v5-refresh.css';
import '../portfolio-v5/portfolio-v5-immersive.css';
import '../portfolio-v5/portfolio-v5-motion.css';
import '../portfolio-v5/portfolio-v5-experience.css';
import '../portfolio-v5/portfolio-v5-editorial-next.css';
import '../portfolio-v5/yotam-alive.css';
import PortfolioMotion from '../portfolio-v5/PortfolioMotion';

export default function PersonalPortfolioLayout({ children }: { children: React.ReactNode }) {
  return <PortfolioMotion>{children}</PortfolioMotion>;
}
