import { adminDb } from '@/lib/firebase-admin';
import { AnalysisResult, BenchmarkComparison } from '@/lib/types/analyzer';
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

  static async getBenchmarkComparison(
    score: number,
    html: string
  ): Promise<BenchmarkComparison | undefined> {
    const category = CompetitorService.detectCategory(html) || 'general';

    if (!adminDb) {
      return undefined;
    }

    try {
      const coll = adminDb.collection('benchmarks');

      // Use aggregation count
      const totalQuery = await coll.where('category', '==', category).count().get();
      const total = totalQuery.data().count;

      if (total < 10) return undefined;

      const belowQuery = await coll
        .where('category', '==', category)
        .where('overallScore', '<', score)
        .count()
        .get();

      const countBelow = belowQuery.data().count;

      return {
        percentile: Math.round((countBelow / total) * 100),
        sampleSize: total,
        category,
      };
    } catch (e) {
      console.warn('Failed to calc percentile', e);
      return undefined;
    }
  }

  static async getPercentile(score: number, html: string): Promise<number | undefined> {
    const comparison = await this.getBenchmarkComparison(score, html);
    return comparison?.percentile;
  }
}
