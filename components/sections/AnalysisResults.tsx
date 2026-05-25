'use client';

import { motion } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import { RecommendationCard } from '@/components/ui/RecommendationCard';
import type { AnalysisResult, SectionResult, Recommendation } from '@/lib/types/analyzer';
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
  Target,
  Smartphone,
  Monitor,
  Palette,
  Bot,
  Package,
  TrendingUp,
} from 'lucide-react';
import { getScheduleUrl } from '@/lib/schedule';
import { PRIORITY_RECOMMENDATIONS_COUNT } from '@/lib/constants/pricing';
import { ANIMATION_DELAY_STEP, ANIMATION_DURATION, ANIMATION_EASING } from '@/lib/constants/ui';

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

  const translateOptional = (key: string, fallback: string) =>
    t.has(key as any) ? t(key as any) : fallback;

  const getRecommendationCopy = (rec: Recommendation) => {
    if (!rec.code) return rec;
    const translationKey = rec.code.replace(/-/g, '_');

    return {
      ...rec,
      title: translateOptional(`recommendations.items.${translationKey}.title`, rec.title),
      description: rec.description
        ? translateOptional(`recommendations.items.${translationKey}.description`, rec.description)
        : undefined,
      action: rec.action
        ? translateOptional(`recommendations.items.${translationKey}.action`, rec.action)
        : undefined,
    };
  };

  const allRecommendations = Object.entries(results.sections).flatMap(([key, section]) =>
    section.recommendations.map(rec => ({
      ...getRecommendationCopy(rec),
      sectionKey: key,
      sectionName: t(`sections.${key}` as any),
    }))
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
  const highImpactCount = allRecommendations.filter(rec => rec.impact === 'high').length;
  const impactRank: Record<Recommendation['impact'], number> = { high: 0, medium: 1, low: 2 };
  const effortRank: Record<NonNullable<Recommendation['effort']>, number> = {
    quick: 0,
    medium: 1,
    advanced: 2,
  };
  const sortedRoadmapRecommendations = [...allRecommendations].sort((a, b) => {
    const impactDelta = impactRank[a.impact] - impactRank[b.impact];
    if (impactDelta !== 0) return impactDelta;

    return (effortRank[a.effort || 'medium'] || 1) - (effortRank[b.effort || 'medium'] || 1);
  });
  const usedRoadmapKeys = new Set<string>();
  const takeRoadmapItems = (
    predicate: (rec: ExtendedRecommendation) => boolean,
    limit = 2
  ): ExtendedRecommendation[] => {
    const items: ExtendedRecommendation[] = [];

    for (const rec of sortedRoadmapRecommendations as ExtendedRecommendation[]) {
      const key = `${rec.sectionKey}:${rec.code || rec.title}`;
      if (usedRoadmapKeys.has(key) || !predicate(rec)) continue;

      usedRoadmapKeys.add(key);
      items.push(rec);
      if (items.length >= limit) break;
    }

    return items;
  };
  const roadmapWeeks = [
    {
      key: 'week1',
      items: takeRoadmapItems(rec => rec.impact === 'high' || rec.effort === 'quick'),
    },
    {
      key: 'week2',
      items: takeRoadmapItems(rec => rec.sectionKey === 'performance'),
    },
    {
      key: 'week3',
      items: takeRoadmapItems(
        rec =>
          rec.sectionKey === 'seo' ||
          rec.sectionKey === 'accessibility' ||
          rec.sectionKey === 'bestPractices'
      ),
    },
    {
      key: 'week4',
      items: takeRoadmapItems(rec => rec.sectionKey === 'cart' || rec.sectionKey === 'trust'),
    },
  ]
    .map(week => ({
      ...week,
      items:
        week.items.length > 0
          ? week.items
          : takeRoadmapItems(() => true, week.key === 'week4' ? 3 : 2),
    }))
    .filter(week => week.items.length > 0);
  const headerTitle =
    results.overallScore >= 80 && highImpactCount > 0
      ? t('results.strongScoreWithIssues', { count: highImpactCount })
      : results.overallScore >= 80
        ? t('results.greatJob')
        : priorityRecs.length === 1
          ? t('results.issuesFound_singular', { count: priorityRecs.length })
          : t('results.issuesFound', { count: priorityRecs.length });
  const headerDescription =
    results.overallScore >= 80 && highImpactCount > 0
      ? t('results.strongScoreWithIssuesDesc')
      : results.overallScore >= 80
        ? t('results.readyToScale')
        : t('results.losingSales');

  const showPartialDataNotice = results.meta?.usedHtmlFallback;
  const screenshotsInEmail = Boolean(results.meta?.screenshotsInEmailReport);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {showPartialDataNotice && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            isDark ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-200 bg-amber-50'
          }`}
        >
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className={`text-sm ${isDark ? 'text-white/80' : 'text-surface-700'}`}>
            {t('results.partialDataNotice')}
          </p>
        </motion.div>
      )}

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
                  {headerTitle}
                </h3>
                <p
                  className={`text-sm md:text-base ${isDark ? 'text-white/70' : 'text-surface-600'}`}
                >
                  {headerDescription}
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
              {results.benchmark && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {t('results.verifiedBenchmark', {
                    percentile: results.benchmark.percentile,
                    count: results.benchmark.sampleSize,
                  })}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Competitor / Market Intelligence Section */}
      {results.competitorAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className={`border rounded-2xl p-6 md:p-8 ${isDark ? 'bg-surface-950/30 border-white/5' : 'bg-white border-surface-200 shadow-sm'}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20`}>
              <Target className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-surface-900'}`}>
                {t('market.title')}
              </h3>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-surface-500'}`}>
                {t('market.subtitle')}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Position Card */}
            <div
              className={`p-4 rounded-xl border ${isDark ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-indigo-50 border-indigo-100'}`}
            >
              <div className="text-sm font-medium text-indigo-500 mb-2">{t('market.position')}</div>
              <div
                className={`text-2xl font-bold capitalize ${isDark ? 'text-white' : 'text-surface-900'}`}
              >
                {t(`market.positions.${results.competitorAnalysis.marketPosition}` as any)}
              </div>
              <p className={`text-xs mt-2 ${isDark ? 'text-white/50' : 'text-surface-600'}`}>
                {results.competitorAnalysis.competitors.length > 0
                  ? t('market.summaryWithCandidates')
                  : t('market.summaryNoCandidates')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-500">
                  {t(`market.confidence.${results.competitorAnalysis.confidence}` as any)}
                </span>
                {results.competitorAnalysis.category && (
                  <span className="rounded-full border border-surface-500/20 bg-surface-500/10 px-2 py-1 text-xs text-surface-500 dark:text-white/60">
                    {results.competitorAnalysis.category}
                  </span>
                )}
              </div>
            </div>

            {/* Competitors List */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-surface-500 dark:text-white/50">
                {t('market.evidence')}
              </div>
              <div className="space-y-2">
                {[
                  results.competitorAnalysis.category
                    ? t('market.detectedCategory', {
                        category: results.competitorAnalysis.category,
                      })
                    : t('market.noCategory'),
                  results.competitorAnalysis.competitors.length > 0
                    ? t('market.candidatesFound', {
                        count: results.competitorAnalysis.competitors.length,
                      })
                    : t('market.noDirectCompetitors'),
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border px-3 py-2 text-xs ${isDark ? 'bg-surface-900/50 border-white/5 text-white/60' : 'bg-surface-50 border-surface-200 text-surface-600'}`}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="pt-2 text-sm font-medium text-surface-500 dark:text-white/50">
                {t('market.competitorCandidates')}
              </div>
              {results.competitorAnalysis.competitors.length > 0 ? (
                results.competitorAnalysis.competitors.map((comp, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${isDark ? 'bg-surface-900/50 border-white/5' : 'bg-surface-50 border-surface-200'}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-bold text-white">
                        {comp.name.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`truncate font-medium text-sm ${isDark ? 'text-white' : 'text-surface-900'}`}
                        >
                          {comp.name}
                        </div>
                        <div className="truncate text-xs text-indigo-400">
                          {comp.url.replace('https://', '')}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-end">
                      <div className="text-xs font-medium text-surface-500">
                        {t('market.similarity')}
                      </div>
                      <div className="text-sm font-bold text-indigo-500">
                        {comp.similarityScore}%
                      </div>
                      <div className="text-[10px] text-surface-400">
                        {t(`market.confidence.${comp.confidence}` as any)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  className={`rounded-lg border px-3 py-3 text-sm ${isDark ? 'bg-surface-900/50 border-white/5 text-white/60' : 'bg-surface-50 border-surface-200 text-surface-600'}`}
                >
                  {t('market.noCompetitors')}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Visual Analysis Section */}
      {results.visualAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className={`border rounded-2xl p-6 md:p-8 ${isDark ? 'bg-surface-950/30 border-white/5' : 'bg-white border-surface-200 shadow-sm'}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg bg-pink-500/10 border border-pink-500/20`}>
              <Palette className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-surface-900'}`}>
                Visual UX Analysis
              </h3>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-surface-500'}`}>
                Design quality and mobile responsiveness check
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Screenshots */}
            <div className="space-y-4">
              <h4
                className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-surface-600'}`}
              >
                Captured Previews
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {results.visualAnalysis.screenshots.length > 0 ? (
                  results.visualAnalysis.screenshots.map((shot, i) => (
                    <div key={i} className="space-y-2">
                      <div
                        className={`aspect-video rounded-lg overflow-hidden border ${isDark ? 'border-white/10' : 'border-surface-200'} bg-surface-100 dark:bg-surface-800 relative group`}
                      >
                        <img
                          src={shot.url}
                          alt={shot.label}
                          className="w-full h-full object-cover object-top transition-transform duration-500"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 backdrop-blur-sm text-center">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-white font-medium">
                            {shot.device === 'mobile' ? (
                              <Smartphone className="w-3 h-3" />
                            ) : (
                              <Monitor className="w-3 h-3" />
                            )}
                            {shot.label}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className={`col-span-2 rounded-lg border p-4 text-sm ${
                      isDark
                        ? 'border-white/10 bg-white/5 text-white/70'
                        : 'border-surface-200 bg-surface-50 text-surface-600'
                    }`}
                  >
                    {screenshotsInEmail
                      ? t('results.screenshotsInEmail')
                      : t('results.screenshotsUnavailable')}
                  </div>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-6">
              {/* Colors */}
              <div>
                <h4
                  className={`text-sm font-medium mb-3 ${isDark ? 'text-white/70' : 'text-surface-600'}`}
                >
                  Brand Color Palette
                </h4>
                <div className="flex items-center gap-2">
                  {results.visualAnalysis.dominantColors.map((color, i) => (
                    <div key={i} className="group relative">
                      <div
                        className="w-12 h-12 rounded-full border-2 border-white dark:border-surface-900 shadow-md transition-transform hover:scale-110 hover:z-10 cursor-help"
                        style={{ backgroundColor: color }}
                      />
                      <span className="absolute -bottom-8 start-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 transition-opacity whitespace-nowrap pointer-events-none z-20">
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Score */}
              <div
                className={`p-4 rounded-xl border ${isDark ? 'bg-surface-900/50 border-white/5' : 'bg-surface-50 border-surface-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-medium ${isDark ? 'text-white' : 'text-surface-900'}`}
                  >
                    Mobile Responsiveness
                  </span>
                  <span
                    className={`text-lg font-bold ${results.visualAnalysis.mobileResponsivenessScore >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}
                  >
                    {Math.round(results.visualAnalysis.mobileResponsivenessScore)}/100
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${results.visualAnalysis.mobileResponsivenessScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${results.visualAnalysis.mobileResponsivenessScore}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Readiness Section */}
      {results.aiAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className={`border rounded-2xl p-6 md:p-8 ${isDark ? 'bg-surface-950/30 border-white/5' : 'bg-white border-surface-200 shadow-sm'}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg bg-teal-500/10 border border-teal-500/20`}>
              <Bot className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-surface-900'}`}>
                {t('ai.title')}
              </h3>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-surface-500'}`}>
                {t('ai.subtitle')}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Score & Status */}
            <div
              className={`flex flex-col justify-center p-5 rounded-xl border text-center ${isDark ? 'bg-teal-500/5 border-teal-500/10' : 'bg-teal-50 border-teal-100'}`}
            >
              <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-1">
                {results.aiAnalysis.score}/100
              </div>
              <div className="text-sm font-medium uppercase tracking-wide text-teal-600/70 mb-4">
                {t(`ai.status.${results.aiAnalysis.aiReadinessStatus}` as any)}
              </div>
              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-surface-600'}`}>
                {t('ai.scoreHelp')}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <div
                  className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-white/40' : 'text-surface-500'}`}
                >
                  {t('ai.structuredData')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.aiAnalysis.structuredDataTypes.length > 0 ? (
                    results.aiAnalysis.structuredDataTypes.map((type, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-medium border border-teal-500/20"
                      >
                        {type}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-surface-500 italic">{t('ai.noSchema')}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div
                    className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-white/40' : 'text-surface-500'}`}
                  >
                    {t('ai.readability')}
                  </div>
                  <div
                    className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-surface-900'}`}
                  >
                    {results.aiAnalysis.readabilityScore}/100
                  </div>
                </div>
                <div>
                  <div
                    className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-white/40' : 'text-surface-500'}`}
                  >
                    {t('ai.socialContext')}
                  </div>
                  <div
                    className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-surface-900'}`}
                  >
                    {results.aiAnalysis.openGraphTags ? t('common.detected') : t('common.missing')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Product Page Analysis Section */}
      {results.productAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className={`border rounded-2xl p-6 md:p-8 ${isDark ? 'bg-surface-950/30 border-white/5' : 'bg-white border-surface-200 shadow-sm'}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg bg-orange-500/10 border border-orange-500/20`}>
              <Package className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-surface-900'}`}>
                {t('product.title')}
              </h3>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-surface-500'}`}>
                {t('product.subtitle')}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${isDark ? 'bg-orange-500/5 border-orange-500/10' : 'bg-orange-50 border-orange-100'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    {t('product.conversionScore')}
                  </span>
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {results.productAnalysis.score}/100
                  </span>
                </div>
                <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${results.productAnalysis.score}%` }}
                  />
                </div>
              </div>

              <div className="text-xs text-surface-500">
                {t('product.analyzed')}:{' '}
                <a
                  href={results.productAnalysis.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary-500 truncate inline-block max-w-[200px] align-bottom"
                >
                  {results.productAnalysis.productUrl}
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div
                className={`p-3 rounded-lg border ${results.productAnalysis.hasBuyButtonAboveFold ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}
              >
                <span className="block text-xs uppercase opacity-70 mb-1">
                  {t('product.buyButton')}
                </span>
                <span className="font-semibold">
                  {results.productAnalysis.hasBuyButtonAboveFold
                    ? t('product.aboveFold')
                    : t('product.belowFold')}
                </span>
              </div>
              <div
                className={`p-3 rounded-lg border ${results.productAnalysis.imageCount > 3 ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'}`}
              >
                <span className="block text-xs uppercase opacity-70 mb-1">
                  {t('product.gallery')}
                </span>
                <span className="font-semibold">
                  {t('product.images', { count: results.productAnalysis.imageCount })}
                </span>
              </div>
              <div
                className={`p-3 rounded-lg border ${results.productAnalysis.hasReviews ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'}`}
              >
                <span className="block text-xs uppercase opacity-70 mb-1">
                  {t('product.socialProof')}
                </span>
                <span className="font-semibold">
                  {results.productAnalysis.hasReviews
                    ? t('product.reviewsFound')
                    : t('product.noReviews')}
                </span>
              </div>
              <div
                className={`p-3 rounded-lg border ${results.productAnalysis.descriptionLength > 200 ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-gray-500/10 border-gray-500/20 text-gray-600'}`}
              >
                <span className="block text-xs uppercase opacity-70 mb-1">
                  {t('product.content')}
                </span>
                <span className="font-semibold">
                  {results.productAnalysis.descriptionLength > 200
                    ? t('product.detailed')
                    : t('product.brief')}
                </span>
              </div>
              <div
                className={`p-3 rounded-lg border ${results.productAnalysis.cartActionabilityStatus === 'clickable' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600' : 'bg-surface-500/10 border-surface-500/20 text-surface-600'}`}
              >
                <span className="block text-xs uppercase opacity-70 mb-1">
                  {t('product.checkoutFlow')}
                </span>
                <span className="font-semibold capitalize">
                  {t(
                    `product.cartStatus.${results.productAnalysis.cartActionabilityStatus}` as any
                  )}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

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
                transition={{ delay: 0.15 + index * ANIMATION_DELAY_STEP }}
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
                    transition={{
                      delay: 0.3 + index * ANIMATION_DELAY_STEP * 1.25,
                      duration: ANIMATION_DURATION,
                      ease: ANIMATION_EASING,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 30 Day Roadmap */}
      {roadmapWeeks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: PRIORITY_RECOMMENDATIONS_COUNT * ANIMATION_DELAY_STEP * 0.4 }}
          className={`border rounded-2xl p-6 md:p-8 ${isDark ? 'bg-surface-950/30 border-white/5' : 'bg-white border-surface-200 shadow-sm'}`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Calendar className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-surface-900'}`}>
                {t('roadmap.title')}
              </h3>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-surface-500'}`}>
                {t('roadmap.subtitle')}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roadmapWeeks.map((week, index) => (
              <div
                key={week.key}
                className={`rounded-xl border p-4 ${isDark ? 'bg-surface-900/50 border-white/5' : 'bg-surface-50 border-surface-200'}`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {index + 1}
                  </div>
                  <div>
                    <div
                      className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-surface-900'}`}
                    >
                      {t(`roadmap.weeks.${week.key}.title` as any)}
                    </div>
                    <div className={isDark ? 'text-xs text-white/40' : 'text-xs text-surface-500'}>
                      {t(`roadmap.weeks.${week.key}.focus` as any)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {week.items.map(item => (
                    <div
                      key={`${item.sectionKey}:${item.code || item.title}`}
                      className="space-y-1"
                    >
                      <div
                        className={`text-sm font-medium leading-snug ${isDark ? 'text-white/85' : 'text-surface-800'}`}
                      >
                        {item.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            item.impact === 'high'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : item.impact === 'medium'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-surface-500/10 text-surface-500 dark:text-white/50'
                          }`}
                        >
                          {t(`impact.${item.impact}` as any)}
                        </span>
                        <span
                          className={
                            isDark ? 'text-[11px] text-white/40' : 'text-[11px] text-surface-500'
                          }
                        >
                          {item.sectionName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Priority Fixes */}
      {priorityRecs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: PRIORITY_RECOMMENDATIONS_COUNT * ANIMATION_DELAY_STEP * 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-amber-500" />
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-surface-900'}`}>
              {t('results.priorityFixes')}
            </h3>
            <span className={`text-sm ${isDark ? 'text-white/50' : 'text-surface-500'}`}>
              {t('results.topIssues', { count: priorityRecs.length })}
            </span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priorityRecs.map((rec, index) => (
              <RecommendationCard
                key={index}
                title={rec.title}
                description={rec.description}
                action={rec.action}
                evidence={rec.evidence}
                effort={rec.effort}
                sectionName={rec.sectionName}
                impact={rec.impact}
                delay={
                  PRIORITY_RECOMMENDATIONS_COUNT * ANIMATION_DELAY_STEP * 0.55 +
                  index * ANIMATION_DELAY_STEP
                }
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: PRIORITY_RECOMMENDATIONS_COUNT * ANIMATION_DELAY_STEP * 0.7 }}
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
