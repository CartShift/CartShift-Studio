import type { CVData } from './cv-data';
import { renderCvHtml } from './cv-print-html';

/**
 * A separate editorial design for the Chromium A4 PDF renderer.
 *
 * Keep the existing production template completely unchanged. The experimental
 * layout reuses the same content, two-column grid and print dimensions, and
 * overrides only the visual treatment. Selected via ?design=editorial.
 */
const editorialStyles = "/* Opt-in CV treatment. The original print stylesheet is intentionally untouched. */\n.hero {\n  height:51mm;\n  padding:6mm 9mm 4mm;\n  background:#f0efeb;\n  color:#222124;\n  border-top:1.1mm solid #242326;\n  border-bottom:.25mm solid #d8d4ce;\n}\n.hero::before, .hero::after { display:none; }\n.hero-grid { display:block; }\n.portrait { display:none; }\n.identity { padding-top:0; }\n.name {\n  font-size:27pt;\n  line-height:1.05;\n  font-weight:700;\n  letter-spacing:-.65pt;\n  color:#222124;\n}\n.role-title {\n  margin-top:1.6mm;\n  font-size:10.2pt;\n  font-weight:600;\n  letter-spacing:-.05pt;\n  color:#514d59;\n}\n.summary {\n  max-width:188mm;\n  margin-top:1.65mm;\n  font-size:7.25pt;\n  line-height:1.35;\n  color:#56545a;\n}\n.contact-row {\n  gap:3mm;\n  margin-top:1.2mm;\n  font-size:6.8pt;\n  line-height:1.12;\n  color:#444248;\n}\n.contact-row.secondary { margin-top:1mm; }\n.contact-item { min-height:3mm; }\n.contact-icon { color:#6257d8; width:2.85mm; height:2.85mm; }\n.divider { background:#d0ccc7; height:2.55mm; }\n.hero .contact-item strong { color:#6257d8 !important; }\n.body { height:246mm; }\n.main {\n  padding:5.8mm 5.7mm 4mm 8.3mm;\n  background:#ffffff;\n}\n.side {\n  padding:5.8mm 7mm 4mm 5.2mm;\n  background:#f7f6f3;\n  border-left:.25mm solid #e2e0dc;\n}\n.section-title {\n  gap:1.8mm;\n  margin-bottom:3.35mm;\n  color:#2e2c32;\n}\n.section-icon { display:none; }\n.section-title h2 {\n  font-size:8pt;\n  letter-spacing:1.05pt;\n  font-weight:700;\n}\n.section-title .line {\n  height:.2mm;\n  background:#b8b4b0;\n  opacity:.72;\n  margin-left:1.5mm;\n}\n.job {\n  border-bottom:.2mm solid #e7e5e1;\n}\n.job-logo {\n  border-radius:1.2mm;\n  border-color:#e6e4e0;\n}\n.job-title, .er-title { color:#29272d; font-weight:700; }\n.job-meta, .meta-place, .er-date { color:#747078; }\n.meta-place::before { color:#928c98; }\n.company-line, .er-company {\n  color:#514b5e;\n  font-weight:700;\n}\n.badge {\n  padding:.7mm 1.6mm .65mm;\n  border-radius:.7mm;\n  border:.18mm solid #e3dfec;\n  background:#f0eef5;\n  color:#554e65;\n  letter-spacing:.15pt;\n  font-weight:700;\n}\n.job-intro, .er-desc { color:#67636a; }\n.bullets { color:#55515a; }\n.bullets li::marker { color:#70667f; }\n.mini-logo { color:#554d65; border-radius:1.2mm; border-color:#e2e0dc; }\n.side .section-title h2 { font-size:7.85pt; }\n.product-icon {\n  border-radius:1mm;\n  box-shadow:none;\n  filter:grayscale(1);\n  opacity:.9;\n}\n.p-title { color:#2e2b32; font-weight:700; }\n.p-link { color:#6257a8; }\n.p-desc { color:#6b6770; font-size:5.98pt; }\n.side-rule { height:.2mm; background:#e1ded9; }\n.skill-name, .edu-name, .language .l { color:#322f35; font-weight:700; }\n.skill-list, .edu-desc, .language .v { color:#77727a; }\n";

export function renderEditorialCvHtml(
  cv: CVData,
  resolvedAssets: Record<string, string> = {}
): string {
  const original = renderCvHtml(cv, resolvedAssets);
  // Never embed the headshot in this variant, including in the PDF HTML.
  const portrait = /<div class="portrait"><img[^>]*\/><\/div>/;
  if (!portrait.test(original) || !original.includes('</style>')) {
    throw new Error('CV print template changed; review editorial layout compatibility.');
  }

  return original
    .replace(portrait, '')
    .replace('</style>', `\n${editorialStyles}\n</style>`);
}
