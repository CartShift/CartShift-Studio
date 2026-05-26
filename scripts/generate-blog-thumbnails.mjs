/* global Buffer, console, fetch */
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import sharp from 'sharp';

const MODEL = 'gpt-image-2';
const SIZE = '1344x704';
const QUALITY = 'medium';
const OUTPUT_FORMAT = 'webp';
const OUTPUT_COMPRESSION = 84;
const POSTS_DIR = path.join(process.cwd(), 'content', 'blog');
const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'blog');

const visualBriefs = {
  'abandoned-cart-recovery-strategies-2026':
    'A half-packed ecommerce order on a real desk beside a laptop showing an anonymized checkout recovery flow, warm practical lighting, trust and follow-up cues.',
  'ai-tools-ecommerce-complete-guide-2026':
    'A realistic ecommerce operations desk with product cards, support queue, analytics tiles, and catalog cleanup notes on screens, human-reviewed AI workflow without sci-fi styling.',
  'amazon-fba-vs-shopify-2026':
    'A grounded comparison scene: shipping labels and warehouse boxes on one side, a branded independent store dashboard on the other, balanced and neutral.',
  'complete-guide-ecommerce-migration':
    'A migration planning table with product catalog sheets, URL mapping cards, analytics notes, and two store admin screens, calm project-room realism.',
  'conversion-audit-checklist':
    'A conversion audit workspace with mobile product page printouts, checkout checklist, heatmap-style notes, and a realistic store review session.',
  'customer-lifetime-value-guide':
    'A retention strategy desk with repeat purchase cohorts, customer cards, email flow notes, and revenue timeline charts, executive but approachable.',
  'dropshipping-guide-2026':
    'A realistic product sourcing workspace with supplier samples, margin notes, shipping timeline cards, and a laptop store mockup, trustworthy not get-rich-quick.',
  'ecommerce-conversion-rate-optimization':
    'A CRO testing table with product page variants, checkout friction notes, analytics graphs, and sticky note hypotheses, professional growth team setting.',
  'email-marketing-for-e-commerce':
    'An email lifecycle planning board with welcome, cart, post-purchase, replenishment, and win-back flow cards beside a laptop, no readable copy.',
  'fashion-ecommerce-guide':
    'A fashion ecommerce studio table with fabric swatches, size chart notes, returns analysis, and a product page on a tablet, tactile and premium.',
  'improve-shopify-seo-results':
    'A Shopify SEO improvement workspace with collection hierarchy sketches, search intent notes, internal linking map, and analytics dashboard elements.',
  'mobile-commerce-optimization':
    'Several real phones showing anonymized product pages and checkout states on a testing bench, thumb-friendly UX notes and performance checklist nearby.',
  'product-photography-ecommerce-guide':
    'A small ecommerce product photography setup with softboxes, neutral backdrop, product props, color card, and laptop review screen, realistic studio detail.',
  'shopify-apps-optimization-guide':
    'A Shopify app stack audit scene with app cards, performance waterfall chart, subscription cost notes, and page-speed review on a laptop.',
  'shopify-seo-audit-checklist':
    'A Shopify SEO audit command center with indexability checklist, collection page map, structured data notes, and Search Console-style graphs.',
  'shopify-seo-complete-guide':
    'A complete Shopify SEO planning desk with technical crawl outputs, collection strategy map, product content briefs, and revenue-path annotations.',
  'shopify-seo-performance-evaluation':
    'A practical SEO performance review scene with Search Console-style charts, ranking movement notes, CTR analysis, and Shopify revenue signals on screens.',
  'shopify-vs-woocommerce':
    'A neutral ecommerce platform choice scene with Shopify-like hosted dashboard on one screen and WooCommerce-like admin on another, ownership and maintenance notes.',
  'speed-up-shopify-store':
    'A Shopify speed optimization desk with performance waterfall, compressed image thumbnails, app audit cards, and mobile loading test on a phone.',
  'store-speed-vs-conversion':
    'A store speed and conversion analysis scene with fast-loading product page mockups, conversion funnel chart, and performance metrics on a realistic workstation.',
  'subscription-box-business-guide-2026':
    'A subscription box planning table with curated product samples, packaging mockups, margin sheet, retention notes, and shipping calendar.',
  'tiktok-shop-complete-guide-2026':
    'A social commerce operations desk with vertical video storyboard cards, product samples, creator notes, live selling schedule, and order dashboard.',
  'why-shopify-stores-dont-rank':
    'A diagnostic Shopify SEO scene with blocked index paths, thin collection notes, slow template indicators, and search visibility charts on a laptop.',
  'why-your-store-isnt-converting':
    'A conversion problem-solving workspace with customer journey notes, product page screenshots, checkout trust issues, and mobile UX observations.',
  'woocommerce-vs-shopify':
    'A WooCommerce versus Shopify decision desk with plugin maintenance notes, hosted checkout reliability cards, content flexibility diagram, and cost comparison.',
  'wordpress-performance-optimization':
    'A WordPress performance cleanup workspace with plugin audit cards, image optimization queue, cache settings, font loading notes, and speed dashboard.',
  'wordpress-technical-seo':
    'A WordPress technical SEO checklist desk with sitemap, canonical, structured data, multilingual routing, crawl diagnostics, and indexability notes.',
};

const args = new Set(process.argv.slice(2).filter(arg => !arg.includes('=')));
const argValues = Object.fromEntries(
  process.argv
    .slice(2)
    .filter(arg => arg.includes('='))
    .map(arg => {
      const [key, ...value] = arg.split('=');
      return [key.replace(/^--/, ''), value.join('=')];
    })
);

const dryRun = args.has('--dry-run');
const force = args.has('--force');
const limit = argValues.limit ? Number.parseInt(argValues.limit, 10) : undefined;
const selectedSlugs = argValues.slugs
  ? new Set(argValues.slugs.split(',').map(slug => slug.trim()).filter(Boolean))
  : null;

function yamlQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildImageAlt(title) {
  return `Editorial ecommerce thumbnail for ${title}`;
}

function buildPrompt({ slug, title, excerpt, category }) {
  const visualBrief = visualBriefs[slug] || excerpt;

  return [
    'Use case: photorealistic-natural',
    'Asset type: blog thumbnail and Open Graph image for a professional ecommerce agency website',
    `Primary request: ${visualBrief}`,
    `Article topic: ${title}`,
    `Category: ${category}`,
    `Editorial context: ${excerpt}`,
    'Style/medium: photorealistic editorial business photography, credible ecommerce operations, natural lens perspective, authentic materials, mild real-world imperfections.',
    'Composition/framing: wide 1344x704 landscape thumbnail, clear central subject, enough quiet edge space for responsive cropping, no text overlays.',
    'Lighting/mood: soft daylight mixed with restrained studio light, premium but practical, high trust, calm expert tone.',
    'Color palette: neutral charcoal, white, glass, soft gray, muted green and blue accents; avoid neon gradients and fantasy colors.',
    'Materials/textures: real laptops, phones, paper notes, packaging, products, fabric, cardboard, glass screens with non-readable abstract UI.',
    'Constraints: make it look like a real commissioned editorial photo, not an AI-generated illustration; no brand logos, no platform logos, no readable text, no fake gibberish words, no people with visible faces, no hands with malformed fingers, no watermarks.',
    'Avoid: cartoon style, 3D render, plastic glossy AI look, floating icons, impossible dashboards, dramatic sci-fi glow, over-symmetric composition, text in the image.',
  ].join('\n');
}

async function updateFrontmatter(filePath, imagePath, imageAlt) {
  const original = await fs.readFile(filePath, 'utf8');
  const frontmatterEnd = original.indexOf('\n---', 3);

  if (!original.startsWith('---') || frontmatterEnd === -1) {
    throw new Error(`Missing frontmatter in ${filePath}`);
  }

  let frontmatter = original.slice(0, frontmatterEnd);
  const rest = original.slice(frontmatterEnd);
  const imageLine = `image: ${yamlQuote(imagePath)}`;
  const altLine = `imageAlt: ${yamlQuote(imageAlt)}`;

  if (/^image:\s*.*$/m.test(frontmatter)) {
    frontmatter = frontmatter.replace(/^image:\s*.*$/m, imageLine);
  } else if (/^category:\s*.*$/m.test(frontmatter)) {
    frontmatter = frontmatter.replace(/^category:\s*.*$/m, match => `${match}\n${imageLine}`);
  } else {
    frontmatter = `${frontmatter}\n${imageLine}`;
  }

  if (/^imageAlt:\s*.*$/m.test(frontmatter)) {
    frontmatter = frontmatter.replace(/^imageAlt:\s*.*$/m, altLine);
  } else {
    frontmatter = frontmatter.replace(/^image:\s*.*$/m, match => `${match}\n${altLine}`);
  }

  await fs.writeFile(filePath, `${frontmatter}${rest}`);
}

async function generateImage(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set.');
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      size: SIZE,
      quality: QUALITY,
      output_format: OUTPUT_FORMAT,
      output_compression: OUTPUT_COMPRESSION,
      moderation: 'auto',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI image generation failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  const b64 = payload?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('OpenAI response did not include data[0].b64_json.');
  }

  return Buffer.from(b64, 'base64');
}

async function main() {
  await fs.mkdir(IMAGE_DIR, { recursive: true });

  const files = (await fs.readdir(POSTS_DIR))
    .filter(file => file.endsWith('.md'))
    .sort();

  const posts = [];
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    if (selectedSlugs && !selectedSlugs.has(slug)) continue;

    const filePath = path.join(POSTS_DIR, file);
    const raw = await fs.readFile(filePath, 'utf8');
    const { data } = matter(raw);
    posts.push({
      slug,
      filePath,
      title: data.title || slug,
      excerpt: data.excerpt || '',
      category: data.category || 'E-commerce Strategy',
      existingImage: data.image || '',
    });
  }

  const limitedPosts = Number.isFinite(limit) ? posts.slice(0, limit) : posts;

  for (const post of limitedPosts) {
    const outputFile = path.join(IMAGE_DIR, `${post.slug}.webp`);
    const publicImagePath = `/images/blog/${post.slug}.webp`;
    const imageAlt = buildImageAlt(post.title);
    const prompt = buildPrompt(post);

    if (!force && post.existingImage && (await exists(outputFile))) {
      console.log(`Skipping ${post.slug}; image already exists.`);
      continue;
    }

    if (dryRun) {
      console.log(`\n# ${post.slug}\n${prompt}\n`);
      continue;
    }

    console.log(`Generating ${post.slug} with ${MODEL}...`);
    const imageBuffer = await generateImage(prompt);
    const normalized = await sharp(imageBuffer)
      .resize(1344, 704, { fit: 'cover', position: 'centre' })
      .webp({ quality: OUTPUT_COMPRESSION })
      .toBuffer();

    await fs.writeFile(outputFile, normalized);
    await updateFrontmatter(post.filePath, publicImagePath, imageAlt);
    console.log(`Saved ${publicImagePath}`);
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
