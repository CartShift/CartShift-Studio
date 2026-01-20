# Icon System - Lucide React

This project uses **[Lucide React](https://lucide.dev/)**, a beautiful, consistent, and fully free (MIT licensed) icon library with over 1,000+ icons.

## Features

- ✅ **Fully Free** - MIT licensed
- ✅ **Tree-shakeable** - Only imports what you use
- ✅ **TypeScript Support** - Full type safety
- ✅ **Consistent Design** - All icons follow the same design system
- ✅ **Customizable** - Easy to style with className, size, color, strokeWidth
- ✅ **1000+ Icons** - Comprehensive icon collection

## Installation

Already installed! The library is available via:

```bash
npm install lucide-react
```

## Usage

### Method 1: Direct Import (Recommended)

Import icons directly from `lucide-react` for best tree-shaking:

```tsx
import { ArrowRight, Check, Star } from 'lucide-react';

function MyComponent() {
  return (
    <div>
      <ArrowRight className="w-6 h-6 text-blue-500" />
      <Check className="w-5 h-5 text-green-500" strokeWidth={2.5} />
      <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
    </div>
  );
}
```

### Method 2: Using Helper Exports

For commonly used icons, import from our helper file:

```tsx
import { ArrowRight, Check, Mail, Clock } from '@/components/ui/icons';

function MyComponent() {
  return (
    <div className="flex gap-4">
      <Mail className="w-6 h-6 text-primary-600" />
      <Clock className="w-6 h-6 text-accent-600" />
    </div>
  );
}
```

### Method 3: Using the Icon Component

For backward compatibility with existing code, use the `Icon` component:

```tsx
import { Icon } from '@/components/ui/Icon';

function MyComponent() {
  return <Icon name="shopping-cart" size={24} className="text-primary-500" />;
}
```

## Customization

### Size

```tsx
<ArrowRight size={16} />  // Small
<ArrowRight size={24} />  // Medium (default)
<ArrowRight size={32} />  // Large
<ArrowRight className="w-6 h-6" /> // Or use Tailwind
```

### Color

```tsx
<Check className="text-green-500" />
<Check className="text-primary-600 dark:text-primary-400" />
<Check style={{ color: '#3b82f6' }} />
```

### Stroke Width

```tsx
<ArrowRight strokeWidth={1} />    // Thin
<ArrowRight strokeWidth={1.5} />  // Regular (default)
<ArrowRight strokeWidth={2.5} />  // Bold
```

### Fill

Most icons are stroked, but some can be filled:

```tsx
<Star className="text-yellow-500" fill="currentColor" />
<Heart className="text-red-500" fill="currentColor" />
```

## Animation Examples

### With Framer Motion

```tsx
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

function AnimatedButton() {
  return (
    <button className="flex items-center gap-2">
      Get Started
      <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
        <ArrowRight className="w-5 h-5" />
      </motion.div>
    </button>
  );
}
```

### Rotating Icon

```tsx
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';

function LoadingSpinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <Loader className="w-6 h-6" />
    </motion.div>
  );
}
```

## Common Icon Categories

### Navigation

- `ArrowRight`, `ArrowLeft`, `ArrowUp`, `ArrowDown`
- `ChevronRight`, `ChevronLeft`, `ChevronUp`, `ChevronDown`
- `Menu`, `X`, `Home`, `ExternalLink`

### Actions

- `Check`, `CheckCircle`, `X`, `XCircle`
- `Plus`, `Minus`, `Edit`, `Trash`, `Copy`
- `Search`, `Filter`, `Settings`, `Share`

### Communication

- `Mail`, `Phone`, `MessageCircle`, `Send`
- `Bell`, `BellOff`, `Inbox`

### E-commerce

- `ShoppingCart`, `Package`, `Truck`, `CreditCard`
- `DollarSign`, `Tag`, `Bookmark`

### UI Elements

- `Sun`, `Moon`, `Star`, `Heart`
- `Eye`, `EyeOff`, `Lock`, `Unlock`
- `Upload`, `Download`, `Image`, `File`

### Business

- `Briefcase`, `Users`, `User`, `Building`
- `TrendingUp`, `TrendingDown`, `BarChart`, `PieChart`
- `Award`, `Trophy`, `Target`, `Rocket`

### Time & Location

- `Clock`, `Calendar`, `MapPin`, `Globe`

### Social & Brands

- `Facebook`, `Twitter`, `Instagram`, `Linkedin`, `Youtube`
- `Github`, `Gitlab`, `Figma`, `Slack`

## Finding Icons

Browse all available icons at: [https://lucide.dev/icons](https://lucide.dev/icons)

The icon names in Lucide React use PascalCase (e.g., `ArrowRight`, `ShoppingCart`, `MessageCircle`).

## TypeScript Support

All icons are fully typed:

```tsx
import { type LucideIcon, ArrowRight } from 'lucide-react';

interface ButtonProps {
  icon: LucideIcon;
  label: string;
}

function IconButton({ icon: Icon, label }: ButtonProps) {
  return (
    <button>
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

// Usage
<IconButton icon={ArrowRight} label="Next" />;
```

## Accessibility

Icons should have appropriate aria attributes:

```tsx
// Decorative icons (most common)
<ArrowRight aria-hidden="true" />

// Meaningful icons
<Search aria-label="Search" role="img" />
```

## Performance Tips

1. **Direct imports** - Always import specific icons, never import all
2. **Tree-shaking** - Webpack/Vite will automatically remove unused icons
3. **Shared components** - Create reusable components for frequently used icon patterns

## Examples from This Project

Check out these components for real-world usage:

- `components/ui/ThemeToggle.tsx` - Animated theme switching
- `components/sections/Hero.tsx` - CTA buttons with animated icons
- `components/sections/StatsCounter.tsx` - Icons with statistics
- `components/sections/ContactPageContent.tsx` - Form with contextual icons
- `components/ui/FAQ.tsx` - Accordion with rotating chevron

## Migration Notes

Previously, this project used custom SVG paths in the `Icon` component. The new system:

- Maintains backward compatibility through the `Icon` component
- Provides better icons with consistent design
- Offers more flexibility and customization
- Ensures better maintenance and updates

Old icon names are automatically mapped to Lucide equivalents in `components/ui/Icon.tsx`.
