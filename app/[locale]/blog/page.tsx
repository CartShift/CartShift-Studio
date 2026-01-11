import { setRequestLocale } from 'next-intl/server';
import { BlogTemplate } from "@/components/templates/BlogTemplate";
import { getAllPosts } from "@/lib/markdown";
import { generateMetadata as genMeta, generateBreadcrumbSchema, generateCollectionPageSchema } from "@/lib/seo";
import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = genMeta({
  title: "E-commerce Blog | Shopify & WordPress Guides | CartShift Studio",
  description: "Expert e-commerce tips, Shopify guides, and WordPress tutorials. Learn how to optimize your online store and content sites for success.",
  url: "/blog",
  keywords: [
    "e-commerce blog",
    "Shopify tips",
    "WordPress tutorials",
    "e-commerce SEO",
    "Shopify guides",
    "online store optimization",
    "e-commerce conversion",
    "Shopify vs WooCommerce",
  ],
});

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const posts = await getAllPosts();
  const categories = Array.from(new Set(posts.map((post) => post.category)));

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
  ]);

  const collectionSchema = generateCollectionPageSchema({
    name: "E-commerce Blog",
    description: "Expert e-commerce tips, Shopify guides, and WordPress tutorials",
    url: "/blog",
    items: posts.slice(0, 10).map((post) => ({
      name: post.title,
      url: `/blog/${post.slug}`,
      description: post.excerpt,
    })),
  });

  return (
    <>
      <Script
        id="blog-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="blog-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <BlogTemplate posts={posts} categories={categories} />
    </>
  );
}

