import type { CVData } from './cv-data';
import { renderCvHtml } from './cv-print-html';

/**
 * Opt-in editorial print treatment. The production print HTML is not modified.
 * Uses the original CV data and keeps its single-page A4 layout.
 */
const editorialStyles = `
/*
 * Editorial A4 treatment: the original 51 mm header, 246 mm body and
 * 138.5/71.5 mm content split remain intact. No content is dropped.
 * Inspired by the portfolio's warm paper, charcoal ink and violet accent.
 */
.hero {
  height:51mm;
  padding:6mm 9mm 4mm;
  background:#eceae5;
  color:#242226;
  border-top:1.05mm solid #242226;
  border-bottom:.22mm solid #d4d0c9;
}
.hero::before, .hero::after { display:none; }
.hero-grid { display:block; }
.hero-grid::before {
  content:"CURRICULUM VITAE";
  position:absolute;
  top:.7mm;
  right:0;
  color:#837e83;
  font-size:6.1pt;
  font-weight:700;
  letter-spacing:1.15pt;
}
.portrait { display:none; }
.identity { padding-top:0; }
.name {
  margin:0;
  color:#242226;
  font-size:29pt;
  line-height:1.05;
  letter-spacing:-.85pt;
  font-weight:700;
}
.role-title {
  margin-top:1.55mm;
  font-size:10.65pt;
  line-height:1.14;
  letter-spacing:-.1pt;
  color:#514b56;
  font-weight:600;
}
.summary {
  max-width:189mm;
  margin-top:1.75mm;
  font-size:7.55pt;
  line-height:1.32;
  color:#555158;
}
.contact-row {
  gap:2.9mm;
  margin-top:1.35mm;
  font-size:7.0pt;
  line-height:1.13;
  color:#444149;
}
.contact-row.secondary { margin-top:1.05mm; }
.contact-item { min-height:3mm; }
.contact-row a { color:#494553; }
.contact-icon { color:#6257a8; width:2.85mm; height:2.85mm; }
.divider { background:#d0ccc6; height:2.6mm; }
.hero .contact-item strong { color:#6257a8 !important; }

.body { height:246mm; }
.main {
  padding:5.9mm 5.8mm 4mm 8.3mm;
  background:#fff;
}
.side {
  padding:5.9mm 7mm 4mm 5.2mm;
  background:#f6f5f2;
  border-left:.22mm solid #e3dfd9;
}
.section-title {
  gap:1.85mm;
  margin-bottom:3.6mm;
  color:#343139;
}
.section-icon { display:none; }
.section-title h2 {
  font-size:8.45pt;
  letter-spacing:.73pt;
  font-weight:700;
}
.section-title .line {
  height:.2mm;
  margin-left:1.5mm;
  opacity:1;
  background:#d2cec8;
}
.main > .section-title:first-child::before,
.side > .section-title:first-child::before {
  content:"";
  display:block;
  width:.8mm;
  height:3.4mm;
  flex:none;
  background:#6257a8;
}

.job {
  padding-bottom:3.5mm;
  margin-bottom:3.4mm;
  border-bottom:.2mm solid #e6e3de;
}
.job-logo {
  border:.2mm solid #e6e3de;
  border-radius:1.1mm;
  box-shadow:none;
}
.job-logo img,
.mini-logo img {
  filter:grayscale(.86) saturate(.35);
  opacity:.88;
}
.job-title {
  color:#29262d;
  font-size:9.45pt;
  line-height:1.14;
  font-weight:700;
}
.job-meta { color:#726d75; }
.meta-date { font-size:6.05pt; }
.meta-place { color:#726d75; font-size:5.9pt; }
.meta-place::before { color:#8a8294; }
.company-line {
  color:#524c5a;
  font-size:7.35pt;
  font-weight:700;
}
.badge {
  padding:.7mm 1.5mm .6mm;
  border:.17mm solid #e0dce6;
  border-radius:.75mm;
  background:#efedf3;
  color:#514958;
  font-size:5.4pt;
  font-weight:700;
  letter-spacing:.14pt;
}
.job-intro {
  margin:1.4mm 0 1.5mm;
  color:#605c64;
  font-size:7.03pt;
  line-height:1.31;
}
.bullets { color:#4e4b52; }
.bullets li {
  margin-bottom:.95mm;
  font-size:6.94pt;
  line-height:1.31;
}
.bullets li::marker { color:#706780; }

.earlier-title { margin-bottom:2.35mm; }
.earlier-row {
  min-height:14mm;
  padding:1.2mm 0;
}
.mini-logo {
  color:#514958;
  border:.2mm solid #e0dcd7;
  border-radius:1.1mm;
}
.er-title {
  color:#302d33;
  font-size:7.45pt;
  line-height:1.16;
  font-weight:700;
}
.er-date { color:#726d75; font-size:5.9pt; }
.er-company {
  color:#554f5b;
  font-size:6.25pt;
  font-weight:700;
}
.er-desc {
  color:#625e65;
  font-size:6.0pt;
  line-height:1.27;
}

.side .section-title { margin-bottom:3.75mm; }
.side .section-title h2 { font-size:8.15pt; }
.product { margin-bottom:4.15mm; }
.product-icon {
  border-radius:1.15mm;
  box-shadow:none;
  filter:grayscale(.88) saturate(.4);
  opacity:.88;
}
.p-title {
  margin-top:.15mm;
  color:#302d33;
  font-size:7.75pt;
  line-height:1.12;
  font-weight:700;
}
.p-link {
  margin-top:.55mm;
  color:#5d548c;
  font-size:5.8pt;
  font-weight:700;
}
.p-desc {
  margin-top:.65mm;
  color:#625d65;
  font-size:6.4pt;
  line-height:1.32;
}
.side-rule {
  height:.2mm;
  background:#dfdcd7;
  margin:4.1mm 0 4mm;
}
.skill { margin-bottom:3mm; }
.skill-name {
  color:#343039;
  font-size:6.5pt;
  letter-spacing:.27pt;
  font-weight:700;
}
.skill-list {
  margin-top:.65mm;
  color:#656068;
  font-size:6.18pt;
  line-height:1.34;
}
.edu { margin-bottom:3mm; }
.edu-name {
  color:#353139;
  font-size:7.1pt;
  font-weight:700;
}
.edu-desc {
  margin-top:.65mm;
  color:#656068;
  font-size:6.15pt;
  line-height:1.3;
}
.language {
  font-size:6.9pt;
  line-height:1.82;
}
.language .l { color:#353139; font-weight:700; }
.language .v { color:#716c75; }
`;

export function renderEditorialCvHtml(
  cv: CVData,
  resolvedAssets: Record<string, string> = {}
): string {
  const original = renderCvHtml(cv, resolvedAssets);
  // The photo is not emitted in this design, even as a hidden image.
  const portrait = /<div class="portrait"><img[^>]*\/><\/div>/;
  if (!portrait.test(original) || !original.includes('</style>')) {
    throw new Error('CV print template changed; review editorial layout compatibility.');
  }
  return original
    .replace(portrait, '')
    .replace('</style>', `\n${editorialStyles}\n</style>`);
}
