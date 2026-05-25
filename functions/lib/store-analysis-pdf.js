const path = require('path');

const FONT_DIR = path.join(__dirname, '../assets/fonts');
const HEBREW_RE = /[\u0590-\u05FF]/;

function registerPdfFonts(doc, isRtl) {
  if (!isRtl) {
    return { regular: 'Helvetica', bold: 'Helvetica-Bold' };
  }

  doc.registerFont('Report', path.join(FONT_DIR, 'NotoSansHebrew-Regular.ttf'));
  doc.registerFont('Report-Bold', path.join(FONT_DIR, 'NotoSansHebrew-Bold.ttf'));
  return { regular: 'Report', bold: 'Report-Bold' };
}

function prepareText(text, isRtl) {
  if (!text || !isRtl || !HEBREW_RE.test(text)) {
    return text;
  }

  return `\u200F${text}`;
}

function textOptions(isRtl, overrides = {}) {
  const rtl = overrides.rtl ?? true;
  return {
    ...overrides,
    align: overrides.align ?? (isRtl && rtl ? 'right' : 'left'),
  };
}

function generateStoreAnalysisPDF(results, storeUrl, texts, isRtl, contactEmail) {
  return new Promise((resolve, reject) => {
    const PDFDocument = require('pdfkit');
    const chunks = [];
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: texts.headline,
        Author: 'CartShift Studio',
        Subject: `Store Analysis Report - ${storeUrl}`,
      },
    });

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const fonts = registerPdfFonts(doc, isRtl);

    const write = (value, x, y, options = {}) => {
      const { bold = false, rtl = true, ...rest } = options;
      doc.font(bold ? fonts.bold : fonts.regular);
      doc.text(prepareText(value, isRtl), x, y, textOptions(isRtl, { ...rest, rtl }));
    };

    const colors = {
      primary: '#3b82f6',
      accent: '#8b5cf6',
      dark: '#0f172a',
      text: '#1f2937',
      muted: '#64748b',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      lightBg: '#f8fafc',
      border: '#e2e8f0',
    };

    const getScoreColor = score => {
      if (score >= 80) return colors.success;
      if (score >= 60) return colors.primary;
      if (score >= 40) return colors.warning;
      return colors.danger;
    };

    const reportDate = new Date().toLocaleDateString(isRtl ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc.rect(0, 0, 595, 280).fill(colors.dark);

    doc.font(fonts.bold).fontSize(12).fillColor('#ffffff');
    write('CARTSHIFT STUDIO', 50, 40, { rtl: false });

    doc.roundedRect(50, 80, 140, 28, 14).fill(colors.primary);
    doc.font(fonts.bold).fontSize(10).fillColor('#ffffff');
    write(isRtl ? texts.badge : texts.badge.toUpperCase(), 60, 88, {
      width: 120,
      align: 'center',
    });

    doc.font(fonts.bold).fontSize(32).fillColor('#ffffff');
    write(texts.headline, 50, 130, { width: 495 });

    doc.font(fonts.regular).fontSize(14).fillColor('#94a3b8');
    write(storeUrl, 50, 200, { rtl: false, width: 495 });

    doc.font(fonts.regular).fontSize(11).fillColor('#64748b');
    write(reportDate, 50, 225, { width: 495 });

    const scoreX = 297;
    const scoreY = 400;
    const scoreRadius = 70;
    const scoreColor = getScoreColor(results.overallScore);

    doc.circle(scoreX, scoreY, scoreRadius + 8).fill('#e2e8f0');
    doc.circle(scoreX, scoreY, scoreRadius).fill(scoreColor);
    doc.circle(scoreX, scoreY, scoreRadius - 12).fill('#ffffff');

    doc.font(fonts.bold).fontSize(48).fillColor(colors.dark);
    write(String(results.overallScore), scoreX - 35, scoreY - 25, {
      width: 70,
      align: 'center',
      rtl: false,
    });

    doc.font(fonts.regular).fontSize(14).fillColor(colors.muted);
    write('/100', scoreX - 25, scoreY + 30, { width: 50, align: 'center', rtl: false });

    doc.font(fonts.bold).fontSize(16).fillColor(colors.text);
    write(
      isRtl ? texts.overallScoreLabel : texts.overallScoreLabel.toUpperCase(),
      50,
      330,
      { width: 495, align: 'center' }
    );

    const scoreStatus =
      results.overallScore >= 80
        ? 'excellent'
        : results.overallScore >= 60
          ? 'good'
          : results.overallScore >= 40
            ? 'warning'
            : 'critical';

    doc.font(fonts.bold).fontSize(14).fillColor(scoreColor);
    write(texts.scoreStatus[scoreStatus], 50, 500, { width: 495, align: 'center' });

    const statsY = 560;
    const totalIssues = Object.values(results.sections).reduce(
      (sum, s) => sum + (s.recommendations?.length || 0),
      0
    );
    const criticalIssues = Object.values(results.sections).reduce(
      (sum, s) => sum + (s.recommendations?.filter(r => r.impact === 'high').length || 0),
      0
    );

    const stats = [
      {
        label: texts.sections?.performance || 'Performance',
        value: results.sections.performance?.score || 0,
      },
      { label: texts.sections?.seo || 'SEO', value: results.sections.seo?.score || 0 },
      { label: texts.criticalIssuesLabel, value: criticalIssues },
      { label: texts.totalIssuesLabel, value: totalIssues },
    ];

    const statWidth = 110;
    const statStartX = 75;
    stats.forEach((stat, i) => {
      const x = statStartX + i * (statWidth + 20);
      doc.roundedRect(x, statsY, statWidth, 70, 8).fill(colors.lightBg);
      doc.font(fonts.bold).fontSize(24).fillColor(colors.dark);
      write(String(stat.value), x, statsY + 15, { width: statWidth, align: 'center', rtl: false });
      doc.font(fonts.regular).fontSize(9).fillColor(colors.muted);
      write(
        isRtl ? stat.label : stat.label.toUpperCase(),
        x,
        statsY + 48,
        { width: statWidth, align: 'center' }
      );
    });

    doc.font(fonts.regular).fontSize(9).fillColor(colors.muted);
    write(texts.generatedByFooter, 50, 780, { width: 495, align: 'center' });

    doc.addPage();

    doc.font(fonts.bold).fontSize(22).fillColor(colors.dark);
    write(texts.scoreBreakdownTitle, 50, 50, { width: 495 });
    doc.moveTo(50, 85).lineTo(545, 85).stroke(colors.border);

    const sectionOrder = ['performance', 'seo', 'accessibility', 'bestPractices', 'cart', 'trust'];
    let cardY = 110;

    sectionOrder.forEach(key => {
      const section = results.sections[key];
      if (!section) return;

      const label = texts.sections[key] || section.name || key;
      const score = section.score;
      const scoreCol = getScoreColor(score);

      doc.roundedRect(50, cardY, 495, 65, 8).fill(colors.lightBg);

      const barWidth = (score / 100) * 380;
      doc.roundedRect(95, cardY + 40, 380, 10, 5).fill('#e2e8f0');
      doc.roundedRect(95, cardY + 40, barWidth, 10, 5).fill(scoreCol);

      doc.font(fonts.bold).fontSize(16).fillColor(colors.text);
      write(label, 60, cardY + 15, { width: 380 });

      doc.font(fonts.bold).fontSize(20).fillColor(scoreCol);
      write(String(score), 485, cardY + 15, { width: 50, align: 'right', rtl: false });

      cardY += 80;
    });

    doc.addPage();

    doc.font(fonts.bold).fontSize(22).fillColor(colors.dark);
    write(texts.priorityFixesTitle, 50, 50, { width: 495 });
    doc.moveTo(50, 85).lineTo(545, 85).stroke(colors.border);

    const allRecs = [];
    Object.values(results.sections).forEach(section => {
      if (section.recommendations) {
        section.recommendations.forEach(rec => {
          if (rec.impact === 'high') allRecs.push(rec);
        });
      }
    });

    let recY = 110;
    const topRecs = allRecs.slice(0, 8);

    if (topRecs.length === 0) {
      doc.roundedRect(50, recY, 495, 60, 8).fill('#ecfdf5');
      doc.font(fonts.bold).fontSize(14).fillColor('#166534');
      write(texts.noCriticalIssuesFound, 70, recY + 22, { width: 455 });
    } else {
      topRecs.forEach((rec, idx) => {
        if (recY > 700) {
          doc.addPage();
          recY = 50;
        }

        doc.roundedRect(50, recY, 495, 55, 6).fill('#ffffff').stroke(colors.border);

        doc.roundedRect(60, recY + 12, 28, 28, 6).fill('#fef2f2');
        doc.font(fonts.bold).fontSize(14).fillColor(colors.danger);
        write(String(idx + 1), 60, recY + 20, { width: 28, align: 'center', rtl: false });

        doc.roundedRect(100, recY + 12, 80, 20, 4).fill('#fef2f2');
        doc.font(fonts.bold).fontSize(8).fillColor(colors.danger);
        write(isRtl ? texts.impact?.high || 'HIGH IMPACT' : (texts.impact?.high || 'HIGH IMPACT').toUpperCase(), 100, recY + 18, {
          width: 80,
          align: 'center',
          rtl: isRtl,
        });

        doc.font(fonts.bold).fontSize(11).fillColor(colors.text);
        write(rec.title, 100, recY + 36, { width: 430, rtl: false });

        recY += 65;
      });
    }

    doc.addPage();

    doc.font(fonts.bold).fontSize(22).fillColor(colors.dark);
    write(texts.actionRoadmapTitle, 50, 50, { width: 495 });

    doc.font(fonts.regular).fontSize(12).fillColor(colors.muted);
    write(texts.actionRoadmapSubtitle, 50, 80, { width: 495 });
    doc.moveTo(50, 105).lineTo(545, 105).stroke(colors.border);

    const allRecsForRoadmap = [];
    sectionOrder.forEach(key => {
      const section = results.sections[key];
      if (section?.recommendations) {
        section.recommendations.forEach(rec => {
          allRecsForRoadmap.push({
            ...rec,
            sectionKey: key,
            sectionName: texts.sections[key] || section.name,
          });
        });
      }
    });

    const impactOrder = { high: 0, medium: 1, low: 2 };
    allRecsForRoadmap.sort((a, b) => (impactOrder[a.impact] || 2) - (impactOrder[b.impact] || 2));

    const week1 = allRecsForRoadmap.filter(r => r.impact === 'high').slice(0, 3);
    const week2 = allRecsForRoadmap
      .filter(r => r.impact === 'high')
      .slice(3, 5)
      .concat(allRecsForRoadmap.filter(r => r.impact === 'medium').slice(0, 2));
    const week3 = allRecsForRoadmap.filter(r => r.impact === 'medium').slice(2, 5);
    const week4 = allRecsForRoadmap.filter(r => r.impact === 'low').slice(0, 3);

    const weekColors = {
      1: { bg: '#fef2f2', accent: '#dc2626', label: texts.week1 },
      2: { bg: '#fff7ed', accent: '#ea580c', label: texts.week2 },
      3: { bg: '#f0fdf4', accent: '#16a34a', label: texts.week3 },
      4: { bg: '#f8fafc', accent: '#64748b', label: texts.week4 },
    };

    let roadmapY = 125;
    [week1, week2, week3, week4].forEach((weekItems, weekIdx) => {
      if (weekItems.length === 0) return;
      const weekNum = weekIdx + 1;
      const wc = weekColors[weekNum];

      doc.roundedRect(50, roadmapY, 495, 28, 6).fill(wc.bg);
      doc.font(fonts.bold).fontSize(11).fillColor(wc.accent);
      write(wc.label, 60, roadmapY + 8, { width: 380 });

      doc.font(fonts.regular).fontSize(9).fillColor(wc.accent);
      write(`${weekItems.length} ${texts.tasksLabel}`, 485, roadmapY + 10, {
        width: 50,
        align: 'right',
        rtl: false,
      });

      roadmapY += 35;

      weekItems.forEach(item => {
        if (roadmapY > 750) {
          doc.addPage();
          roadmapY = 50;
        }

        doc.circle(65, roadmapY + 6, 4).fill(wc.accent);
        doc.font(fonts.regular).fontSize(10).fillColor(colors.text);
        write(item.title, 80, roadmapY, { width: 400, rtl: false });
        doc.font(fonts.regular).fontSize(8).fillColor(colors.muted);
        write(item.sectionName, 80, roadmapY + 14, { width: 400 });
        roadmapY += 32;
      });

      roadmapY += 15;
    });

    doc.addPage();

    doc.font(fonts.bold).fontSize(22).fillColor(colors.dark);
    write(texts.detailedFindingsTitle, 50, 50, { width: 495 });
    doc.moveTo(50, 85).lineTo(545, 85).stroke(colors.border);

    let findingsY = 110;

    sectionOrder.forEach(key => {
      const section = results.sections[key];
      if (!section) return;

      if (findingsY > 650) {
        doc.addPage();
        findingsY = 50;
      }

      const label = texts.sections[key] || section.name || key;

      doc.roundedRect(50, findingsY, 495, 35, 6).fill(colors.lightBg);
      doc.font(fonts.bold).fontSize(14).fillColor(colors.text);
      write(label, 60, findingsY + 10, { width: 380 });

      const scoreCol = getScoreColor(section.score);
      doc.font(fonts.bold).fontSize(14).fillColor(scoreCol);
      write(`${section.score}/100`, 480, findingsY + 10, {
        width: 55,
        align: 'right',
        rtl: false,
      });

      findingsY += 45;

      const positiveFindings = section.findings?.filter(f => f.type === 'positive') || [];
      const issueFindings = section.findings?.filter(f => f.type === 'issue') || [];
      const allFindings = [...issueFindings, ...positiveFindings].slice(0, 4);

      allFindings.forEach(finding => {
        if (findingsY > 730) {
          doc.addPage();
          findingsY = 50;
        }

        const isIssue = finding.type === 'issue';
        const findingColor = isIssue ? colors.danger : colors.success;
        const findingBg = isIssue ? '#fef2f2' : '#f0fdf4';

        doc.roundedRect(60, findingsY, 475, 30, 4).fill(findingBg);
        doc.font(fonts.bold).fontSize(9).fillColor(findingColor);
        write(isIssue ? 'x' : 'v', 70, findingsY + 10, { rtl: false });
        doc.font(fonts.regular).fontSize(9).fillColor(colors.text);
        write(finding.title, 90, findingsY + 10, { width: 420, rtl: false });

        findingsY += 35;
      });

      findingsY += 20;
    });

    doc.addPage();

    doc.rect(0, 200, 595, 250).fill(colors.dark);

    doc.font(fonts.bold).fontSize(24).fillColor('#ffffff');
    write(texts.ctaTitle, 50, 260, { width: 495, align: 'center' });

    doc.font(fonts.regular).fontSize(14).fillColor('#94a3b8');
    write(texts.ctaText, 70, 310, { width: 455, align: 'center' });

    doc.roundedRect(200, 370, 195, 45, 8).fill(colors.primary);
    doc.font(fonts.bold).fontSize(14).fillColor('#ffffff');
    write(texts.ctaButtonText, 200, 385, { width: 195, align: 'center' });

    doc.roundedRect(50, 500, 495, 80, 8).fill('#fffbeb').stroke('#fef3c7');
    doc.font(fonts.bold).fontSize(12).fillColor('#92400e');
    write(texts.proTipLabel, 70, 520, { width: 455 });
    doc.font(fonts.regular).fontSize(10).fillColor('#b45309');
    write(texts.proTipText, 70, 540, { width: 455 });

    doc.font(fonts.regular).fontSize(11).fillColor(colors.muted);
    write(`${texts.questionsContact} ${contactEmail}`, 50, 620, {
      width: 495,
      align: 'center',
    });
    write('cart-shift.com', 50, 640, { width: 495, align: 'center', rtl: false });

    doc.font(fonts.regular).fontSize(9).fillColor(colors.muted);
    write(`${texts.reportGeneratedOn} ${reportDate} • ${storeUrl}`, 50, 780, {
      width: 495,
      align: 'center',
      rtl: false,
    });

    doc.end();
  });
}

module.exports = { generateStoreAnalysisPDF };
