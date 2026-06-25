import type { Recommendation, SectionResult } from '@/lib/types/analyzer';

export type ExtendedRecommendation = Recommendation & {
  sectionKey: string;
  sectionName: string;
  sectionScore?: number;
};

export type RoadmapWeek = {
  key: 'week1' | 'week2' | 'week3' | 'week4';
  items: ExtendedRecommendation[];
};

export type AnalyzerSections = Record<string, SectionResult | undefined>;

export declare const SECTION_ORDER: readonly string[];

export declare function getRecommendationKey(rec: ExtendedRecommendation): string;

export declare function flattenRecommendations(
  sections: AnalyzerSections,
  getSectionName?: (key: string, section: SectionResult) => string
): ExtendedRecommendation[];

export declare function buildRoadmapWeeks(allRecs: ExtendedRecommendation[]): RoadmapWeek[];

export declare function dedupeRecommendations(
  allRecs: ExtendedRecommendation[]
): ExtendedRecommendation[];

export declare function buildPriorityRecommendations(
  allRecs: ExtendedRecommendation[],
  maxCount?: number
): ExtendedRecommendation[];

export declare function countHighImpact(allRecs: ExtendedRecommendation[]): number;
