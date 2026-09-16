import type { CVData, CVExperienceItem, CVExperienceKey, CVSkillKey } from './cv-data';
import { CV_PROFILE_IMAGE, companyLogos } from './cv-media';

type ResolvedAssets = Record<string, string>;

const featuredExperienceKeys: readonly CVExperienceKey[] = ['cartshift', 'curalife', 'paragonex'];
const earlierExperienceKeys: readonly CVExperienceKey[] = [
  'ecommerce_venture',
  'hot',
  'leumi',
  'entrepreneurship',
  'elbit',
  'airforce',
];

const printSkillLimits: Partial<Record<CVSkillKey, number>> = {
  productEngineering: 4,
  frontendFullStack: 5,
  commerceIntegrations: 6,
  cloudData: 6,
  aiAutomation: 5,
  legacyEnterprise: 5,
};

const earlierSummaries: Partial<Record<CVExperienceKey, string>> = {
  ecommerce_venture:
    'Built and operated DTC storefronts, payments, fulfillment, analytics, acquisition, and conversion.',
  hot: 'Enterprise integrations using Oracle OSB, WebLogic, DataPower, and JMS.',
  leumi: 'High-availability banking integrations with WebSphere ESB, Integration Bus, and DataPower.',
  entrepreneurship: 'Delivered web and integration projects, plus independent products from requirements to launch.',
  elbit: 'Real-time C++ command-and-control software.',
  airforce: 'Distributed integration systems and legacy modernization.',
};

const printProjects = [
  {
    key: 'starlinker',
    name: 'StarLinker',
    href: 'https://starlinker.io',
    displayHref: 'starlinker.io ↗',
    description:
      'AI-assisted planning product with a real-time voice agent, permissioned actions, live UI updates, and undo.',
  },
  {
    key: 'wakemyway',
    name: 'WakeMyWay',
    href: 'https://wakemyway.vercel.app',
    displayHref: 'wakemyway.vercel.app ↗',
    description:
      'Local-first conversational Android alarm with reliability-first scheduling, adaptive wake routines, local voice, and motion evidence.',
  },
  {
    key: 'rightflow',
    name: 'RightFlow',
    href: 'https://right-flow.com',
    displayHref: 'right-flow.com ↗',
    description:
      'Full-stack workflow and automation product owned from definition through production, with integrations and AI-assisted workflows.',
  },
  {
    key: 'liquidloom',
    name: 'Liquid Loom',
    href: 'https://github.com/yotamon/Liquid-Loom',
    displayHref: 'GitHub ↗',
    description:
      'Open-source engineering layer for Shopify Liquid themes with deterministic builds, ownership diagnostics, and agent-readable architecture.',
  },
] as const;

const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string | undefined | null): string {
  return String(value ?? '').replace(/[&<>"']/g, char => htmlEntities[char] ?? char);
}

function escapeAttr(value: string | undefined | null): string {
  return escapeHtml(value);
}

function assetUrl(path: string | undefined, resolvedAssets: ResolvedAssets): string {
  if (!path) return '';
  return resolvedAssets[path] ?? path;
}

function compactDuration(value: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/\bJanuary\b/g, 'Jan'],
    [/\bFebruary\b/g, 'Feb'],
    [/\bMarch\b/g, 'Mar'],
    [/\bApril\b/g, 'Apr'],
    [/\bJune\b/g, 'Jun'],
    [/\bJuly\b/g, 'Jul'],
    [/\bAugust\b/g, 'Aug'],
    [/\bSeptember\b/g, 'Sep'],
    [/\bOctober\b/g, 'Oct'],
    [/\bNovember\b/g, 'Nov'],
    [/\bDecember\b/g, 'Dec'],
  ];

  return replacements.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), value);
}

function compactLocation(value?: string): string {
  if (!value) return '';
  return value
    .replace(/,\s*Germany$/i, '')
    .replace(/,\s*Israel$/i, '')
    .replace(/\s+Area$/i, '')
    .trim();
}

function experienceByKey(cv: CVData, key: CVExperienceKey): CVExperienceItem | undefined {
  return cv.experiences.find(item => item.key === key);
}

function iconSvg(name: 'briefcase' | 'cube' | 'gear' | 'cap' | 'globe' | 'user'): string {
  const common = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
  const paths: Record<typeof name, string> = {
    briefcase:
      '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M3 11h18"/>',
    cube: '<path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z"/><path d="m4 6.5 8 4.5 8-4.5M12 11v9"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.28.3.5.65.6 1 .1.36.13.73.1 1.1H21v4h-.09a1.7 1.7 0 0 0-1.51.9Z"/>',
    cap: '<path d="m2 10 10-5 10 5-10 5L2 10Z"/><path d="M6 12.2v4.2c2.8 2 9.2 2 12 0v-4.2M22 10v6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.7 5.5 3.7 9S14.5 18.5 12 21M12 3c-2.5 2.5-3.7 5.5-3.7 9S9.5 18.5 12 21"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-5 3.5-7 8-7s7.2 2 8 7"/>',
  };
  return `<svg viewBox="0 0 24 24" ${common}>${paths[name]}</svg>`;
}

function projectLogo(key: (typeof printProjects)[number]['key']): string {
  if (key === 'starlinker') {
    return `<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="13" fill="#091b39"/><ellipse cx="31" cy="33" rx="20" ry="9" fill="none" stroke="#8aa5ff" stroke-width="4" transform="rotate(-12 31 33)"/><circle cx="47" cy="25" r="4" fill="#c9d6ff"/><circle cx="23" cy="37" r="3" fill="#6d7fe8"/></svg>`;
  }
  if (key === 'wakemyway') {
    return `<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="13" fill="#08142F"/><path d="M22 39a10 10 0 0 1 20 0H22Z" fill="#FF9F6D"/><path d="M8 39c5 0 7-4 11-4s6 5 10 5 5-5 9-5 6 4 10 4 5-3 8-3" fill="none" stroke="#F8F7F4" stroke-width="3" stroke-linecap="round"/></svg>`;
  }
  if (key === 'rightflow') {
    return `<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="13" fill="#0B5F90"/><text x="12" y="31" fill="#fff" font-size="20" font-family="Arial" font-weight="700">RF</text><path d="M8 47c9-8 17-8 25 0s15 8 23 0" fill="none" stroke="#46d6ef" stroke-width="3" stroke-linecap="round"/><text x="13" y="54" fill="#aeeeff" font-size="5" font-family="Arial">01</text></svg>`;
  }
  return `<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="13" fill="#0A0B0D"/><path d="M19 18v29h23" fill="none" stroke="#f6f7f8" stroke-width="5" stroke-linecap="square"/><path d="M28 13v27" stroke="#53e1d1" stroke-width="5"/><path d="M22 34h27" stroke="#ff8c84" stroke-width="5"/><circle cx="48" cy="24" r="3" fill="#ffe28d"/></svg>`;
}

function companyLogo(experience: CVExperienceItem, resolvedAssets: ResolvedAssets): string {
  const path = companyLogos[experience.key];
  if (!path || experience.key === 'airforce') {
    const label =
      experience.key === 'airforce'
        ? '&lt;/&gt;'
        : escapeHtml(experience.company.charAt(0).toUpperCase());
    return `<div class="mini-logo fallback">${label}</div>`;
  }
  const src = assetUrl(path, resolvedAssets);
  const classes = [
    'mini-logo',
    experience.key === 'hot' ? 'hot' : '',
    experience.key === 'elbit' ? 'elbit' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<div class="${classes}"><img src="${escapeAttr(src)}" alt="${escapeAttr(experience.company)}"/></div>`;
}

function renderFeaturedExperience(
  experience: CVExperienceItem,
  resolvedAssets: ResolvedAssets
): string {
  const logoPath = companyLogos[experience.key];
  const logo = logoPath
    ? `<div class="job-logo"><img src="${escapeAttr(assetUrl(logoPath, resolvedAssets))}" alt="${escapeAttr(experience.company)}"/></div>`
    : '<div class="job-logo fallback">S</div>';
  const location = compactLocation(experience.location);
  const badge =
    experience.key === 'cartshift' ? '<span class="badge">INDEPENDENT VENTURE</span>' : '';
  const highlights = experience.highlights
    .slice(0, experience.key === 'paragonex' ? 2 : 3)
    .map(highlight => `<li>${escapeHtml(highlight)}</li>`)
    .join('');

  return `<article class="job">
    ${logo}
    <div class="job-head">
      <div class="job-title">${escapeHtml(experience.title)}</div>
      <div class="job-meta">
        <span class="meta-date">${escapeHtml(compactDuration(experience.duration))}</span>
        ${location ? `<span class="meta-place">${escapeHtml(location)}</span>` : ''}
      </div>
    </div>
    <div class="company-line">${escapeHtml(experience.company)} ${badge}</div>
    ${experience.description ? `<div class="job-intro">${escapeHtml(experience.description)}</div>` : ''}
    <ul class="bullets">${highlights}</ul>
  </article>`;
}

function renderEarlierExperience(
  experience: CVExperienceItem,
  resolvedAssets: ResolvedAssets
): string {
  const description = earlierSummaries[experience.key] ?? experience.highlights[0] ?? '';
  return `<div class="earlier-row">
    ${companyLogo(experience, resolvedAssets)}
    <div class="earlier-copy">
      <div class="earlier-head">
        <div class="er-title">${escapeHtml(experience.title)}</div>
        <div class="er-date">${escapeHtml(compactDuration(experience.duration))}</div>
      </div>
      <div class="er-company">${escapeHtml(experience.company)}</div>
      <div class="er-desc">${escapeHtml(description)}</div>
    </div>
  </div>`;
}

function renderProject(project: (typeof printProjects)[number]): string {
  return `<a class="product" href="${escapeAttr(project.href)}">
    <div class="product-icon">${projectLogo(project.key)}</div>
    <div>
      <div class="p-title">${escapeHtml(project.name)}</div>
      <div class="p-link">${escapeHtml(project.displayHref)}</div>
      <div class="p-desc">${escapeHtml(project.description)}</div>
    </div>
  </a>`;
}

export function renderCvHtml(cv: CVData, resolvedAssets: ResolvedAssets = {}): string {
  const featured = featuredExperienceKeys
    .map(key => experienceByKey(cv, key))
    .filter((item): item is CVExperienceItem => Boolean(item));
  const earlier = earlierExperienceKeys
    .map(key => experienceByKey(cv, key))
    .filter((item): item is CVExperienceItem => Boolean(item));
  const photo = assetUrl(CV_PROFILE_IMAGE, resolvedAssets);
  const phoneHref = cv.phone.replace(/\s+/g, '');

  const skills = cv.skills
    .map(skill => {
      const limit = printSkillLimits[skill.key] ?? skill.items.length;
      const visibleItems = skill.items.slice(0, limit);
      return `<div class="skill"><div class="skill-name">${escapeHtml(skill.category)}</div><div class="skill-list">${visibleItems.map(escapeHtml).join(' · ')}</div></div>`;
    })
    .join('');
  const education = cv.education
    .map(
      item =>
        `<div class="edu"><div class="edu-name">${escapeHtml(item.institution)}</div><div class="edu-desc">${escapeHtml(item.program)}${item.years ? ` · ${escapeHtml(item.years)}` : ''}</div></div>`
    )
    .join('');
  const languages = cv.languages
    .map(
      item =>
        `<div class="language"><span class="l">${escapeHtml(item.name)}</span><span class="v">${escapeHtml(item.level)}</span></div>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(cv.title)}</title>
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin:0; padding:0; width:210mm; height:297mm; }
body { font-family:Arial,Helvetica,sans-serif; color:#17253b; background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; overflow:hidden; }
a { color:inherit; text-decoration:none; }
.page { width:210mm; height:297mm; overflow:hidden; background:#fff; }
.hero { height:51mm; position:relative; overflow:hidden; background:radial-gradient(circle at 8% 8%,rgba(31,153,255,.17),transparent 27%),linear-gradient(118deg,#06294e 0%,#082b53 47%,#061d3d 100%); color:#fff; padding:6.2mm 8.2mm 5.4mm; }
.hero::before { content:""; position:absolute; width:88mm; height:88mm; left:70mm; top:-67mm; border:10mm solid rgba(47,151,255,.13); border-radius:50%; transform:rotate(-17deg); }
.hero::after { content:""; position:absolute; right:0; top:0; width:52mm; height:100%; opacity:.28; background-image:radial-gradient(rgba(76,176,255,.62) .45px,transparent .55px); background-size:3.1mm 3.1mm; mask-image:linear-gradient(to left,#000,transparent 95%); }
.hero-grid { position:relative; z-index:2; display:grid; grid-template-columns:34mm minmax(0,1fr); gap:6.3mm; align-items:start; }
.portrait { width:33mm; height:38.5mm; border-radius:2.6mm; overflow:hidden; border:.35mm solid rgba(68,187,255,.65); box-shadow:0 0 0 .25mm rgba(0,0,0,.18); background:#0a203a; }
.portrait img { width:100%; height:100%; object-fit:cover; display:block; }
.identity { padding-top:1.1mm; min-width:0; }
.name { font-size:24pt; line-height:.98; font-weight:800; letter-spacing:-.45pt; margin:0; color:#fff; }
.role-title { margin-top:2.2mm; font-size:11.4pt; line-height:1; font-weight:700; color:#35b5ff; letter-spacing:-.12pt; }
.summary { margin-top:2.25mm; max-width:146mm; font-size:6.85pt; line-height:1.32; color:rgba(255,255,255,.91); }
.contact-row { display:flex; align-items:center; gap:3.1mm; margin-top:1.65mm; white-space:nowrap; color:rgba(255,255,255,.95); font-size:6.7pt; line-height:1; }
.contact-row.secondary { margin-top:1.25mm; }
.contact-item { display:inline-flex; align-items:center; gap:1.2mm; min-height:3.4mm; }
.divider { width:.25mm; height:3mm; background:rgba(255,255,255,.18); margin:0 .45mm; }
.contact-icon { width:3.15mm; height:3.15mm; display:block; color:#39b9ff; flex:none; }
.contact-icon svg { width:100%; height:100%; display:block; }
.body { height:246mm; display:grid; grid-template-columns:138.5mm 71.5mm; }
.main { padding:5.2mm 5.7mm 4mm 8.3mm; background:#fff; min-width:0; overflow:hidden; }
.side { padding:5.2mm 7mm 4mm 5.2mm; background:linear-gradient(90deg,#f7fbff 0%,#fbfdff 100%); border-left:.25mm solid #e9f2f8; overflow:hidden; }
.section-title { display:flex; align-items:center; gap:2.6mm; margin-bottom:3.6mm; color:#0783df; }
.section-icon { width:5.7mm; height:5.7mm; flex:none; display:flex; align-items:center; justify-content:center; }
.section-icon svg { width:100%; height:100%; }
.section-title h2 { margin:0; font-size:8.65pt; letter-spacing:1.15pt; text-transform:uppercase; font-weight:800; white-space:nowrap; }
.section-title .line { height:.25mm; background:#57aee7; flex:1; margin-left:1.5mm; opacity:.9; }
.job { position:relative; padding:0 0 3.35mm 16.5mm; margin-bottom:3.35mm; border-bottom:.24mm solid #dce9f1; width:100%; overflow:hidden; }
.job:last-of-type { margin-bottom:2.9mm; }
.job-logo { position:absolute; left:0; top:.2mm; width:12.2mm; height:12.2mm; border-radius:2mm; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#fff; border:.25mm solid #e4edf4; }
.job-logo img { max-width:100%; max-height:100%; object-fit:contain; display:block; }
.job-head { display:flex; width:100%; align-items:flex-start; justify-content:space-between; gap:3mm; }
.job-title { flex:1 1 auto; min-width:0; font-size:9pt; line-height:1.08; font-weight:780; color:#132844; padding-right:1mm; }
.job-meta { flex:0 0 31mm; display:flex; flex-direction:column; align-items:flex-end; gap:.65mm; text-align:right; color:#647893; padding-top:.15mm; }
.meta-date { white-space:nowrap; font-size:5.85pt; line-height:1; }
.meta-place { white-space:nowrap; font-size:5.75pt; line-height:1; color:#72859d; }
.meta-place::before { content:"⌖"; color:#168fd9; margin-right:.75mm; font-size:6pt; }
.company-line { margin-top:.95mm; display:flex; align-items:center; gap:2mm; font-size:7.1pt; font-weight:740; color:#0783df; line-height:1; }
.badge { font-size:5.35pt; text-transform:uppercase; letter-spacing:.3pt; padding:.85mm 1.9mm .7mm; border-radius:4mm; background:#e5f4ff; color:#0783df; border:.2mm solid #c8e8fa; font-weight:780; }
.job-intro { margin:1.45mm 0 1.55mm; font-size:6.72pt; line-height:1.32; color:#657b97; font-style:italic; }
.bullets { margin:0; padding:0 0 0 4.15mm; color:#48617e; }
.bullets li { margin:0 0 .85mm; padding-left:.55mm; font-size:6.58pt; line-height:1.28; }
.bullets li::marker { color:#0783df; font-size:7.5pt; }
.earlier-title { margin-top:.1mm; margin-bottom:2.1mm; }
.earlier-row { display:grid; grid-template-columns:10mm minmax(0,1fr); column-gap:2.2mm; align-items:start; min-height:13.9mm; padding:1.1mm 0; }
.mini-logo { width:9.1mm; height:9.1mm; border:.2mm solid #d7e5ef; border-radius:1.9mm; display:flex; align-items:center; justify-content:center; overflow:hidden; background:#fff; color:#0783df; font-size:6.8pt; font-weight:800; }
.mini-logo img { max-width:82%; max-height:82%; object-fit:contain; }
.mini-logo.hot img { max-width:74%; max-height:74%; }
.mini-logo.elbit img { max-width:84%; max-height:46%; }
.earlier-copy { min-width:0; }
.earlier-head { display:flex; align-items:baseline; justify-content:space-between; gap:3mm; min-width:0; }
.er-title { font-size:7.02pt; font-weight:780; color:#142844; line-height:1.15; min-width:0; }
.er-date { flex:0 0 auto; text-align:right; font-size:5.55pt; color:#687d96; white-space:nowrap; }
.er-company { margin-top:.55mm; font-size:5.95pt; color:#0783df; font-weight:720; }
.er-desc { margin-top:.45mm; font-size:5.62pt; color:#60758d; line-height:1.22; }
.side .section-title { margin-bottom:3mm; }
.side .section-title h2 { font-size:8.1pt; }
.product { display:grid; grid-template-columns:12.2mm minmax(0,1fr); gap:2.8mm; align-items:start; margin-bottom:3.15mm; }
.product-icon { width:11.6mm; height:11.6mm; border-radius:2mm; overflow:hidden; display:flex; align-items:center; justify-content:center; box-shadow:0 .4mm 1.5mm rgba(10,55,92,.08); }
.product-icon svg { width:100%; height:100%; display:block; }
.p-title { font-size:7.15pt; font-weight:800; color:#063f78; line-height:1.05; margin-top:.2mm; }
.p-link { margin-top:.45mm; font-size:5.25pt; line-height:1.15; font-weight:700; color:#0b8fe7; }
.p-desc { margin-top:.5mm; font-size:5.86pt; color:#60768f; line-height:1.26; }
.side-rule { height:.25mm; background:#dbe8f1; margin:3mm 0 3mm; }
.skill { margin-bottom:2.2mm; }
.skill-name { font-size:6.05pt; text-transform:uppercase; letter-spacing:.43pt; color:#17304f; font-weight:800; }
.skill-list { margin-top:.5mm; font-size:5.62pt; color:#60758d; line-height:1.27; }
.edu { margin-bottom:2.25mm; }
.edu-name { font-size:6.7pt; color:#17304f; font-weight:800; }
.edu-desc { margin-top:.5mm; font-size:5.62pt; color:#657a91; line-height:1.2; }
.language { display:grid; grid-template-columns:1fr auto; font-size:6.35pt; line-height:1.65; }
.language .l { color:#172a45; font-weight:720; }
.language .v { color:#697c94; }
</style>
</head>
<body>
<div class="page">
<header class="hero"><div class="hero-grid"><div class="portrait"><img src="${escapeAttr(photo)}" alt="${escapeAttr(cv.name)}"/></div><div class="identity"><h1 class="name">${escapeHtml(cv.name)}</h1><div class="role-title">${escapeHtml(cv.headline)}</div><div class="summary">${escapeHtml(cv.summary.text)}</div><div class="contact-row"><span class="contact-item"><span class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s6-5.1 6-12a6 6 0 1 0-12 0c0 6.9 6 12 6 12Z"/><circle cx="12" cy="9" r="2"/></svg></span>${escapeHtml(cv.location)}</span><span class="divider"></span><span>${escapeHtml(cv.workAuthorization)}</span></div><div class="contact-row secondary"><a class="contact-item" href="mailto:${escapeAttr(cv.email)}"><span class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span>${escapeHtml(cv.email)}</a><span class="divider"></span><a class="contact-item" href="tel:${escapeAttr(phoneHref)}"><span class="contact-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h3l2 5-2 1.5a16 16 0 0 0 4.5 4.5L16 12l5 2v3c0 2-1 4-4 4C9 21 3 15 3 7c0-3 2-4 4-4Z"/></svg></span>${escapeHtml(cv.phone)}</a></div><div class="contact-row secondary"><a class="contact-item" href="${escapeAttr(cv.contact.linkedinUrl)}"><strong style="color:#39b9ff">in</strong> LinkedIn</a><span class="divider"></span><a class="contact-item" href="${escapeAttr(cv.contact.githubUrl)}"><strong style="color:#39b9ff">gh</strong> GitHub</a><span class="divider"></span><a class="contact-item" href="${escapeAttr(cv.contact.portfolioUrl)}"><strong style="color:#39b9ff">cv</strong> Portfolio</a></div></div></div></header>
<div class="body"><main class="main"><div class="section-title"><div class="section-icon">${iconSvg('briefcase')}</div><h2>Professional Experience</h2><div class="line"></div></div>${featured.map(item => renderFeaturedExperience(item, resolvedAssets)).join('')}<div class="section-title earlier-title"><div class="section-icon">${iconSvg('user')}</div><h2>Earlier Experience</h2><div class="line"></div></div><div class="earlier-list">${earlier.map(item => renderEarlierExperience(item, resolvedAssets)).join('')}</div></main><aside class="side"><div class="section-title"><div class="section-icon">${iconSvg('cube')}</div><h2>Selected Products</h2><div class="line"></div></div>${printProjects.map(renderProject).join('')}<div class="side-rule"></div><div class="section-title"><div class="section-icon">${iconSvg('gear')}</div><h2>Core Skills</h2><div class="line"></div></div>${skills}<div class="side-rule"></div><div class="section-title"><div class="section-icon">${iconSvg('cap')}</div><h2>Education</h2><div class="line"></div></div>${education}<div class="side-rule"></div><div class="section-title"><div class="section-icon">${iconSvg('globe')}</div><h2>Languages</h2><div class="line"></div></div>${languages}</aside></div>
</div>
</body>
</html>`;
}
