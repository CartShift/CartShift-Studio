const { buildEmailHtml } = require('../emails/email-service');

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
                      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">${label}</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td align="${isRtl ? 'left' : 'right'}" style="vertical-align: middle;">
                <table cellpadding="0" cellspacing="0" border="0" align="${isRtl ? 'left' : 'right'}">
                  <tr>
                    <td style="background: ${scoreBg}; border: 1px solid ${scoreBorder}; border-radius: 6px; padding: 6px 12px;">
                      <span style="color: ${scoreColor}; font-weight: 800; font-size: 16px;">${section.score}</span>
                      <span style="color: ${scoreColor}; font-weight: 500; font-size: 12px; opacity: 0.7;">/100</span>
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

// Build priority fixes - PROFESSIONAL VERSION
function buildRecommendationsHtml(sections, texts, isRtl) {
  const allRecs = [];
  Object.values(sections).forEach(section => {
    if (section.recommendations) {
      section.recommendations.forEach(rec => {
        if (rec.impact === 'high') {
          allRecs.push(rec);
        }
      });
    }
  });

  const topRecs = allRecs.slice(0, 5);
  if (topRecs.length === 0) {
    return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 32px; text-align: center;">
            <p style="font-size: 32px; margin: 0 0 12px;">🎉</p>
            <p style="margin: 0; color: #166534; font-size: 16px; font-weight: 600;">${texts.noCriticalIssuesFound}</p>
          </td>
        </tr>
      </table>
    `;
  }

  const recsHtml = topRecs
    .map((rec, index) => {
      const actionStep = rec.action || texts.actionSteps[rec.title] || '';
      const detailText = rec.description || '';
      const evidenceText = rec.evidence || '';
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
                      <span style="color: #dc2626; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;">${texts.impact.high}</span>
                    </td>
                  </tr>
                </table>
                <p style="margin: 0 0 8px; font-size: 13px; color: #1f2937; line-height: 1.5; font-weight: 600; word-wrap: break-word;">${rec.title}</p>
                ${
                  detailText
                    ? `<p style="margin: 0 0 8px; font-size: 12px; color: #4b5563; line-height: 1.5; word-wrap: break-word;">${detailText}</p>`
                    : ''
                }
                ${
                  evidenceText
                    ? `<p style="margin: 0 0 8px; font-size: 11px; color: #6b7280; line-height: 1.5; word-wrap: break-word;"><strong>${texts.whatWeFound}:</strong> ${evidenceText}</p>`
                    : ''
                }
                ${
                  actionStep
                    ? `
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
                    <tr>
                      <td style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 10px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
                          <tr>
                            <td width="20" style="vertical-align: top; padding-${isRtl ? 'left' : 'right'}: 6px;">
                              <span style="font-size: 12px;">💡</span>
                            </td>
                            <td style="word-wrap: break-word; word-break: break-word;">
                              <p style="margin: 0; font-size: 11px; color: #166534; line-height: 1.5; word-wrap: break-word;">
                                <strong>${texts.howToFix}:</strong> ${actionStep}
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
  const emojis = {
    performance: '⚡',
    seo: '🔍',
    accessibility: '♿',
    bestPractices: '🛡️',
    cart: '🛒',
    trust: '✨',
  };

  return sectionOrder
    .map(key => {
      const section = sections[key];
      if (!section) return '';

      const label = texts.sections[key] || section.name || key;
      const description = texts.sectionDescriptions?.[key] || '';
      const colors = sectionColors[key];
      const emoji = emojis[key];
      const scoreColor = getScoreColor(section.score);

      const positiveFindings = section.findings?.filter(f => f.type === 'positive') || [];
      const issueFindings = section.findings?.filter(f => f.type === 'issue') || [];
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
                  <p style="margin: 0 0 2px; font-size: 13px; font-weight: 600; color: ${isIssue ? '#b91c1c' : '#15803d'}; word-wrap: break-word;">${finding.title}</p>
                  <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.4; word-wrap: break-word;">${finding.description}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
        })
        .join('');

      return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px; table-layout: fixed; ${isRtl ? 'direction: rtl;' : ''}">
        <tr>
          <td style="background: ${colors.gradient}; border-radius: 12px 12px 0 0; padding: 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout: fixed;">
              <tr>
                <td style="${isRtl ? 'text-align: right;' : ''}">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding-${isRtl ? 'left' : 'right'}: 8px; vertical-align: middle;">
                        <span style="font-size: 18px;">${emoji}</span>
                      </td>
                      <td style="vertical-align: middle;">
                        <span style="color: #ffffff; font-size: 16px; font-weight: 700;">${label}</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="${isRtl ? 'left' : 'right'}" width="80" style="vertical-align: middle;">
                  <table cellpadding="0" cellspacing="0" border="0" style="background: rgba(255,255,255,0.2); border-radius: 6px;">
                    <tr>
                      <td style="padding: 6px 10px; text-align: center;">
                        <span style="color: #ffffff; font-size: 18px; font-weight: 800;">${section.score}</span>
                        <span style="color: rgba(255,255,255,0.7); font-size: 11px;">/100</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            ${description ? `<p style="margin: 10px 0 0; font-size: 12px; color: rgba(255,255,255,0.85); line-height: 1.5; word-wrap: break-word; ${isRtl ? 'text-align: right;' : ''}">${description}</p>` : ''}
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
                        <span style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px;">${texts.whatWeFound}</span>
                      </td>
                      <td align="${isRtl ? 'left' : 'right'}" style="white-space: nowrap;">
                        <span style="font-size: 11px; color: #dc2626; font-weight: 600;">${issueFindings.length} issues</span>
                        <span style="font-size: 11px; color: #9ca3af;"> · </span>
                        <span style="font-size: 11px; color: #16a34a; font-weight: 600;">${positiveFindings.length} passed</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${hasFindings ? findingsHtml : `<tr><td style="padding: 20px; text-align: center; color: #9ca3af; font-size: 13px;">No specific findings available.</td></tr>`}
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

      const recsHtml = section.recommendations
        .map((rec, idx) => {
          const isHigh = rec.impact === 'high';
          const isMedium = rec.impact === 'medium';
          const impactColor = isHigh ? '#dc2626' : isMedium ? '#d97706' : '#6b7280';
          const impactBg = isHigh ? '#fef2f2' : isMedium ? '#fffbeb' : '#f9fafb';
          const impactBorder = isHigh ? '#fecaca' : isMedium ? '#fde68a' : '#e5e7eb';
          const impactLabel = texts.impact[rec.impact] || rec.impact;
          const actionStep = rec.action || texts.actionSteps[rec.title] || '';
          const detailText = rec.description || '';
          const evidenceText = rec.evidence || '';
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
                        <span style="font-size: 10px; font-weight: 700; color: ${impactColor}; text-transform: uppercase; letter-spacing: 0.3px; white-space: nowrap;">${impactLabel}</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="vertical-align: top;">
                  <p style="margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #1f2937; line-height: 1.4;">${rec.title}</p>
                  ${
                    detailText
                      ? `<p style="margin: 0 0 8px; font-size: 12px; color: #4b5563; line-height: 1.5;">${detailText}</p>`
                      : ''
                  }
                  ${
                    evidenceText
                      ? `<p style="margin: 0 0 8px; font-size: 11px; color: #6b7280; line-height: 1.5;"><strong>${texts.whatWeFound}:</strong> ${evidenceText}</p>`
                      : ''
                  }
                  ${
                    actionStep
                      ? `
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px;">
                      <tr>
                        <td style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 12px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="24" style="vertical-align: top; padding-${isRtl ? 'left' : 'right'}: 8px;">
                                <span style="font-size: 14px;">💡</span>
                              </td>
                              <td>
                                <p style="margin: 0; font-size: 12px; color: #166534; line-height: 1.5;">
                                  <strong>${texts.howToFix}:</strong> ${actionStep}
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
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; ${isRtl ? 'direction: rtl;' : ''}">
        <tr>
          <td style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px 8px 0 0; padding: 14px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="${isRtl ? 'text-align: right;' : ''}">
                  <span style="font-size: 15px; font-weight: 700; color: #1f2937;">${label}</span>
                </td>
                <td align="${isRtl ? 'left' : 'right'}">
                  <span style="background: #e5e7eb; color: #4b5563; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 10px;">${recCount} items</span>
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
            <p style="font-size: 32px; margin: 0 0 12px;">🎉</p>
            <p style="margin: 0; color: #166534; font-size: 16px; font-weight: 600;">Amazing! No issues detected in any category.</p>
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
      icon: '⏱️',
    },
    {
      key: 'cls',
      label: texts.clsLabel,
      desc: texts.clsDesc,
      goodThreshold: 0.1,
      unit: '',
      formatValue: v => v.toFixed(3),
      icon: '📐',
    },
    {
      key: 'fid',
      label: texts.fidLabel,
      desc: texts.fidDesc,
      goodThreshold: 100,
      unit: 'ms',
      formatValue: v => `${v}ms`,
      icon: '👆',
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
                <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #1f2937;">${metric.label}</p>
                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.4;">${metric.desc}</p>
              </td>
              <td width="100" align="${isRtl ? 'left' : 'right'}" style="vertical-align: middle;">
                <table cellpadding="0" cellspacing="0" border="0" align="${isRtl ? 'left' : 'right'}">
                  <tr>
                    <td style="background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 8px; padding: 10px 14px; text-align: center;">
                      <p style="margin: 0 0 2px; font-size: 18px; font-weight: 800; color: ${statusColor};">${metric.formatValue(value)}</p>
                      <p style="margin: 0; font-size: 10px; font-weight: 600; color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.3px;">${statusText}</p>
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
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px; ${isRtl ? 'direction: rtl;' : ''}">
      <tr>
        <td style="padding-bottom: 20px; ${isRtl ? 'text-align: right;' : ''}">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 8px;">
            📈 ${texts.coreWebVitalsTitle}
          </h2>
          <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">${texts.coreWebVitalsSubtitle}</p>
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

// Build 30-day action roadmap - PROFESSIONAL VERSION
function buildActionRoadmapHtml(sections, texts, isRtl) {
  const allRecs = [];
  const sectionOrder = ['performance', 'seo', 'accessibility', 'bestPractices', 'cart', 'trust'];

  sectionOrder.forEach(key => {
    const section = sections[key];
    if (section?.recommendations) {
      section.recommendations.forEach(rec => {
        allRecs.push({ ...rec, sectionKey: key, sectionName: texts.sections[key] || section.name });
      });
    }
  });

  // Sort by impact priority
  const impactOrder = { high: 0, medium: 1, low: 2 };
  allRecs.sort((a, b) => (impactOrder[a.impact] || 2) - (impactOrder[b.impact] || 2));

  // Distribute into weeks
  const week1 = allRecs.filter(r => r.impact === 'high').slice(0, 3);
  const week2 = allRecs
    .filter(r => r.impact === 'high')
    .slice(3, 5)
    .concat(allRecs.filter(r => r.impact === 'medium').slice(0, 2));
  const week3 = allRecs.filter(r => r.impact === 'medium').slice(2, 5);
  const week4 = allRecs.filter(r => r.impact === 'low').slice(0, 3);

  const buildWeekHtml = (weekLabel, items, weekNum) => {
    if (items.length === 0) return '';

    const weekColors = {
      1: { bg: '#fef2f2', border: '#fecaca', accent: '#dc2626', icon: '🔥' },
      2: { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c', icon: '⚡' },
      3: { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a', icon: '🎯' },
      4: { bg: '#f8fafc', border: '#e2e8f0', accent: '#64748b', icon: '✨' },
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
                  <p style="margin: 0; font-size: 13px; font-weight: 600; color: #1f2937; line-height: 1.4;">${item.title}</p>
                  <p style="margin: 3px 0 0; font-size: 11px; color: #64748b;">${item.sectionName}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
      })
      .join('');

    return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px; ${isRtl ? 'direction: rtl;' : ''}">
        <tr>
          <td style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 10px 10px 0 0; padding: 12px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="${isRtl ? 'text-align: right;' : ''}">
                  <span style="font-size: 14px; font-weight: 700; color: ${colors.accent};">${colors.icon} ${weekLabel}</span>
                </td>
                <td align="${isRtl ? 'left' : 'right'}">
                  <span style="background: ${colors.accent}; color: #ffffff; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 10px;">${items.length} tasks</span>
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
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px; ${isRtl ? 'direction: rtl;' : ''}">
      <tr>
        <td style="padding-bottom: 20px; ${isRtl ? 'text-align: right;' : ''}">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 8px;">
            🗓️ ${texts.actionRoadmapTitle}
          </h2>
          <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5;">${texts.actionRoadmapSubtitle}</p>
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
function buildRevenueImpactHtml(overallScore, sections, texts, isRtl) {
  const criticalIssues = Object.values(sections).reduce((count, section) => {
    return count + (section.recommendations?.filter(r => r.impact === 'high').length || 0);
  }, 0);

  if (criticalIssues === 0) return '';

  // Calculate estimated impact based on issues
  const lowEnd = Math.min(15 + criticalIssues * 2, 35);
  const highEnd = Math.min(25 + criticalIssues * 3, 50);

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px; ${isRtl ? 'direction: rtl;' : ''}">
      <tr>
        <td style="background: #0f172a; border-radius: 12px; padding: 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="${isRtl ? 'text-align: right;' : ''}">
                <h3 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 10px;">
                  💰 ${texts.revenueImpactTitle}
                </h3>
                <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px; line-height: 1.6;">
                  ${texts.revenueImpactText}
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
                            <span style="font-size: 44px; font-weight: 900; color: #22c55e;">${lowEnd}-${highEnd}%</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 8px; text-align: center;">
                            <span style="color: #64748b; font-size: 13px;">${criticalIssues} ${texts.issuesDetected}</span>
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
  const scoreStatus =
    results.overallScore >= 80
      ? 'excellent'
      : results.overallScore >= 60
        ? 'good'
        : results.overallScore >= 40
          ? 'warning'
          : 'critical';

  const sections = results.sections || {};

  return buildEmailHtml(
    'store_analysis_report',
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
      scoreStatusText: texts.scoreStatus[scoreStatus],
      greeting: texts.greeting,
      introText: texts.introText,
      scoreBreakdownTitle: texts.scoreBreakdownTitle,
      scoreBreakdownSubtitle: texts.scoreBreakdownSubtitle,
      priorityFixesTitle: texts.priorityFixesTitle,
      detailedFindingsTitle: texts.detailedFindingsTitle,
      allRecommendationsTitle: texts.allRecommendationsTitle,
      proTipLabel: texts.proTipLabel,
      proTipText: texts.proTipText,
      ctaTitle: texts.ctaTitle,
      ctaText: texts.ctaText,
      ctaUrl: `https://cart-shift.com/${lang}/contact`,
      ctaButtonText: texts.ctaButtonText,
      analyzedUrl: texts.analyzedUrl,
      footerText: texts.footerText,
      revenueImpactHtml: buildRevenueImpactHtml(results.overallScore, sections, texts, isRtl),
      scoresHtml: buildScoresHtml(sections, texts, isRtl),
      recommendationsHtml: buildRecommendationsHtml(sections, texts, isRtl),
      coreWebVitalsHtml: buildCoreWebVitalsHtml(results.coreWebVitals, texts, isRtl),
      actionRoadmapHtml: buildActionRoadmapHtml(sections, texts, isRtl),
      detailedFindingsHtml: buildDetailedFindingsHtml(sections, texts, isRtl),
      fullRecommendationsHtml: buildFullRecommendationsHtml(sections, texts, isRtl),
    },
    texts.headline,
    { layout: false }
  );
}

module.exports = { buildStoreAnalysisReportHtml };
