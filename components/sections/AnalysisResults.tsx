'use client';

import { motion } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import { RecommendationCard } from '@/components/ui/RecommendationCard';
import type { AnalysisResult, SectionResult, Recommendation } from './StoreAnalyzerContent';
import {
  Zap,
  Search,
  ShoppingCart,
  Shield,
  CheckSquare,
  Award,
  RefreshCw,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { getScheduleUrl } from '@/lib/schedule';
import { useDirection } from '@/lib/i18n-utils';

interface AnalysisResultsProps {
  results: AnalysisResult;
  onReset: () => void;
  variant?: 'default' | 'dark';
}

const sectionIcons: Record<string, React.ElementType> = {
  performance: Zap,
  seo: Search,
  accessibility: CheckSquare,
  bestPractices: Award,
  cart: ShoppingCart,
  trust: Shield,
};

const sectionGradients: Record<string, string> = {
  performance: 'from-amber-500 to-orange-600',
  seo: 'from-blue-500 to-cyan-600',
  accessibility: 'from-purple-500 to-pink-600',
  bestPractices: 'from-teal-500 to-emerald-600',
  cart: 'from-green-500 to-lime-600',
  trust: 'from-rose-500 to-red-600',
};

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  results,
  onReset,
  variant = 'default',
}) => {
  const t = useTranslations();
  const direction = useDirection();
  const isRtl = direction === 'rtl';
  const isDark = variant === 'dark';

  const getStatusLabel = (status: SectionResult['status']) => {
    switch (status) {
      case 'excellent':
        return t('analyzer.results.status.excellent') || 'Excellent';
      case 'good':
        return t('analyzer.results.status.good') || 'Good';
      case 'warning':
        return t('analyzer.results.status.warning') || 'Needs Work';
      case 'critical':
        return t('analyzer.results.status.critical') || 'Critical';
    }
  };

  // Type for the extended recommendation
  type ExtendedRecommendation = Recommendation & { sectionKey: string; sectionName: string };

  const allRecommendations = Object.entries(results.sections).flatMap(([key, section]) =>
    section.recommendations.map(rec => ({ ...rec, sectionKey: key, sectionName: section.name }))
  );

  // Sort by impact 'high' then take top 3
  const priorityRecs = allRecommendations
    .filter(r => r.impact === 'high')
    .slice(0, 3) as ExtendedRecommendation[];

  // Fallback if no high impact items (show medium)
  if (priorityRecs.length < 3) {
    const mediumRecs = allRecommendations
      .filter(r => r.impact === 'medium')
      .slice(0, 3 - priorityRecs.length) as ExtendedRecommendation[];
    priorityRecs.push(...mediumRecs);
  }

  const cardClass = isDark
    ? 'bg-surface-950/90 border border-white/10 backdrop-blur-xl rounded-xl'
    : 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-premium';

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Dynamic Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl shadow-2xl"
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r ${
            results.overallScore >= 80
              ? 'from-emerald-600 to-teal-700'
              : results.overallScore >= 50
                ? 'from-amber-600 to-orange-700'
                : 'from-red-600 to-rose-700'
          }`}
        />

        {/* Abstract Pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 L100 0 L100 100 Z" fill="white" />
          </svg>
        </div>

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-start gap-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                {results.overallScore >= 80 ? (
                  <CheckCircle className="w-8 h-8 text-white drop-shadow-md" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-white drop-shadow-md" />
                )}
              </div>
              <div className="max-w-xl">
                <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                  {results.overallScore >= 80
                    ? t('analyzer.results.greatJob') || 'Great Job! Your store is optimized.'
                    : t('analyzer.results.issuesFound', { count: priorityRecs.length }) ||
                      `Attention Needed: ${priorityRecs.length} Critical Issues Detected`}
                </h3>
                <p className="text-white/90 text-base leading-relaxed">
                  {results.overallScore >= 80
                    ? t('analyzer.results.readyToScale') ||
                      'Your store metrics are healthy. You are ready to scale locally and globally.'
                    : t('analyzer.results.losingSales') ||
                      'These issues are likely effecting your SEO ranking and conversion rates. We recommend fixing them immediately.'}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 w-full md:w-auto">
              <a
                href={getScheduleUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto"
              >
                <Button
                  size="lg"
                  className="w-full md:w-auto bg-white text-surface-900 hover:bg-surface-50 font-bold border-0 shadow-lg"
                >
                  <Calendar className="w-5 h-5 me-2" />
                  {t('analyzer.cta.fixIssues') || 'Schedule Review'}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Results Grid */}
      <div className="flex flex-col-reverse lg:block gap-6 lg:space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Overall Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`${cardClass} flex flex-col`}
          >
            <div className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <p
                className={`text-sm font-semibold uppercase tracking-wider mb-6 ${isDark ? 'text-white/50' : 'text-surface-500'}`}
              >
                {t('analyzer.results.overallScore') || 'Overall Health Score'}
              </p>

              <div className="relative mb-6">
                <div
                  className={`absolute inset-0 bg-primary-500/20 blur-3xl rounded-full ${isDark ? 'opacity-30' : 'opacity-0'}`}
                />
                <ScoreGauge score={results.overallScore} size="lg" showLabel={false} />
              </div>

              <div className="flex flex-col gap-3 w-full max-w-[200px]">
                <div
                  className={`text-center py-2 px-4 rounded-lg border ${
                    results.overallScore >= 80
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                      : results.overallScore >= 50
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}
                >
                  <span className="font-bold text-lg">
                    {getStatusLabel(
                      results.overallScore >= 80
                        ? 'excellent'
                        : results.overallScore >= 50
                          ? 'warning'
                          : 'critical'
                    )}
                  </span>
                </div>
                {results.platform && (
                  <p className={`text-xs ${isDark ? 'text-white/30' : 'text-surface-400'}`}>
                    {t('analyzer.results.analyzedOn', { platform: results.platform }) ||
                      `Analyzed on ${results.platform}`}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Section Scores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`lg:col-span-2 ${cardClass}`}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <h3
                  className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-surface-900 dark:text-white'}`}
                >
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                  {t('analyzer.results.breakdown') || 'Performance Breakdown'}
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(results.sections).map(([key, section], index) => {
                  const Icon = sectionIcons[key] || Zap;
                  const gradient = sectionGradients[key];

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/[0.08]' : 'bg-surface-50 border-surface-100'} transition-all hover:border-primary-500/30 group`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span
                              className={`block font-bold text-sm leading-tight mb-1 ${isDark ? 'text-white' : 'text-surface-900 dark:text-white'}`}
                            >
                              {(() => {
                                const translationKey = `analyzer.sections.${key}` as const;
                                const translated = t(translationKey as any);
                                return typeof translated === 'string' ? translated : section.name;
                              })()}
                            </span>
                            <span
                              className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                section.status === 'excellent'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : section.status === 'good'
                                    ? 'bg-green-500/10 text-green-500'
                                    : section.status === 'warning'
                                      ? 'bg-amber-500/10 text-amber-500'
                                      : 'bg-red-500/10 text-red-500'
                              }`}
                            >
                              {getStatusLabel(section.status)}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-surface-900 dark:text-white'}`}
                        >
                          {section.score}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div
                        className={`relative h-2 rounded-full overflow-hidden ${isDark ? 'bg-black/40' : 'bg-surface-200'}`}
                      >
                        <motion.div
                          className={`absolute inset-y-0 start-0 rounded-full ${
                            section.score >= 80
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                              : section.score >= 60
                                ? 'bg-gradient-to-r from-green-500 to-green-400'
                                : section.score >= 40
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                                  : 'bg-gradient-to-r from-red-500 to-red-400'
                          }`}
                          initial={{ width: '0%' }}
                          animate={{ width: `${section.score}%` }}
                          transition={{
                            delay: 0.5 + index * 0.1,
                            duration: 1,
                            type: 'spring',
                            bounce: 0,
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Priority Recommendations & CTA Combo */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Recs */}
          <div className="lg:col-span-3 h-full">
            {priorityRecs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className={`${isDark ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'} rounded-xl p-6 h-full flex flex-col`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3
                      className={`text-lg font-bold ${isDark ? 'text-white' : 'text-surface-900'}`}
                    >
                      {t('analyzer.results.priorityFixes') || 'Action Required: Top Issues'}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-white/50' : 'text-surface-500'}`}>
                      {t('analyzer.results.prioritySubtitle') ||
                        'Focus on these high-impact items first to improve your score.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 flex-grow">
                  {priorityRecs.map((rec, index) => (
                    <RecommendationCard
                      key={index}
                      title={rec.title}
                      sectionName={rec.sectionName}
                      impact={rec.impact}
                      delay={0.7 + index * 0.1}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Final CTA Card */}
          <div className="lg:col-span-2 h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className={`h-full flex flex-col justify-between p-8 rounded-xl relative overflow-hidden ${
                isDark
                  ? 'bg-gradient-to-br from-surface-900 to-surface-950 border border-primary-500/30'
                  : 'bg-gradient-to-br from-surface-50 to-white border border-surface-200 shadow-premium'
              }`}
            >
              {/* Glow effect */}
              <div className="absolute top-0 end-0 -me-20 -mt-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-dropdown">
                <h3
                  className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-surface-900'}`}
                >
                  {t('analyzer.results.dontLetIssuesHurtSales') ||
                    "Don't Let These Issues Hurt Sales"}
                </h3>
                <p
                  className={`text-base mb-8 leading-relaxed ${isDark ? 'text-white/70' : 'text-surface-600'}`}
                >
                  {t('analyzer.results.expertsCanFix', { count: priorityRecs.length }) ||
                    `Our experts can fix these ${priorityRecs.length} critical errors for you. Book a free consultation to verify the plan.`}
                </p>
              </div>

              <div className="mt-auto space-y-5 relative z-dropdown">
                <a
                  href={getScheduleUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button
                    size="lg"
                    className="w-full text-lg py-6 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 border-0 shadow-lg shadow-primary-500/25 group"
                  >
                    <Calendar className="w-5 h-5 me-2 group-hover:animate-pulse" />
                    {t('analyzer.cta.bookStrategyCall') || 'Book Strategy Call'}
                    <ArrowRight className="w-5 h-5 ms-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Button>
                </a>

                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center overflow-hidden ${isDark ? 'border-surface-900 bg-surface-800' : 'border-white bg-surface-200'}`}
                      >
                        {/* Placeholder avatars since we don't have user images handy in this context, using icons or gradients */}
                        <div
                          className={`w-full h-full bg-gradient-to-br ${i === 1 ? 'from-blue-400 to-blue-600' : i === 2 ? 'from-purple-400 to-purple-600' : 'from-pink-400 to-pink-600'}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-bold ${isDark ? 'text-white' : 'text-surface-900'}`}
                    >
                      50+ Stores
                    </span>
                    <span className={`text-xs ${isDark ? 'text-white/40' : 'text-surface-500'}`}>
                      {t('analyzer.results.trustedBy') || 'Optimized this month'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="text-center pt-8 border-t border-white/5">
        <p className={`text-sm mb-4 ${isDark ? 'text-white/40' : 'text-surface-500'}`}>
          {t('analyzer.results.fullReportSent') ||
            'Full detailed report has been sent to your email.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
        >
          <RefreshCw className="w-4 h-4 me-2" />
          {t('analyzer.results.analyzeDifferentUrl') || 'Analyze a different URL'}
        </Button>
      </div>
    </div>
  );
};
