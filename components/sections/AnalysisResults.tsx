'use client';

import { motion } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
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
  XCircle,
  Info,
} from 'lucide-react';
import { getScheduleUrl } from '@/lib/schedule';

interface AnalysisResultsProps {
  results: AnalysisResult;
  onReset: () => void;
}

const sectionIcons: Record<string, React.ElementType> = {
  performance: Zap,
  seo: Search,
  accessibility: CheckSquare,
  bestPractices: Award,
  cart: ShoppingCart,
  trust: Shield,
};

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results, onReset }) => {
  const t = useTranslations('analyzer');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getStatusLabel = (status: SectionResult['status']) => {
    return t(`results.status.${status}`);
  };

  const getStatusColor = (score: number) => {
    if (score >= 80)
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
      };
    if (score >= 50)
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-600 dark:text-amber-400',
      };
    return {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-600 dark:text-red-400',
    };
  };

  const getSectionColors = (key: string) => {
    const colors = {
      performance: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        icon: 'text-amber-600 dark:text-amber-400',
      },
      seo: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        icon: 'text-blue-600 dark:text-blue-400',
      },
      accessibility: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        icon: 'text-purple-600 dark:text-purple-400',
      },
      bestPractices: {
        bg: 'bg-teal-500/10',
        border: 'border-teal-500/20',
        icon: 'text-teal-600 dark:text-teal-400',
      },
      cart: {
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        icon: 'text-green-600 dark:text-green-400',
      },
      trust: {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        icon: 'text-rose-600 dark:text-rose-400',
      },
    };
    return colors[key as keyof typeof colors] || colors.performance;
  };

  type ExtendedRecommendation = Recommendation & { sectionKey: string; sectionName: string };

  const allRecommendations = Object.entries(results.sections).flatMap(([key, section]) =>
    section.recommendations.map(rec => ({ ...rec, sectionKey: key, sectionName: section.name }))
  );

  const priorityRecs = allRecommendations
    .filter(r => r.impact === 'high')
    .slice(0, 3) as ExtendedRecommendation[];

  if (priorityRecs.length < 3) {
    const mediumRecs = allRecommendations
      .filter(r => r.impact === 'medium')
      .slice(0, 3 - priorityRecs.length) as ExtendedRecommendation[];
    priorityRecs.push(...mediumRecs);
  }

  const overallStatus = getStatusColor(results.overallScore);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Clean Status Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-2xl ${overallStatus.bg} ${overallStatus.border} backdrop-blur-sm`}
      >
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl ${overallStatus.bg} ${overallStatus.border} shrink-0`}
              >
                {results.overallScore >= 80 ? (
                  <CheckCircle className={`w-6 h-6 ${overallStatus.text}`} />
                ) : (
                  <AlertTriangle className={`w-6 h-6 ${overallStatus.text}`} />
                )}
              </div>
              <div className="max-w-xl">
                <h3
                  className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-surface-900'} mb-2`}
                >
                  {results.overallScore >= 80
                    ? t('results.greatJob')
                    : priorityRecs.length === 1
                      ? t('results.issuesFound_singular', { count: priorityRecs.length })
                      : t('results.issuesFound', { count: priorityRecs.length })}
                </h3>
                <p
                  className={`text-sm md:text-base ${isDark ? 'text-white/70' : 'text-surface-600'}`}
                >
                  {results.overallScore >= 80
                    ? t('results.readyToScale')
                    : t('results.losingSales')}
                </p>
              </div>
            </div>
            <a href={getScheduleUrl()} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="bg-surface-900 dark:bg-white text-white dark:text-surface-900 hover:opacity-90"
              >
                <Calendar className="w-4 h-4 me-2" />
                {t('cta.fixIssues')}
              </Button>
            </a>
          </div>
        </div>
      </motion.div>

      {/* Main Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`border rounded-2xl ${isDark ? 'bg-surface-950/50 border-white/10' : 'bg-white border-surface-200 shadow-sm'}`}
      >
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="relative">
              <div
                className={`absolute inset-0 bg-primary-500/10 blur-3xl rounded-full ${isDark ? 'opacity-30' : 'opacity-0'}`}
              />
              <ScoreGauge score={results.overallScore} size="lg" showLabel={false} />
            </div>
            <div className="mt-4 text-center">
              <div
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${overallStatus.bg} ${overallStatus.border} ${overallStatus.text}`}
              >
                {getStatusLabel(
                  results.overallScore >= 80
                    ? 'excellent'
                    : results.overallScore >= 50
                      ? 'warning'
                      : 'critical'
                )}
              </div>
              {results.platform && (
                <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-surface-400'}`}>
                  {t('results.analyzedOn', { platform: results.platform })}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section Scores Grid */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-surface-900'}`}>
          {t('results.breakdown')}
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(results.sections).map(([key, section], index) => {
            const Icon = sectionIcons[key] || Zap;
            const colors = getSectionColors(key);
            const statusColor = getStatusColor(section.score);

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
                className={`border rounded-xl p-4 ${isDark ? 'bg-surface-950/30 border-white/5 hover:border-white/10' : 'bg-white border-surface-200 hover:border-surface-300'} transition-colors`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${colors.bg} ${colors.border}`}>
                      <Icon className={`w-4 h-4 ${colors.icon}`} />
                    </div>
                    <span
                      className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-surface-900'}`}
                    >
                      {t(`sections.${key}` as any)}
                    </span>
                  </div>
                  <span
                    className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-surface-900'}`}
                  >
                    {section.score}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor.bg} ${statusColor.border} ${statusColor.text}`}
                  >
                    {getStatusLabel(section.status)}
                  </span>
                </div>

                <div
                  className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-surface-100'}`}
                >
                  <motion.div
                    className={`h-full ${section.score >= 80 ? 'bg-emerald-500' : section.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${section.score}%` }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Priority Fixes */}
      {priorityRecs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-amber-500" />
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-surface-900'}`}>
              {t('results.priorityFixes')}
            </h3>
            <span className={`text-sm ${isDark ? 'text-white/50' : 'text-surface-500'}`}>
              ({priorityRecs.length} top issue{priorityRecs.length !== 1 ? 's' : ''})
            </span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priorityRecs.map((rec, index) => (
              <RecommendationCard
                key={index}
                title={rec.title}
                sectionName={rec.sectionName}
                impact={rec.impact}
                delay={0.55 + index * 0.08}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={`border rounded-2xl p-6 md:p-8 ${isDark ? 'bg-gradient-to-br from-primary-500/5 to-accent-500/5 border-primary-500/20' : 'bg-gradient-to-br from-surface-50 to-white border-surface-200 shadow-sm'}`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 max-w-2xl">
            <h3
              className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-surface-900'} mb-3`}
            >
              {t('results.dontLetIssuesHurtSales')}
            </h3>
            <p className={`text-base ${isDark ? 'text-white/70' : 'text-surface-600'} mb-6`}>
              {priorityRecs.length === 1
                ? t('results.expertsCanFix_singular', { count: priorityRecs.length })
                : t('results.expertsCanFix', { count: priorityRecs.length })}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${isDark ? 'border-surface-950 bg-surface-800' : 'border-white bg-surface-300'}`}
                  >
                    <div
                      className={`w-full h-full bg-gradient-to-br ${i === 1 ? 'from-blue-400 to-blue-600' : i === 2 ? 'from-purple-400 to-purple-600' : 'from-pink-400 to-pink-600'}`}
                    />
                  </div>
                ))}
              </div>
              <span className={isDark ? 'text-white/50' : 'text-surface-500'}>
                {t('results.trustedBy')}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href={getScheduleUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary-600 hover:bg-primary-500 text-white border-0 shadow-lg shadow-primary-500/25"
              >
                <Calendar className="w-4 h-4 me-2" />
                {t('cta.bookStrategyCall')}
                <ArrowRight className="w-4 h-4 ms-2" />
              </Button>
            </a>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className={`pt-6 border-t ${isDark ? 'border-white/10' : 'border-surface-200'}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Info className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-surface-400'}`} />
            <span className={isDark ? 'text-white/50' : 'text-surface-500'}>
              {t('results.fullReportSent')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className={
              isDark
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-surface-500 hover:text-surface-900 hover:bg-surface-100'
            }
          >
            <RefreshCw className="w-4 h-4 me-2" />
            {t('results.analyzeDifferentUrl')}
          </Button>
        </div>
      </div>
    </div>
  );
};
