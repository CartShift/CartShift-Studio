import './portfolio-v5.css';
import './portfolio-v5-refresh.css';
import './portfolio-v5-immersive.css';
import './portfolio-v5-motion.css';
import PortfolioMotion from './PortfolioMotion';

export default function PortfolioV5Layout({ children }: { children: React.ReactNode }) {
  return <PortfolioMotion>{children}</PortfolioMotion>;
}
