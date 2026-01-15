import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disableLink?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 'md', disableLink = false }) => {
  // 3.3:1 aspect ratio (1989x601) after cropping
  const sizeConfig = {
    sm: {
      width: 115,
      height: 35,
    },
    md: {
      width: 150,
      height: 45,
    },
    lg: {
      width: 200,
      height: 60,
    },
  };

  const config = sizeConfig[size];

  const content = (
    <div className="relative flex-shrink-0">
      <Image
        src="/images/CartShift-Logo-Full.svg"
        alt="CartShift Studio - E-commerce Development Agency"
        width={config.width}
        height={config.height}
        className="transition-all duration-300 drop-shadow-sm group-hover:drop-shadow-md dark:brightness-0 dark:invert"
        style={{ height: 'auto' }}
        priority
      />
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-accent-500/10 to-primary-500/0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-dropdown scale-105" />
    </div>
  );

  if (disableLink) {
    return (
      <div
        className={cn(
          'group flex items-center transition-all duration-300 hover:scale-[1.02]',
          className
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href="/"
      className={cn(
        'group flex items-center transition-all duration-300 hover:scale-[1.02]',
        className
      )}
    >
      {content}
    </Link>
  );
};
