import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/markdown";
import { getAllCaseStudies } from "@/lib/case-studies";

export const dynamic = "force-static";

const locales = ["en", "he"] as const;

type AlternateRef = {
  hreflang: string;
  href: string;
};

function generateAlternates(baseUrl: string, path: string): { languages: Record<string, string> } {
  return {
    languages: {
      en: `${baseUrl}/en${path}`,
      he: `${baseUrl}/he${path}`,
      "x-default": `${baseUrl}/en${path}`,
    },
  };
}

function createLocalizedUrls(
  baseUrl: string,
  path: string,
  lastModified: Date,
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never",
  priority: number
) {
  return locales.map((locale) => ({
    url: `${baseUrl}/${locale}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: generateAlternates(baseUrl, path),
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cart-shift.com";
  const now = new Date();

  const posts = await getAllPosts();
  const caseStudies = getAllCaseStudies("en");

  const blogUrls = posts.flatMap((post) =>
    createLocalizedUrls(
      baseUrl,
      `/blog/${post.slug}`,
      new Date(post.date),
      "monthly",
      0.7
    )
  );

  const caseStudyUrls = caseStudies.flatMap((study) =>
    createLocalizedUrls(
      baseUrl,
      `/work/${study.slug}`,
      now,
      "monthly",
      0.7
    )
  );

  const industries = ["fashion", "food", "health", "tech", "arts", "local"];

  const staticPages = [
    { path: "", changeFrequency: "weekly" as const, priority: 1.0 },
    { path: "/solutions/shopify", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/solutions/wordpress", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/work", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/pricing", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/maintenance", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/blog", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
    ...industries.map(industry => ({
      path: `/industries/${industry}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  const staticUrls = staticPages.flatMap((page) =>
    createLocalizedUrls(baseUrl, page.path, now, page.changeFrequency, page.priority)
  );

  return [...staticUrls, ...blogUrls, ...caseStudyUrls];
}


