const SECTION_ORDER = ['performance', 'seo', 'accessibility', 'bestPractices', 'cart', 'trust'];

const IMPACT_RANK = { high: 0, medium: 1, low: 2 };
const EFFORT_RANK = { quick: 0, medium: 1, advanced: 2 };

const ROADMAP_WEEK_DEFS = [
  {
    key: 'week1',
    predicate: rec => rec.impact === 'high' || rec.effort === 'quick',
    itemLimit: 2,
    fallbackLimit: 2,
  },
  {
    key: 'week2',
    predicate: rec => rec.sectionKey === 'performance',
    itemLimit: 2,
    fallbackLimit: 2,
  },
  {
    key: 'week3',
    predicate: rec =>
      rec.sectionKey === 'seo' ||
      rec.sectionKey === 'accessibility' ||
      rec.sectionKey === 'bestPractices',
    itemLimit: 2,
    fallbackLimit: 2,
  },
  {
    key: 'week4',
    predicate: rec => rec.sectionKey === 'cart' || rec.sectionKey === 'trust',
    itemLimit: 2,
    fallbackLimit: 3,
  },
];

function getRecommendationKey(rec) {
  if (rec.code) {
    return `${rec.sectionKey}:${rec.code}`;
  }

  return `${rec.sectionKey}:${rec.title}:${rec.description || ''}`;
}

function flattenRecommendations(sections, getSectionName = key => key) {
  const items = [];

  for (const key of SECTION_ORDER) {
    const section = sections[key];
    if (!section?.recommendations?.length) {
      continue;
    }

    for (const rec of section.recommendations) {
      items.push({
        ...rec,
        sectionKey: key,
        sectionName: getSectionName(key, section),
      });
    }
  }

  return items;
}

function sortForRoadmap(recs) {
  return [...recs].sort((a, b) => {
    const impactDelta = IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact];
    if (impactDelta !== 0) {
      return impactDelta;
    }

    const effortA = EFFORT_RANK[a.effort || 'medium'] ?? 1;
    const effortB = EFFORT_RANK[b.effort || 'medium'] ?? 1;
    return effortA - effortB;
  });
}

function takeRoadmapItems(sortedRecs, usedKeys, predicate, limit = 2) {
  const items = [];

  for (const rec of sortedRecs) {
    const key = getRecommendationKey(rec);
    if (usedKeys.has(key) || !predicate(rec)) {
      continue;
    }

    usedKeys.add(key);
    items.push(rec);
    if (items.length >= limit) {
      break;
    }
  }

  return items;
}

function buildRoadmapWeeks(allRecs) {
  const sorted = sortForRoadmap(allRecs);
  const usedKeys = new Set();

  return ROADMAP_WEEK_DEFS.map(def => {
    let items = takeRoadmapItems(sorted, usedKeys, def.predicate, def.itemLimit);

    if (items.length === 0) {
      items = takeRoadmapItems(sorted, usedKeys, () => true, def.fallbackLimit);
    }

    return { key: def.key, items };
  }).filter(week => week.items.length > 0);
}

function buildPriorityRecommendations(allRecs, maxCount = 3) {
  const highImpact = allRecs.filter(rec => rec.impact === 'high').slice(0, maxCount);

  if (highImpact.length >= maxCount) {
    return highImpact;
  }

  const mediumImpact = allRecs
    .filter(rec => rec.impact === 'medium')
    .slice(0, maxCount - highImpact.length);

  return [...highImpact, ...mediumImpact];
}

function countHighImpact(allRecs) {
  return allRecs.filter(rec => rec.impact === 'high').length;
}

module.exports = {
  SECTION_ORDER,
  ROADMAP_WEEK_DEFS,
  getRecommendationKey,
  flattenRecommendations,
  sortForRoadmap,
  buildRoadmapWeeks,
  buildPriorityRecommendations,
  countHighImpact,
};
