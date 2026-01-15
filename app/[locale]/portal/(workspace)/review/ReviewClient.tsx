'use client';

import { motion } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import { Star, Heart, TrendingUp, Award, Quote, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { TestimonialForm } from '@/components/portal/TestimonialForm';
import { useRouter } from '@/i18n/navigation';

// Why Share Card
function WhyShareCard() {
  const t = useTranslations('portal');
  const items = t.raw('testimonial.testimonial.whyShare.items') as Array<{
    title: string;
    description: string;
  }>;

  const icons = [TrendingUp, Heart, Award];
  const gradients = [
    'from-blue-500 to-cyan-500',
    'from-rose-500 to-pink-500',
    'from-amber-500 to-orange-500',
  ];

  return (
    <Card variant="gradient" className="overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute -top-20 -end-20 w-40 h-40 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -start-10 w-32 h-32 bg-accent-500/10 dark:bg-accent-500/5 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/25">
            <Quote className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
            {t('testimonial.testimonial.whyShare.title')}
          </h3>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className="flex items-start gap-3 group"
            >
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${gradients[index]} shadow-md shrink-0 group-hover:scale-110 transition-transform duration-200`}
              >
                {(() => {
                  const Icon = icons[index];
                  return <Icon className="w-4 h-4 text-white" />;
                })()}
              </div>
              <div>
                <h4 className="font-bold text-surface-900 dark:text-white text-sm">{item.title}</h4>
                <p className="text-sm text-surface-500 dark:text-surface-400">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Stats Card (Visual Appeal)
function StatsCard() {
  const t = useTranslations('portal');

  return (
    <Card variant="glass" className="overflow-hidden">
      <div className="text-center space-y-4 py-4">
        <motion.div
          className="flex items-center justify-center gap-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[1, 2, 3, 4, 5].map(star => (
            <motion.div
              key={star}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + star * 0.1 }}
            >
              <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
            </motion.div>
          ))}
        </motion.div>

        <div>
          <motion.p
            className="text-4xl font-black text-surface-900 dark:text-white font-outfit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            4.9
          </motion.p>
          <motion.p
            className="text-sm text-surface-500 dark:text-surface-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {t('testimonial.testimonial.statsCard.avgRating')}
          </motion.p>
        </div>

        <motion.div
          className="flex items-center justify-center gap-2 pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Sparkles className="w-4 h-4 text-accent-500" />
          <span className="text-xs font-medium text-surface-500 dark:text-surface-400">
            {t('testimonial.testimonial.statsCard.joinCommunity')}
          </span>
        </motion.div>
      </div>
    </Card>
  );
}

export default function ReviewClient() {
  const t = useTranslations('portal');
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect to dashboard after successful submission
    setTimeout(() => {
      router.push('/portal/dashboard/');
    }, 2000);
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Header */}
      <PageHeader title={t('testimonial.pageTitle')} description={t('testimonial.pageSubtitle')} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <TestimonialForm onSuccess={handleSuccess} />
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <WhyShareCard />
          <StatsCard />
        </div>
      </div>
    </div>
  );
}
