'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { logWarn } from '@/lib/logger';
import {
  ShoppingCart,
  Globe,
  BarChart3,
  Target,
  Handshake,
  Zap,
  TrendingUp,
  Star,
  ArrowRight,
  ArrowLeft,
  Search,
  Palette,
  Code2,
  Rocket,
  Check,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
  Clock,
  Users,
  User,
  Heart,
  Award,
  Shield,
  Layers,
  Package,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDown,
  Eye,
  Linkedin,
  Twitter,
  Github,
  Briefcase,
  Tag,
  Calendar,
  MessageCircle,
  Info,
  Minus,
  Settings,
  Headphones,
  Folder,
  Activity,
  Monitor,
  Server,
  Lock,
  FileText,
  DollarSign,
  AlertTriangle,
  Bell,
  Building2,
  LogOut,
  LogIn,
  Loader2,
  type LucideProps,
} from 'lucide-react';

interface IconProps extends Omit<LucideProps, 'size'> {
  name: string;
  className?: string;
  size?: number;
}

const iconComponents: Record<string, React.ComponentType<LucideProps>> = {
  'shopping-cart': ShoppingCart,
  globe: Globe,
  'bar-chart': BarChart3,
  target: Target,
  handshake: Handshake,
  bolt: Zap,
  'chart-up': TrendingUp,
  star: Star,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  search: Search,
  palette: Palette,
  code: Code2,
  rocket: Rocket,
  check: Check,
  menu: Menu,
  x: X,
  sun: Sun,
  moon: Moon,
  sparkles: Sparkles,
  clock: Clock,
  users: Users,
  user: User,
  heart: Heart,
  award: Award,
  'trending-up': TrendingUp,
  shield: Shield,
  zap: Zap,
  layers: Layers,
  box: Package,
  layout: Layers,
  mail: Mail,
  phone: Phone,
  'map-pin': MapPin,
  'external-link': ExternalLink,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'arrow-up-right': ArrowUpRight,
  'arrow-down': ArrowDown,
  eye: Eye,
  linkedin: Linkedin,
  twitter: Twitter,
  github: Github,
  briefcase: Briefcase,
  tag: Tag,
  calendar: Calendar,
  'message-circle': MessageCircle,
  info: Info,
  minus: Minus,
  settings: Settings,
  headphones: Headphones,
  folder: Folder,
  activity: Activity,
  monitor: Monitor,
  server: Server,
  lock: Lock,
  'file-text': FileText,
  'dollar-sign': DollarSign,
  'alert-triangle': AlertTriangle,
  'log-in': LogIn,
  bell: Bell,
  building: Building2,
  'log-out': LogOut,
  loader: Loader2,
};

export const Icon: React.FC<IconProps> = ({ name, className = '', size = 24, ...props }) => {
  if (name === 'whatsapp') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(className)}
        aria-hidden="true"
        {...(props as React.SVGProps<SVGSVGElement>)}
      >
        <path
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  const IconComponent = iconComponents[name];

  if (!IconComponent) {
    logWarn(`Icon "${name}" not found`);
    // Return a fallback icon instead of null
    return (
      <div
        className={cn('inline-flex items-center justify-center', className)}
        style={{ width: size, height: size }}
      >
        ?
      </div>
    );
  }

  return (
    <IconComponent size={size} className={cn(className)} aria-hidden="true" {...(props as React.SVGProps<SVGSVGElement>)} />
  );
};
