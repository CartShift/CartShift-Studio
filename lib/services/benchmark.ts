import { adminDb } from '@/lib/firebase-admin';
import { AnalysisResult } from '@/lib/types/analyzer';
import { CompetitorService } from '@/lib/services/competitor-service';

export class BenchmarkService {
  static async saveBenchmark(result: AnalysisResult, html: string): Promise<void> {
    if (!adminDb) return;

    try {
      const category = CompetitorService.detectCategory(html) || 'general';

      await adminDb.collection('benchmarks').add({
        category,
        overallScore: result.overallScore,
        performanceScore: result.sections.performance.score,
        seoScore: result.sections.seo.score,
        conversionScore: result.productAnalysis?.score || 0,
        platform: result.platform || 'unknown',
        createdAt: new Date(),
      });
    } catch (e) {
      console.error('Failed to save benchmark', e);
    }
  }

  static async getPercentile(score: number, html: string): Promise<number> {
    const category = CompetitorService.detectCategory(html) || 'general';

    /** Estimated percentile when benchmark DB is unavailable or has insufficient data. */
    const fallbackPercentile = (s: number) => {
      if (s >= 95) return 99;
      if (s >= 85) return 92;
      if (s >= 70) return 75;
      if (s >= 55) return 50;
      if (s >= 40) return 25;
      return 10;
    };

    if (!adminDb) {
      return fallbackPercentile(score);
    }

    try {
      const coll = adminDb.collection('benchmarks');

      // Use aggregation count
      const totalQuery = await coll.where('category', '==', category).count().get();
      const total = totalQuery.data().count;

      if (total < 10) return fallbackPercentile(score); // Not enough data

      const belowQuery = await coll
        .where('category', '==', category)
        .where('overallScore', '<', score)
        .count()
        .get();

      const countBelow = belowQuery.data().count;

      return Math.round((countBelow / total) * 100);
    } catch (e) {
      console.warn('Failed to calc percentile', e);
      return fallbackPercentile(score);
    }
  }
}
