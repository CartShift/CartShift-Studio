const { buildEmailHtml } = require('../emails/email-service');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isolated(value, dir = 'auto') {
  return `<bdi dir="${dir}" style="unicode-bidi: isolate;">${escapeHtml(value)}</bdi>`;
}

function scoreText(score) {
  return `<span dir="ltr" style="unicode-bidi: isolate; white-space: nowrap;">${escapeHtml(score)}/100</span>`;
}

function percentRangeText(lowEnd, highEnd) {
  return `<span dir="ltr" style="unicode-bidi: isolate; white-space: nowrap;">${escapeHtml(lowEnd)}-${escapeHtml(highEnd)}%</span>`;
}

function overallScoreDisplay(score) {
  return `
    <span dir="ltr" style="display: block; unicode-bidi: isolate; font-size: 48px; font-weight: 900; color: #0f172a; line-height: 1;">${escapeHtml(score)}</span>
    <span dir="ltr" style="display: block; unicode-bidi: isolate; font-size: 14px; color: #64748b; font-weight: 600; margin-top: -4px;">/100</span>
  `;
}

function textFromMap(map, sourceText, fallback = sourceText) {
  if (!sourceText) return '';
  return map?.[sourceText] || fallback || '';
}

function localizeFinding(finding, texts) {
  return {
    ...finding,
    title: textFromMap(texts.findingTitles, finding.title),
    description:
      textFromMap(texts.findingDescriptions, finding.description, '') ||
      localizeEvidence(finding.description, texts),
  };
}

function localizeRecommendation(rec, texts) {
  return {
    ...rec,
    title: textFromMap(texts.recommendationTitles, rec.title),
    description: textFromMap(texts.recommendationDescriptions, rec.description),
    action: textFromMap(texts.recommendationActions, rec.action || texts.actionSteps?.[rec.title] || ''),
    evidence: localizeEvidence(rec.evidence, texts),
  };
}

function confidenceLabel(rec, texts) {
  const confidence = rec.confidence || 'estimated';
  return texts.confidence?.[confidence] || confidence.replace(/_/g, ' ');
}

function sourceLabel(rec, texts) {
  const source = rec.source || 'heuristic';
  return texts.sources?.[source] || source.replace(/_/g, ' ');
}

function recommendationMetaHtml(rec, texts) {
  const parts = [
    `${texts.confidenceLabel || 'Confidence'}: ${confidenceLabel(rec, texts)}`,
    `${texts.sourceLabel || 'Source'}: ${sourceLabel(rec, texts)}`,
  ];
  if (rec.scannedUrlScope?.length) {
    parts.push(`${texts.scannedScopeLabel || 'Scope'}: ${rec.scannedUrlScope.join(', ')}`);
  }
  if (rec.limitation) {
    parts.push(`${texts.limitationLabel || 'Limitation'}: ${localizeEvidence(rec.limitation, texts)}`);
  }

  return `<p style="margin: 0 0 8px; font-size: 10px; color: #64748b; line-height: 1.5;">${isolated(parts.join(' • '))}</p>`;
}

function localizeEvidence(evidence, texts) {
  if (!evidence) return '';
  const direct = texts.evidence?.[evidence];
  if (direct) return direct;

  const scriptCountMatch = String(evidence).match(/^(\d+)\s+script tags were detected\.$/i);
  if (scriptCountMatch && texts.evidenceTemplates?.scriptTagsDetected) {
    return texts.evidenceTemplates.scriptTagsDetected.replace('{count}', scriptCountMatch[1]);
  }

  const msSavingsMatch = String(evidence).match(/^(?:Est savings of|Potential savings of)\s+([\d,]+)\s*ms/i);
  if (msSavingsMatch && texts.evidenceTemplates?.millisecondsSavings) {
    return texts.evidenceTemplates.millisecondsSavings.replace('{ms}', msSavingsMatch[1]);
  }

  const kibSavingsMatch = String(evidence).match(/^(?:Est savings of|Potential savings of)\s+([\d,.]+)\s*KiB/i);
  if (kibSavingsMatch && texts.evidenceTemplates?.kibSavings) {
    return texts.evidenceTemplates.kibSavings.replace('{kib}', kibSavingsMatch[1]);
  }

  const secondsMatch = String(evidence).match(/^([\d.]+)\s*s$/i);
  if (secondsMatch && texts.evidenceTemplates?.secondsMetric) {
    return texts.evidenceTemplates.secondsMetric.replace('{seconds}', secondsMatch[1]);
  }

  if (String(evidence).startsWith('Lab measurement.') && texts.labMeasurementLimitation) {
    return texts.labMeasurementLimitation;
  }

  return evidence;
}

function countText(count, singular, plural, isRtl) {
  const label = count === 1 ? singular : plural;
  return isRtl
    ? `${isolated(count, 'ltr')} ${escapeHtml(label)}`
    : `${isolated(count, 'ltr')} ${escapeHtml(label)}`;
}

function getCountLabels(texts) {
  return {
    issueSingular: texts.issueSingular || 'issue',
    issuePlural: texts.issuePlural || 'issues',
    passedSingular: texts.passedSingular || 'passed',
    passedPlural: texts.passedPlural || 'passed',
    itemSingular: texts.itemSingular || 'item',
    itemPlural: texts.itemPlural || 'items',
    taskSingular: texts.taskSingular || 'task',
    taskPlural: texts.taskPlural || 'tasks',
  };
}

function getScoreColor(score) {
  if (score >= 80) return '#059669'; // green
  if (score >= 60) return '#2563eb'; // blue
  if (score >= 40) return '#d97706'; // amber
  return '#dc2626'; // red
}

function getScoreEmoji(score) {
  if (score >= 80) return '✓';
  if (score >= 60) return '○';
  if (score >= 40) return '!';
  return '✕';
}

function getScoreBg(score) {
  if (score >= 80) return '#ecfdf5';
  if (score >= 60) return '#eff6ff';
  if (score >= 40) return '#fffbeb';
  return '#fef2f2';
}

function getScoreBorder(score) {
  if (score >= 80) return '#a7f3d0';
  if (score >= 60) return '#bfdbfe';
  if (score >= 40) return '#fde68a';
  return '#fecaca';
}

// Build score breakdown - PROFESSIONAL VERSION
function buildScoresHtml(sections, texts, isRtl) {
  const sectionOrder = ['performance', 'seo', 'accessibility', 'bestPractices', 'cart', 'trust'];
  const sectionColors = {
    performance: '#ea580c',
    seo: '#2563eb',
    accessibility: '#7c3aed',
    bestPractices: '#059669',
    cart: '#16a34a',
    trust: '#dc2626',
  };

  const scoresHtml = sectionOrder
    .map((key, index) => {
      const section = sections[key];
      if (!section) return '';
      const scoreColor = getScoreColor(section.score);
      const scoreBg = getScoreBg(section.score);
      const scoreBorder = getScoreBorder(section.score);
      const label = texts.sections[key] || section.name || key;
      const accentColor = sectionColors[key] || '#64748b';
      const isLast = index === sectionOrder.length - 1;
      const progressPercent = Math.min(section.score, 100);

      return `
      <tr>
        <td style="padding: 16px; ${!isLast ? 'border-bottom: 1px solid #f1f5f9;' : ''} ${isRtl ? 'direction: rtl;' : ''}">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="${isRtl ? 'text-align: right;' : ''}">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="10" style="padding-${isRtl ? 'left' : 'right'}: 12px; vertical-align: middle;">
                      <table cellpadding="0" cellspacing="0" border="0" style="background: ${accentColor}; border-radius: 3px; width: 6px; height: 32px;">
                        <tr><td></td></tr>
                      </table>
                    </td>
                    <td style="vertical-align: middle;">
                      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">${escapeHtml(label)}</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td align="${isRtl ? 'left' : 'right'}" style="vertical-align: middle;">
                <table cellpadding="0" cellspacing="0" border="0" align="${isRtl ? 'left' : 'right'}">
                  <tr>
                    <td style="background: ${scoreBg}; border: 1px solid ${scoreBorder}; border-radius: 6px; padding: 6px 12px;">
                      <span style="color: ${scoreColor}; font-weight: 800; font-size: 16px;">${scoreText(section.score)}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 10px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f1f5f9; border-radius: 4px; height: 6px;">
                  <tr>
                    <td width="${progressPercent}%" style="background: ${accentColor}; border-radius: 4px; height: 6px;"></td>
                    <td></td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    })
    .join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; table-layout: fixed;">
      ${scoresHtml}
    </table>
  `;
}

function getScoreStatus(score) {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}

function allRecommendations(sections, texts) {
  return flattenRecommendations(sections, (key, section) => texts.sections?.[key] || section.name);
}

// Build next actions - evidence-safe version
function buildRecommendationsHtml(sections, texts, isRtl) {
  const topRecs = buildPriorityRecommendations(allRecommendations(sections, texts), 3);
  if (topRecs.length === 0) {
    return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 32px; text-align: center;">
            <p style="font-size: 18px; margin: 0 0 12px; font-weight: 800;">✓</p>
            <p style="margin: 0; color: #166534; font-size: 16px; font-weight: 600;">${escapeHtml(texts.noPriorityActionsFound || texts.noVerifiedCriticalIssuesFound || texts.noCriticalIssuesFound)}</p>
          </td>
        </tr>
      </table>
    `;
  }

  const recsHtml = topRecs
    .map((rec, index) => {
      const localizedRec = localizeRecommendation(rec, texts);
      const actionStep = localizedRec.action || '';
      const detailText = localizedRec.description || '';
      const evidenceText = localizedRec.evidence || '';
      const isLast = index === topRecs.length - 1;

      return `
      <tr>
        <td style="padding: 16px; ${!isLast ? 'border-bottom: 1px solid #f1f5f9;' : ''} ${isRtl ? 'direction: rtl;' : ''}">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="36" style="vertical-align: top; padding-${isRtl ? 'left' : 'right'}: 12px;">
                <table cellpadding="0" cellspacing="0" border="0" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; width: 32px; height: 32px;">
                  <tr>
                    <td align="center" style="color: #dc2626; font-size: 14px; font-weight: 800;">${index + 1}</td>
                  </tr>
                </table>
              </td>
              <td style="vertical-align: top; ${isRtl ? 'text-align: right;' : ''}">
                <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 8px;">
                  <tr>
                    <td style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 3px 8px;">
                      <span style="color: #dc2626; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">${escapeHtml(texts.impact.high)}</span>
                    </td>
                  </tr>
                </table>
                <p style="margin: 0 0 8px; font-size: 13px; color: #1f2937; line-height: 1.5; font-weight: 600; word-wrap: break-word;">${isolated(localizedRec.title)}</p>
                ${
                  detailText
                    ? `<p style="margin: 0 0 8px; font-size: 12px; color: #4b5563; line-height: 1.5; word-wrap: break-word;">${isolated(detailText)}</p>`
                    : ''
                }
                ${
                  evidenceText
                    ? `<p style="margin: 0 0 8px; font-size: 11px; color: #6b7280; line-height: 1.5; word-wrap: break-word;"><strong>${escapeHtml(texts.whatWeFound)}:</strong> ${isolated(evidenceText)}</p>`
                    : ''
                }
                ${recommendationMetaHtml(rec, texts)}
                ${
                  actionStep
                    ? `
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
                    <tr>
                      <td style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 10px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
                          <tr>
                            <td width="20" style="vertical-align: top; padding-${isRtl ? 'left' : 'right'}: 6px;">
                              <span style="display: inline-block; width: 18px; height: 18px; border-radius: 999px; background: #16a34a; color: #ffffff; font-size: 12px; font-weight: 800; line-height: 18px; text-align: center;">!</span>
                            </td>
                            <td style="word-wrap: break-word; word-break: break-word;">
                              <p style="margin: 0; font-size: 11px; color: #166534; line-height: 1.5; word-wrap: break-word;">
                                <strong>${escapeHtml(texts.howToFix)}:</strong> ${isolated(actionStep)}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                `
                    : ''
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    })
    .join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; table-layout: fixed;">
      ${recsHtml}
    </table>
  `;
}

// Build detailed findings HTML for each section - PROFESSIONAL EMAIL-SAFE VERSION
function buildDetailedFindingsHtml(sections, texts, isRtl) {
  const sectionOrder = ['performance', 'seo', 'accessibility', 'bestPractices', 'cart', 'trust'];
  const sectionColors = {
    performance: { gradient: '#f59e0b', light: '#fef3c7', dark: '#92400e' },
    seo: { gradient: '#3b82f6', light: '#dbeafe', dark: '#1e40af' },
    accessibility: { gradient: '#8b5cf6', light: '#ede9fe', dark: '#5b21b6' },
    bestPractices: { gradient: '#10b981', light: '#d1fae5', dark: '#065f46' },
    cart: { gradient: '#22c55e', light: '#dcfce7', dark: '#166534' },
    trust: { gradient: '#ec4899', light: '#fce7f3', dark: '#9d174d' },
  };
  return sectionOrder
    .map(key => {
      const section = sections[key];
      if (!section) return '';

      const label = texts.sections[key] || section.name || key;
      const description = texts.sectionDescriptions?.[key] || '';
      const colors = sectionColors[key];
      const countLabels = getCountLabels(texts);

      const localizedFindings = (section.findings || []).map(finding =>
        localizeFinding(finding, texts)
      );
      const positiveFindings = localizedFindings.filter(f => f.type === 'positive');
      const issueFindings = localizedFindings.filter(f => f.type === 'issue');
      const hasFindings = positiveFindings.length > 0 || issueFindings.length > 0;

      const findingsHtml = [...issueFindings, ...positiveFindings]
        .map((finding, idx, arr) => {
          const isIssue = finding.type === 'issue';
          const isLast = idx === arr.length - 1;
          return `
        <tr>
          <td style="padding: 10px 14px; ${!isLast ? 'border-bottom: 1px solid #f1f5f9;' : ''} background: ${isIssue ? '#fef2f2' : '#f0fdf4'};">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
              <tr>
                <td width="28" style="vertical-align: top; padding-${isRtl ? 'left' : 'right'}: 10px;">
                  <div style="width: 22px; height: 22px; background: ${isIssue ? '#fee2e2' : '#dcfce7'}; border-radius: 50%; text-align: center; line-height: 22px;">
                    <span style="font-size: 11px;">${isIssue ? '✕' : '✓'}</span>
                  </div>
                </td>
                <td style="${isRtl ? 'text-align: right;' : ''} word-wrap: break-word; word-break: break-word;">
                  <p style="margin: 0 0 2px; font-size: 13px; font-weight: 600; color: ${isIssue ? '#b91c1c' : '#15803d'}; word-wrap: break-word;">${isolated(finding.title)}</p>
                  <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.4; word-wrap: break-word;">${isolated(finding.description)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
        })
        .join('');

      return `
      <table class="avoid-break" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; ${isRtl ? 'direction: rtl;' : ''}">
        <tr>
          <td style="background: ${colors.gradient}; border-radius: 12px 12px 0 0; padding: 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
              <tr>
                <td style="${isRtl ? 'text-align: right;' : ''}">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="vertical-align: middle;">
                        <span style="color: #ffffff; font-size: 16px; font-weight: 700;">${escapeHtml(label)}</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="${isRtl ? 'left' : 'right'}" width="80" style="vertical-align: middle;">
                  <table cellpadding="0" cellspacing="0" border="0" style="background: rgba(255,255,255,0.2); border-radius: 6px;">
                    <tr>
                      <td style="padding: 6px 10px; text-align: center;">
                        <span style="color: #ffffff; font-size: 18px; font-weight: 800;">${scoreText(section.score)}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            ${description ? `<p style="margin: 10px 0 0; font-size: 12px; color: rgba(255,255,255,0.85); line-height: 1.5; word-wrap: break-word; ${isRtl ? 'text-align: right;' : ''}">${isolated(description)}</p>` : ''}
          </td>
        </tr>
        <tr>
          <td style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; overflow: hidden;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
              <tr>
                <td style="padding: 12px 14px; background: #f8fafc; border-bottom: 1px solid #e5e7eb;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
                    <tr>
                      <td style="${isRtl ? 'text-align: right;' : ''}">
                        <span style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px;">${escapeHtml(texts.whatWeFound)}</span>
                      </td>
                      <td align="${isRtl ? 'left' : 'right'}" style="white-space: nowrap;">
                        <span style="font-size: 11px; color: #dc2626; font-weight: 600;">${countText(issueFindings.length, countLabels.issueSingular, countLabels.issuePlural, isRtl)}</span>
                        <span style="font-size: 11px; color: #9ca3af;"> · </span>
                        <span style="font-size: 11px; color: #16a34a; font-weight: 600;">${countText(positiveFindings.length, countLabels.passedSingular, countLabels.passedPlural, isRtl)}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${hasFindings ? findingsHtml : `<tr><td style="padding: 20px; text-align: center; color: #9ca3af; font-size: 13px;">${escapeHtml(texts.noSpecificFindings || 'No specific findings available.')}</td></tr>`}
            </table>
          </td>
        </tr>
      </table>
    `;
    })
    .join('');
}

// Build all recommendations grouped by section with action steps - PROFESSIONAL VERSION
function buildFullRecommendationsHtml(sections, texts, isRtl) {
  const sectionOrder = ['performance', 'seo', 'accessibility', 'bestPractices', 'cart', 'trust'];

  const allSectionsHtml = sectionOrder
    .map(key => {
      const section = sections[key];
      if (!section || !section.recommendations || section.recommendations.length === 0) return '';

      const label = texts.sections[key] || section.name || key;
      const recCount = section.recommendations.length;
      const countLabels = getCountLabels(texts);

      const recsHtml = section.recommendations
        .map((rec, idx) => {
          const isHigh = rec.impact === 'high';
          const isMedium = rec.impact === 'medium';
          const impactColor = isHigh ? '#dc2626' : isMedium ? '#d97706' : '#6b7280';
          const impactBg = isHigh ? '#fef2f2' : isMedium ? '#fffbeb' : '#f9fafb';
          const impactBorder = isHigh ? '#fecaca' : isMedium ? '#fde68a' : '#e5e7eb';
          const localizedRec = localizeRecommendation(rec, texts);
          const impactLabel = texts.impact[rec.impact] || rec.impact;
          const actionStep = localizedRec.action || '';
          const detailText = localizedRec.description || '';
          const evidenceText = localizedRec.evidence || '';
          const isLast = idx === section.recommendations.length - 1;

          return `
        <tr>
          <td style="padding: 16px; ${!isLast ? 'border-bottom: 1px solid #f1f5f9;' : ''} ${isRtl ? 'direction: rtl; text-align: right;' : ''}">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="80" style="vertical-align: top; padding-${isRtl ? 'left' : 'right'}: 12px;">
                  <table cellpadding="0" cellspacing="0" border="0" style="background: ${impactBg}; border: 1px solid ${impactBorder}; border-radius: 4px;">
                    <tr>
                      <td style="padding: 4px 8px;">
                        <span style="font-size: 10px; font-weight: 700; color: ${impactColor}; text-transform: uppercase; letter-spacing: 0.3px; white-space: nowrap;">${escapeHtml(impactLabel)}</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="vertical-align: top;">
                  <p style="margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #1f2937; line-height: 1.4;">${isolated(localizedRec.title)}</p>
                  ${
                    detailText
                      ? `<p style="margin: 0 0 8px; font-size: 12px; color: #4b5563; line-height: 1.5;">${isolated(detailText)}</p>`
                      : ''
                  }
                  ${
                    evidenceText
                      ? `<p style="margin: 0 0 8px; font-size: 11px; color: #6b7280; line-height: 1.5;"><strong>${escapeHtml(texts.whatWeFound)}:</strong> ${isolated(evidenceText)}</p>`
                      : ''
                  }
                  ${recommendationMetaHtml(rec, texts)}
                  ${
                    actionStep
                      ? `
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px;">
                      <tr>
                        <td style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 12px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="24" style="vertical-align: top; padding-${isRtl ? 'left' : 'right'}: 8px;">
                                <span style="display: inline-block; width: 20px; height: 20px; border-radius: 999px; background: #16a34a; color: #ffffff; font-size: 12px; font-weight: 800; line-height: 20px; text-align: center;">!</span>
                              </td>
                              <td>
                                <p style="margin: 0; font-size: 12px; color: #166534; line-height: 1.5;">
                                  <strong>${escapeHtml(texts.howToFix)}:</strong> ${isolated(actionStep)}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  `
                      : ''
                  }
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
        })
        .join('');

      return `
      <table class="avoid-break" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; break-inside: avoid; page-break-inside: avoid; ${isRtl ? 'direction: rtl;' : ''}">
        <tr>
          <td style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px 8px 0 0; padding: 14px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="${isRtl ? 'text-align: right;' : ''}">
                  <span style="font-size: 15px; font-weight: 700; color: #1f2937;">${escapeHtml(label)}</span>
                </td>
                <td align="${isRtl ? 'left' : 'right'}">
                  <span style="background: #e5e7eb; color: #4b5563; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 10px;">${countText(recCount, countLabels.itemSingular, countLabels.itemPlural, isRtl)}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${recsHtml}
            </table>
          </td>
        </tr>
      </table>
    `;
    })
    .join('');

  if (!allSectionsHtml.trim()) {
    return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 32px; text-align: center;">
            <p style="font-size: 18px; margin: 0 0 12px; font-weight: 800;">✓</p>
            <p style="margin: 0; color: #166534; font-size: 16px; font-weight: 600;">${escapeHtml(texts.noIssuesInAnyCategory || 'Amazing! No issues detected in any category.')}</p>
          </td>
        </tr>
      </table>
    `;
  }

  return allSectionsHtml;
}

// Build Core Web Vitals section - PROFESSIONAL VERSION
function buildCoreWebVitalsHtml(coreWebVitals, texts, isRtl) {
  if (!coreWebVitals) {
    return '';
  }

  const metrics = [
    {
      key: 'lcp',
      label: texts.lcpLabel,
      desc: texts.lcpDesc,
      goodThreshold: 2500,
      unit: 'ms',
      formatValue: v => `${(v / 1000).toFixed(2)}s`,
      icon: 'LCP',
    },
    {
      key: 'cls',
      label: texts.clsLabel,
      desc: texts.clsDesc,
      goodThreshold: 0.1,
      unit: '',
      formatValue: v => v.toFixed(3),
      icon: 'CLS',
    },
    {
      key: 'fid',
      label: texts.fidLabel,
      desc: texts.fidDesc,
      goodThreshold: 100,
      unit: 'ms',
      formatValue: v => `${v}ms`,
      icon: 'FID',
    },
  ];

  const metricsHtml = metrics
    .map((metric, idx) => {
      const data = coreWebVitals[metric.key];
      if (!data) return '';

      const value = data.value;
      const rating = data.rating?.toLowerCase() || 'average';
      const isGood = rating === 'good' || rating === 'fast';
      const isBad = rating === 'slow' || rating === 'poor';

      const statusColor = isGood ? '#059669' : isBad ? '#dc2626' : '#d97706';
      const statusBg = isGood ? '#ecfdf5' : isBad ? '#fef2f2' : '#fffbeb';
      const statusBorder = isGood ? '#a7f3d0' : isBad ? '#fecaca' : '#fde68a';
      const statusText = isGood ? texts.good : isBad ? texts.critical : texts.needsWork;
      const isLast = idx === metrics.length - 1;

      return `
      <tr>
        <td style="padding: 16px; ${!isLast ? 'border-bottom: 1px solid #f1f5f9;' : ''} ${isRtl ? 'direction: rtl;' : ''}">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="40" style="vertical-align: top;">
                <table cellpadding="0" cellspacing="0" border="0" style="background: #f1f5f9; border-radius: 8px;">
                  <tr>
                    <td style="padding: 8px; text-align: center;">
                      <span style="font-size: 18px;">${metric.icon}</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td style="padding-${isRtl ? 'right' : 'left'}: 14px; vertical-align: top; ${isRtl ? 'text-align: right;' : ''}">
                <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #1f2937;">${isolated(metric.label)}</p>
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.4;">${isolated(metric.desc)}</p>
              </td>
              <td width="100" align="${isRtl ? 'left' : 'right'}" style="vertical-align: middle;">
                <table cellpadding="0" cellspacing="0" border="0" align="${isRtl ? 'left' : 'right'}">
                  <tr>
                    <td style="background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 8px; padding: 10px 14px; text-align: center;">
                      <p style="margin: 0 0 2px; font-size: 18px; font-weight: 800; color: ${statusColor};">${isolated(metric.formatValue(value), 'ltr')}</p>
                      <p style="margin: 0; font-size: 10px; font-weight: 600; color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.3px;">${escapeHtml(statusText)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    })
    .filter(Boolean)
    .join('');

  if (!metricsHtml.trim()) return '';

  return `
    <table class="section-block" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px; break-inside: avoid; page-break-inside: avoid; ${isRtl ? 'direction: rtl;' : ''}">
      <tr>
        <td style="padding-bottom: 20px; ${isRtl ? 'text-align: right;' : ''}">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 8px;">
            ${escapeHtml(texts.coreWebVitalsTitle)}
          </h2>
          <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">${escapeHtml(texts.coreWebVitalsSubtitle)}</p>
        </td>
      </tr>
      <tr>
        <td>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
            ${metricsHtml}
          </table>
        </td>
      </tr>
    </table>
  `;
}

function buildDeeperScanHtml(deeperScan, texts, isRtl) {
  const labels = {
    title: texts.deeperScanTitle || 'Deeper Scan Evidence',
    subtitle:
      texts.deeperScanSubtitle ||
      'Category, product, and cart interaction samples used to qualify checkout recommendations.',
    categoryPages: texts.deeperScanCategoryPages || 'Category pages',
    productPages: texts.deeperScanProductPages || 'Product pages',
    cartInteraction: texts.deeperScanCartInteraction || 'Cart interaction',
    succeeded: texts.deeperScanSucceeded || '{count} succeeded',
    attempted: texts.deeperScanAttempted || '{count} attempted',
    available: texts.deeperScanAvailable || 'Available',
    notVerified: texts.deeperScanNotVerified || 'Not verified',
    unavailableTitle: texts.deeperScanUnavailableTitle || 'Deeper scan unavailable',
    unavailableText:
      texts.deeperScanUnavailableText ||
      'Browser-based category, product, and cart interaction sampling was unavailable for this run, so checkout recommendations remain limited to lower-confidence evidence.',
    evidence: texts.deeperScanEvidence || 'Evidence',
  };

  const formatCount = (template, count) => template.replace('{count}', String(count || 0));

  if (!deeperScan?.available) {
    return `
      <table class="section-block" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px; break-inside: avoid; page-break-inside: avoid; ${isRtl ? 'direction: rtl;' : ''}">
        <tr>
          <td style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; ${isRtl ? 'text-align: right;' : ''}">
            <p style="margin: 0 0 8px; color: #92400e; font-size: 16px; font-weight: 800;">${escapeHtml(labels.unavailableTitle)}</p>
            <p style="margin: 0; color: #b45309; font-size: 13px; line-height: 1.6;">${escapeHtml(labels.unavailableText)}</p>
          </td>
        </tr>
      </table>
    `;
  }

  const cards = [
    {
      label: labels.categoryPages,
      value: formatCount(labels.succeeded, deeperScan.categoryPagesSucceeded),
      detail: formatCount(labels.attempted, deeperScan.categoryPagesAttempted),
      active: deeperScan.categoryPagesSucceeded > 0,
    },
    {
      label: labels.productPages,
      value: formatCount(labels.succeeded, deeperScan.productPagesSucceeded),
      detail: formatCount(labels.attempted, deeperScan.productPagesAttempted),
      active: deeperScan.productPagesSucceeded > 0,
    },
    {
      label: labels.cartInteraction,
      value: deeperScan.cartInteractionSucceeded ? labels.available : labels.notVerified,
      detail:
        deeperScan.cartInteraction?.evidence?.[0] ||
        deeperScan.limitations?.[0] ||
        labels.notVerified,
      active: deeperScan.cartInteractionSucceeded,
    },
  ];

  const cardsHtml = cards
    .map(card => {
      const border = card.active ? '#a7f3d0' : '#e5e7eb';
      const bg = card.active ? '#ecfdf5' : '#f8fafc';
      const color = card.active ? '#047857' : '#475569';

      return `
        <td width="33.33%" style="padding: 0 6px 12px; vertical-align: top;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${bg}; border: 1px solid ${border}; border-radius: 10px;">
            <tr>
              <td style="padding: 14px; ${isRtl ? 'text-align: right;' : ''}">
                <p style="margin: 0 0 6px; color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px;">${escapeHtml(card.label)}</p>
                <p style="margin: 0 0 4px; color: ${color}; font-size: 15px; font-weight: 800;">${escapeHtml(card.value)}</p>
                <p style="margin: 0; color: #64748b; font-size: 11px; line-height: 1.4;">${escapeHtml(card.detail)}</p>
              </td>
            </tr>
          </table>
        </td>
      `;
    })
    .join('');

  const evidenceItems = [
    ...(deeperScan.categorySamples || []).flatMap(sample => sample.evidence || []),
    ...(deeperScan.productSamples || []).flatMap(sample => sample.evidence || []),
    ...(deeperScan.cartInteraction?.evidence || []),
    ...(deeperScan.limitations || []),
  ].slice(0, 6);

  const evidenceHtml = evidenceItems.length
    ? `
      <tr>
        <td style="padding-top: 8px;">
          <p style="margin: 0 0 8px; color: #475569; font-size: 12px; font-weight: 800;">${escapeHtml(labels.evidence)}</p>
          ${evidenceItems
            .map(
              item =>
                `<p style="margin: 0 0 5px; color: #64748b; font-size: 11px; line-height: 1.45;">• ${escapeHtml(item)}</p>`
            )
            .join('')}
        </td>
      </tr>
    `
    : '';

  return `
    <table class="section-block" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px; break-inside: avoid; page-break-inside: avoid; ${isRtl ? 'direction: rtl;' : ''}">
      <tr>
        <td style="padding-bottom: 20px; ${isRtl ? 'text-align: right;' : ''}">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 8px;">${escapeHtml(labels.title)}</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">${escapeHtml(labels.subtitle)}</p>
        </td>
      </tr>
      <tr>
        <td>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>${cardsHtml}</tr>
            ${evidenceHtml}
          </table>
        </td>
      </tr>
    </table>
  `;
}

const {
  buildRoadmapWeeks,
  buildPriorityRecommendations,
  flattenRecommendations,
} = require('./analyzer/roadmap.js');

// Build 30-day action roadmap - PROFESSIONAL VERSION
function buildActionRoadmapHtml(sections, texts, isRtl) {
  const priorityRecs = buildPriorityRecommendations(allRecommendations(sections, texts), 3);
  const roadmapWeeks = buildRoadmapWeeks(priorityRecs);
  const itemsByWeekKey = Object.fromEntries(roadmapWeeks.map(week => [week.key, week.items]));
  const week1 = itemsByWeekKey.week1 || [];
  const week2 = itemsByWeekKey.week2 || [];
  const week3 = itemsByWeekKey.week3 || [];
  const week4 = itemsByWeekKey.week4 || [];

  const buildWeekHtml = (weekLabel, items, weekNum) => {
    if (items.length === 0) return '';
    const countLabels = getCountLabels(texts);

    const weekColors = {
      1: { bg: '#fef2f2', border: '#fecaca', accent: '#dc2626' },
      2: { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c' },
      3: { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a' },
      4: { bg: '#f8fafc', border: '#e2e8f0', accent: '#64748b' },
    };
    const colors = weekColors[weekNum] || weekColors[4];

    const itemsHtml = items
      .map((item, idx) => {
        const isLast = idx === items.length - 1;
        return `
        <tr>
          <td style="padding: 10px 16px; ${!isLast ? 'border-bottom: 1px solid ' + colors.border + ';' : ''} ${isRtl ? 'text-align: right;' : ''}">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="24" style="vertical-align: top; padding-${isRtl ? 'left' : 'right'}: 10px;">
                  <table cellpadding="0" cellspacing="0" border="0" style="background: ${colors.accent}; border-radius: 50%; width: 20px; height: 20px;">
                    <tr>
                      <td align="center" style="color: #ffffff; font-size: 11px; font-weight: 700;">${idx + 1}</td>
                    </tr>
                  </table>
                </td>
                <td style="vertical-align: top;">
                  <p style="margin: 0; font-size: 13px; font-weight: 600; color: #1f2937; line-height: 1.4;">${isolated(localizeRecommendation(item, texts).title)}</p>
                  <p style="margin: 3px 0 0; font-size: 11px; color: #64748b;">${escapeHtml(item.sectionName)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
      })
      .join('');

    return `
      <table class="avoid-break" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px; break-inside: avoid; page-break-inside: avoid; ${isRtl ? 'direction: rtl;' : ''}">
        <tr>
          <td style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 10px 10px 0 0; padding: 12px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="${isRtl ? 'text-align: right;' : ''}">
                  <span style="font-size: 14px; font-weight: 700; color: ${colors.accent};">${escapeHtml(weekLabel)}</span>
                </td>
                <td align="${isRtl ? 'left' : 'right'}">
                  <span style="background: ${colors.accent}; color: #ffffff; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 10px;">${countText(items.length, countLabels.taskSingular, countLabels.taskPlural, isRtl)}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background: #ffffff; border: 1px solid ${colors.border}; border-top: none; border-radius: 0 0 10px 10px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${itemsHtml}
            </table>
          </td>
        </tr>
      </table>
    `;
  };

  const weeks = [
    { label: texts.week1, items: week1, num: 1 },
    { label: texts.week2, items: week2, num: 2 },
    { label: texts.week3, items: week3, num: 3 },
    { label: texts.week4, items: week4, num: 4 },
  ];

  const weeksHtml = weeks
    .map(w => buildWeekHtml(w.label, w.items, w.num))
    .filter(Boolean)
    .join('');

  if (!weeksHtml) return '';

  return `
    <table class="section-block" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px; break-inside: avoid; page-break-inside: avoid; ${isRtl ? 'direction: rtl;' : ''}">
      <tr>
        <td style="padding-bottom: 20px; ${isRtl ? 'text-align: right;' : ''}">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 8px;">
            ${escapeHtml(texts.actionRoadmapTitle)}
          </h2>
          <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">${escapeHtml(texts.actionRoadmapSubtitle)}</p>
        </td>
      </tr>
      <tr>
        <td>
          ${weeksHtml}
        </td>
      </tr>
    </table>
  `;
}

// Build revenue impact section - PROFESSIONAL VERSION (no CSS gradients for email)
function buildRevenueImpactHtml(sections, texts, isRtl) {
  const priorityAreas = buildPriorityRecommendations(allRecommendations(sections, texts), 3).length;

  if (priorityAreas === 0) return '';

  // Conservative directional range. The report should guide prioritization, not promise outcomes.
  const lowEnd = Math.min(8 + priorityAreas * 4, 25);
  const highEnd = Math.min(14 + priorityAreas * 6, 35);
  const countLabels = getCountLabels(texts);

  return `
    <table class="avoid-break" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px; break-inside: avoid; page-break-inside: avoid; ${isRtl ? 'direction: rtl;' : ''}">
      <tr>
        <td style="background: #0f172a; border-radius: 12px; padding: 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="${isRtl ? 'text-align: right;' : ''}">
                <h3 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 10px;">
                  ${escapeHtml(texts.revenueImpactTitle)}
                </h3>
                <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px; line-height: 1.6;">
                  ${escapeHtml(texts.revenueImpactText)}
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #1e293b; border-radius: 10px;">
                  <tr>
                    <td style="padding: 24px; text-align: center;">
                      <table cellpadding="0" cellspacing="0" border="0" align="center">
                        <tr>
                          <td style="text-align: center;">
                            <span style="font-size: 44px; font-weight: 900; color: #22c55e;">${percentRangeText(lowEnd, highEnd)}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 8px; text-align: center;">
                            <span style="color: #64748b; font-size: 13px;">${countText(priorityAreas, countLabels.issueSingular, countLabels.issuePlural, isRtl)}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function buildStoreAnalysisReportHtml(results, storeUrl, texts, isRtl) {
  const lang = isRtl ? 'he' : 'en';
  const scoreStatus = getScoreStatus(results.overallScore);

  const sections = results.sections || {};

  return buildEmailHtml(
    'store_analysis_report_pdf',
    {
      lang: isRtl ? 'he' : 'en',
      dir: isRtl ? 'rtl' : 'ltr',
      textAlign: isRtl ? 'right' : 'left',
      paddingSide: isRtl ? 'right' : 'left',
      badge: texts.badge,
      headline: texts.headline,
      storeUrl: storeUrl || 'N/A',
      overallScoreLabel: texts.overallScoreLabel,
      overallScore: String(results.overallScore),
      overallScoreDisplay: overallScoreDisplay(results.overallScore),
      scoreStatusText: texts.scoreStatus[scoreStatus],
      greeting: texts.greeting,
      introText: texts.introText,
      scoreBreakdownTitle: texts.scoreBreakdownTitle,
      scoreBreakdownSubtitle: texts.scoreBreakdownSubtitle,
      priorityFixesTitle: texts.priorityFixesTitle,
      priorityFixesSubtitle: texts.priorityFixesSubtitle || '',
      detailedFindingsTitle: texts.detailedFindingsTitle,
      detailedFindingsSubtitle: texts.detailedFindingsSubtitle || '',
      allRecommendationsTitle: texts.allRecommendationsTitle,
      allRecommendationsSubtitle: texts.allRecommendationsSubtitle || '',
      proTipLabel: texts.proTipLabel,
      proTipText: texts.proTipText,
      ctaTitle: texts.ctaTitle,
      ctaText: texts.ctaText,
      ctaUrl: `https://cart-shift.com/${lang}/contact`,
      ctaButtonText: texts.ctaButtonText,
      analyzedUrl: texts.analyzedUrl,
      footerText: texts.footerText,
      footerYear: String(new Date().getFullYear()),
      revenueImpactHtml: buildRevenueImpactHtml(sections, texts, isRtl),
      scoresHtml: buildScoresHtml(sections, texts, isRtl),
      recommendationsHtml: buildRecommendationsHtml(sections, texts, isRtl),
      coreWebVitalsHtml: buildCoreWebVitalsHtml(results.coreWebVitals, texts, isRtl),
      deeperScanHtml: buildDeeperScanHtml(results.deeperScan, texts, isRtl),
      actionRoadmapHtml: buildActionRoadmapHtml(sections, texts, isRtl),
      detailedFindingsHtml: buildDetailedFindingsHtml(sections, texts, isRtl),
      fullRecommendationsHtml: buildFullRecommendationsHtml(sections, texts, isRtl),
    },
    texts.headline,
    { layout: false }
  );
}

module.exports = { buildStoreAnalysisReportHtml };
