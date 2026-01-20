# SEO Quick Start Guide - CartShift Studio

## 30-Day Implementation Plan

This is your actionable checklist for implementing the most critical SEO improvements in the first 30 days.

---

## Week 1: Foundation & Setup

### Day 1-2: Analytics & Monitoring Setup

- [ ] **Google Search Console**
  - Go to https://search.google.com/search-console
  - Add property: cart-shift.com
  - Verify ownership (DNS or HTML file method)
  - Submit sitemap: https://cart-shift.com/sitemap.xml
- [ ] **Bing Webmaster Tools**
  - Go to https://www.bing.com/webmasters
  - Add site and verify
  - Submit sitemap

- [ ] **Google Analytics 4**
  - Get GA4 measurement ID
  - Add to `.env.local`: `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`
  - Test tracking is working

- [ ] **Set Up Rank Tracking**
  - Use Ahrefs, SEMrush, or free tool like SerpWatcher
  - Track these 20 keywords initially:
    1. shopify development agency
    2. custom shopify store development
    3. wordpress ecommerce development
    4. shopify migration service
    5. woocommerce development agency
    6. shopify store setup service
    7. ecommerce website development
    8. shopify theme customization
    9. shopify performance optimization
    10. custom shopify features
    11. shopify vs woocommerce
    12. ecommerce conversion optimization
    13. shopify seo best practices
    14. speed up shopify store
    15. shopify app development
    16. wordpress to shopify migration
    17. headless shopify development
    18. shopify plus development
    19. woocommerce performance optimization
    20. ecommerce migration service

### Day 3-4: Technical Audit & Fixes

- [ ] Run site through Screaming Frog (free version)
- [ ] Check for broken links
- [ ] Verify all images have alt text
- [ ] Test site on mobile devices
- [ ] Run PageSpeed Insights on all main pages
- [ ] Check robots.txt accessibility: /robots.txt
- [ ] Check sitemap accessibility: /sitemap.xml
- [ ] Verify HTTPS is working properly (no mixed content)

### Day 5-7: Homepage Optimization

- [ ] **Update app/page.tsx metadata** (see code below)
- [ ] **Add H1 to Hero section** in components/sections/Hero.tsx
- [ ] **Add FAQ section** to homepage
- [ ] **Optimize images** in Hero section (compress, add alt text)
- [ ] **Add internal links** from Hero or CTA sections to service pages

---

## Week 2: Service Pages Optimization

### Day 8-10: Shopify Solutions Page

- [ ] **Update page metadata** in app/solutions/shopify/page.tsx
- [ ] **Add H1 tag** to ShopifyPageContent component
- [ ] **Create FAQ section** with 8-10 questions
- [ ] **Add FAQ schema** to page
- [ ] **Optimize content**:
  - Add 300+ words of valuable content
  - Include primary keywords naturally
  - Add bullet points for services
  - Include client testimonials
  - Add clear CTAs
- [ ] **Add internal links** to related blog posts

### Day 11-13: WordPress Solutions Page

- [ ] **Update page metadata** in app/solutions/wordpress/page.tsx
- [ ] **Add H1 tag** to WordPressPageContent component
- [ ] **Create FAQ section** with 8-10 questions
- [ ] **Add FAQ schema** to page
- [ ] **Optimize content** (same as Shopify page)
- [ ] **Add internal links** to related blog posts

### Day 14: About & Contact Pages

- [ ] **Optimize About page** metadata and H1
- [ ] **Optimize Contact page** metadata
- [ ] **Add schema markup** for team members on About page
- [ ] **Ensure NAP consistency** (Name, Address, Phone) if applicable

---

## Week 3: Content Enhancement

### Day 15-17: Blog Post Optimization

For each existing blog post:

- [ ] **Add/optimize featured image** with alt text
- [ ] **Add table of contents** at the top
- [ ] **Add FAQ section** at the bottom
- [ ] **Add 3-5 internal links** to service pages and other posts
- [ ] **Add author bio** section
- [ ] **Add related posts** section
- [ ] **Add social sharing buttons**
- [ ] **Update meta descriptions** to be compelling

Prioritize these posts first:

1. Shopify SEO Complete Guide
2. Shopify vs WooCommerce
3. eCommerce Conversion Rate Optimization

### Day 18-19: New Content Planning

- [ ] **Research 10 blog topics** using:
  - Google Autocomplete
  - "People Also Ask" boxes
  - AnswerThePublic.com
  - Competitor blog analysis
- [ ] **Create content calendar** for next 3 months
- [ ] **Outline first 2 new posts**

### Day 20-21: Schema Markup Enhancement

- [ ] **Add breadcrumb schema** to all pages
- [ ] **Add FAQ schema** to service pages
- [ ] **Test schemas** using Google Rich Results Test
- [ ] **Fix any validation errors**

---

## Week 4: Link Building & Local SEO

### Day 22-23: Google Business Profile

- [ ] **Create/claim profile** at https://business.google.com
- [ ] **Complete all sections**:
  - Business name: CartShift Studio
  - Category: Website Designer, Software Company
  - Description (include keywords)
  - Services list
  - Website URL
  - Hours/availability
- [ ] **Upload photos**:
  - Logo
  - Team photos
  - Office/workspace
  - Project screenshots
- [ ] **Create first post** announcing a service or blog post

### Day 24-25: Directory Submissions

Submit to these directories:

- [ ] Clutch.co (tech agency directory)
- [ ] GoodFirms
- [ ] The Manifest
- [ ] Yelp (if applicable)
- [ ] Yellow Pages (if applicable)
- [ ] Better Business Bureau
- [ ] Local Chamber of Commerce (if applicable)

**Ensure NAP consistency across all listings!**

### Day 26-27: Initial Link Building

- [ ] **Identify 5 guest posting opportunities**:
  - Medium publications (eCommerce, web dev)
  - Dev.to
  - Hashnode
  - Industry blogs accepting submissions
- [ ] **Write 1 guest post pitch** (use template from main strategy doc)
- [ ] **Comment thoughtfully** on 10-15 relevant blog posts with link to your content
- [ ] **Answer 3-5 questions** on:
  - Reddit (r/shopify, r/ecommerce)
  - Quora
  - Stack Overflow (if technical)

### Day 28-30: Content Creation & Review

- [ ] **Write first new blog post** (2,500+ words)
- [ ] **Create 1 infographic** from existing blog content
- [ ] **Review all changes** made this month
- [ ] **Run performance audit**:
  - Check Search Console for any errors
  - Review Analytics for traffic changes
  - Check PageSpeed scores
- [ ] **Document results** and plan Month 2

---

## Critical Code Changes Needed

### 1. Homepage H1 Tag

**File**: `components/sections/Hero.tsx`

Add an H1 tag to the Hero section (currently missing):

```tsx
<h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
  Custom Shopify & WordPress Development for Growing Businesses
</h1>
```

### 2. Homepage Metadata Enhancement

**File**: `app/page.tsx`

Add metadata export:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopify & WordPress Development Agency | Custom eCommerce Solutions',
  description:
    'Transform your online store with CartShift Studio. Expert Shopify & WordPress developers delivering custom eCommerce solutions that drive sales. Free consultation available.',
  openGraph: {
    title: 'CartShift Studio - Bold eCommerce Solutions',
    description: 'Expert Shopify & WordPress development for businesses that want to grow online.',
    images: ['/og-image.jpg'],
  },
};
```

### 3. Add FAQ Schema Component

**Create new file**: `components/sections/FAQ.tsx`

```tsx
import Script from 'next/script';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
  title?: string;
}

export function FAQ({ items, title = 'Frequently Asked Questions' }: FAQProps) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {items.map((item, index) => (
              <details
                key={index}
                className="group bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer"
              >
                <summary className="font-semibold text-lg flex justify-between items-center">
                  {item.question}
                  <span className="ml-4 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600 dark:text-gray-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
```

### 4. Add Breadcrumb Schema to SEO Library

**File**: `lib/seo.ts`

Already implemented! ✅ The `generateBreadcrumbSchema` function exists.

Just need to use it on pages. Example for Shopify page:

```tsx
import { generateBreadcrumbSchema } from '@/lib/seo';

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://cart-shift.com' },
  { name: 'Solutions', url: 'https://cart-shift.com/solutions' },
  { name: 'Shopify Development', url: 'https://cart-shift.com/solutions/shopify' },
]);
```

### 5. Optimize Next.js Image Component

**File**: `next.config.mjs`

Change from `unoptimized: true` to proper optimization:

```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: false, // Enable optimization
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // ... rest of config
};
```

**Note**: If using static export, you may need to keep `unoptimized: true` and handle image optimization at build time.

---

## Environment Variables to Add

Create `.env.local` file in root:

```bash
# Site URL
NEXT_PUBLIC_SITE_URL=https://cart-shift.com

# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Firebase Functions (if using)
NEXT_PUBLIC_FIREBASE_FUNCTION_URL=https://your-function-url
```

---

## Content Templates

### Blog Post Template (Use for new posts)

```markdown
---
title: "Your SEO-Optimized Title with Primary Keyword"
date: "YYYY-MM-DD"
excerpt: "Compelling 150-160 character description with keywords"
category: "Shopify" or "WordPress" or "eCommerce"
---

[Opening paragraph with primary keyword in first 100 words]

## Table of Contents

- [Section 1](#section-1)
- [Section 2](#section-2)
- [FAQ](#faq)

## Section 1

[Content with H2, H3 structure]

## Section 2

[More content]

## Frequently Asked Questions

### Question 1?

Answer...

### Question 2?

Answer...

## Conclusion

[Summary with CTA to services]
```

### Guest Post Pitch Template

```
Subject: Guest Post: [Specific Title] for [Their Blog]

Hi [Name],

I'm [Your Name], founder of CartShift Studio, a Shopify and WordPress
development agency. I've been following [Their Blog] and particularly
enjoyed your recent post on [specific article].

I'd love to contribute a guest post that would provide value to your
audience. I'm thinking of writing about:

"[Your Title]"

This would cover:
• [Point 1 - specific value]
• [Point 2 - specific value]
• [Point 3 - specific value]

You can see my writing style here: [Link to best blog post]

Would this be a good fit? Happy to adjust the topic based on your
editorial needs.

Best regards,
[Your Name]
CartShift Studio
[Website URL]
```

---

## Quick Wins Checklist (Do These First!)

Priority actions that give immediate SEO boost:

1. [ ] Add H1 tags to all pages
2. [ ] Optimize all image alt text
3. [ ] Fix any broken links
4. [ ] Submit sitemap to Google & Bing
5. [ ] Set up Google Business Profile
6. [ ] Update homepage title & meta description
7. [ ] Add FAQ sections to service pages
8. [ ] Create 2 new blog posts
9. [ ] Get 5 directory listings
10. [ ] Start answering questions on Reddit/Quora

---

## Tools You Need (Free Options First)

### Essential Free Tools

- Google Search Console
- Google Analytics 4
- Google PageSpeed Insights
- Google Rich Results Test
- Bing Webmaster Tools
- Screaming Frog (free up to 500 URLs)
- AnswerThePublic (3 free searches/day)
- Ubersuggest (free limited searches)
- Canva (free for basic graphics)

### Paid Tools to Consider (After Month 2)

- Ahrefs Lite: $99/month (best for backlinks & keywords)
- SEMrush Pro: $119.95/month (good all-rounder)
- Surfer SEO: $59/month (content optimization)

---

## Monthly Recurring Tasks

After initial setup, maintain with these monthly tasks:

- [ ] Publish 6-8 blog posts
- [ ] Update 2-3 old blog posts
- [ ] Acquire 5-10 new backlinks
- [ ] Submit 1-2 guest posts
- [ ] Monitor rankings
- [ ] Check Search Console for errors
- [ ] Review Analytics data
- [ ] Post 4-8 times on social media
- [ ] Update Google Business Profile
- [ ] Respond to any reviews/comments
- [ ] Create 1-2 visual assets (infographics)
- [ ] Conduct mini competitor analysis

---

## Red Flags to Avoid

❌ **Don't do these:**

- Keyword stuff content
- Buy backlinks
- Use automated link building tools
- Duplicate content from other sites
- Hide text or links
- Over-optimize anchor text
- Ignore mobile users
- Neglect page speed
- Forget to test changes
- Set it and forget it

✅ **Do these instead:**

- Write for humans first, SEO second
- Earn backlinks through great content
- Build relationships for links
- Create unique, valuable content
- Make everything visible and accessible
- Use natural anchor text variation
- Mobile-first approach
- Optimize for speed continuously
- A/B test and measure
- Monitor and improve constantly

---

## Need Help? Resources

**Google Resources:**

- Google Search Central: https://developers.google.com/search
- Google SEO Starter Guide: https://developers.google.com/search/docs/beginner/seo-starter-guide

**Learning Resources:**

- Moz Beginner's Guide to SEO: https://moz.com/beginners-guide-to-seo
- Ahrefs Blog: https://ahrefs.com/blog
- Backlinko Blog: https://backlinko.com/blog

**Communities:**

- r/SEO on Reddit
- r/bigseo on Reddit
- Moz Community Forum
- Search Engine Journal

---

## Track Your Progress

Use this simple tracker:

| Metric                   | Baseline (Day 0) | Week 4 | Month 2 | Month 3 | Month 6 |
| ------------------------ | ---------------- | ------ | ------- | ------- | ------- |
| Organic Sessions         |                  |        |         |         |         |
| Keywords in Top 50       |                  |        |         |         |         |
| Keywords in Top 10       |                  |        |         |         |         |
| Total Backlinks          |                  |        |         |         |         |
| Referring Domains        |                  |        |         |         |         |
| Blog Posts Published     |                  |        |         |         |         |
| Contact Form Submissions |                  |        |         |         |         |
| PageSpeed Score (Mobile) |                  |        |         |         |         |

---

## Questions or Stuck?

Common issues and solutions:

**Q: Search Console shows 0 impressions**
A: Give it 2-4 weeks after submitting sitemap. Keep publishing content.

**Q: Rankings not improving**
A: SEO takes 3-6 months. Focus on content quality and backlinks.

**Q: Don't have time for all this**
A: Start with homepage optimization and 1 blog post per week. Quality > quantity.

**Q: Can't write 2,500-word posts**
A: Start with 1,000-1,500 words. Expand top-performing posts later.

**Q: No one is linking to me**
A: Create link-worthy content (original research, tools, comprehensive guides).

---

Good luck with your SEO journey! Remember: consistency and quality are key. Focus on providing value to your audience, and rankings will follow.

**Last Updated**: December 17, 2025
