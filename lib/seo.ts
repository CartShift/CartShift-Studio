import { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cart-shift.com";
const defaultOgImage = `${siteUrl}/images/og-default.png`;

export interface SEOConfig {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
  noindex?: boolean;
}

export function generateMetadata(config: SEOConfig, locale?: "en" | "he"): Metadata {
  const imageUrl = config.image || defaultOgImage;
  const pathOnly = config.url?.replace(siteUrl, "").replace(/^\/(en|he)/, "") || "";
  const currentLocale = locale || "en";
  const canonicalUrl = `${siteUrl}/${currentLocale}${pathOnly}`;

  const alternates: Metadata["alternates"] = {
    canonical: canonicalUrl,
    languages: {
      en: `${siteUrl}/en${pathOnly}`,
      he: `${siteUrl}/he${pathOnly}`,
      "x-default": `${siteUrl}/en${pathOnly}`,
    },
  };

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    robots: config.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: config.title,
      description: config.description,
      url: canonicalUrl,
      siteName: "CartShift Studio",
      locale: currentLocale === "he" ? "he_IL" : "en_US",
      alternateLocale: currentLocale === "he" ? "en_US" : "he_IL",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: config.title,
          type: "image/png",
        },
      ],
      type: config.type || "website",
      ...(config.publishedTime && { publishedTime: config.publishedTime }),
      ...(config.modifiedTime && { modifiedTime: config.modifiedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
      images: [imageUrl],
      creator: "@cartshiftstudio",
      site: "@cartshiftstudio",
    },
    alternates,
    other: {
      "og:locale:alternate": currentLocale === "he" ? "en_US" : "he_IL",
    },
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "CartShift Studio",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/logo.png`,
      width: 512,
      height: 512,
    },
    image: `${siteUrl}/images/og-default.png`,
    description: "Expert Shopify & WordPress development agency. Custom e-commerce stores, migrations, and optimization. Get a free consultation for your online store project.",
    foundingDate: "2024",
    slogan: "Bold eCommerce Solutions Built for Your Vision",
    knowsAbout: [
      "Shopify Development",
      "WordPress Development",
      "E-commerce Solutions",
      "Custom Theme Development",
      "Store Migration",
      "Performance Optimization",
      "SEO for E-commerce",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "E-commerce Development Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Shopify Development",
            description: "Custom Shopify store development, themes, and apps",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "WordPress Development",
            description: "Custom WordPress sites for content and publishing",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "E-commerce Migration",
            description: "Seamless migration to Shopify or WordPress",
          },
        },
      ],
    },
    sameAs: [
      "https://twitter.com/cartshiftstudio",
      "https://linkedin.com/company/cartshift-studio",
      "https://github.com/cartshift-studio",
      "https://www.facebook.com/cartshiftstudio",
      "https://www.instagram.com/cartshiftstudio",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Hebrew"],
      url: `${siteUrl}/contact`,
    },
  };
}

export interface ServiceSchemaConfig {
  name: string;
  description: string;
  url?: string;
  image?: string;
  priceRange?: string;
  offers?: Array<{
    name: string;
    description: string;
    price?: string;
  }>;
}

export function generateServiceSchema(serviceName: string, description: string, config?: Partial<ServiceSchemaConfig>) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${siteUrl}/#service-${serviceName.toLowerCase().replace(/\s+/g, "-")}`,
    serviceType: serviceName,
    name: serviceName,
    description: description,
    url: config?.url || siteUrl,
    image: config?.image || `${siteUrl}/images/og-default.png`,
    provider: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "CartShift Studio",
      url: siteUrl,
    },
    areaServed: {
      "@type": "GeoShape",
      name: "Worldwide",
    },
    serviceOutput: {
      "@type": "Product",
      name: `${serviceName} deliverables`,
    },
    hasOfferCatalog: config?.offers ? {
      "@type": "OfferCatalog",
      name: `${serviceName} Packages`,
      itemListElement: config.offers.map((offer, index) => ({
        "@type": "Offer",
        "@id": `${siteUrl}/#offer-${index}`,
        name: offer.name,
        description: offer.description,
        ...(offer.price && { price: offer.price, priceCurrency: "USD" }),
      })),
    } : undefined,
    ...(config?.priceRange && { priceRange: config.priceRange }),
  };
}

export function generateProfessionalServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#professional-service`,
    name: "CartShift Studio",
    url: siteUrl,
    image: `${siteUrl}/images/og-default.png`,
    description: "Expert Shopify & WordPress development agency specializing in custom e-commerce solutions",
    priceRange: "$$",
    areaServed: "Worldwide",
    serviceType: ["Web Development", "E-commerce Development", "Shopify Development", "WordPress Development"],
    knowsAbout: [
      "Shopify",
      "WordPress",
      "WooCommerce",
      "E-commerce",
      "Web Development",
      "SEO",
      "Performance Optimization",
    ],
    makesOffer: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Shopify Store Development",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "WordPress Site Development",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "E-commerce Migration",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Maintenance & Support",
        },
      },
    ],
  };
}

export interface SoftwareApplicationSchemaConfig {
  name: string;
  description: string;
  operatingSystem?: string;
  applicationCategory?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
}

export function generateSoftwareApplicationSchema(config: SoftwareApplicationSchemaConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: config.name,
    description: config.description,
    applicationCategory: config.applicationCategory || "BusinessApplication",
    operatingSystem: config.operatingSystem || "Any",
    url: siteUrl + "/tools/store-analyzer",
    provider: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "CartShift Studio",
    },
    offers: config.offers ? {
      "@type": "Offer",
      price: config.offers.price,
      priceCurrency: config.offers.priceCurrency,
    } : undefined,
    featureList: [
      "Performance Analysis",
      "SEO Audit",
      "Product UX Review",
      "Cart & Checkout Analysis",
      "Trust Signal Assessment",
      "Mobile Responsiveness Check",
    ],
  };
}

export function generateArticleSchema(post: {
  title: string;
  description: string;
  date: string;
  url: string;
  author?: string;
  category?: string;
  image?: string;
  modifiedDate?: string;
  wordCount?: number;
  readingTime?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${post.url}/#article`,
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.modifiedDate || post.date,
    author: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: post.author || "CartShift Studio",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "CartShift Studio",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": post.url,
    },
    inLanguage: "en-US",
    copyrightHolder: {
      "@type": "Organization",
      name: "CartShift Studio",
    },
    copyrightYear: new Date(post.date).getFullYear(),
    ...(post.category && { articleSection: post.category }),
    ...(post.wordCount && { wordCount: post.wordCount }),
    ...(post.readingTime && { timeRequired: `PT${post.readingTime}M` }),
    image: {
      "@type": "ImageObject",
      url: post.image || defaultOgImage,
      width: 1200,
      height: 630,
    },
  };
}

export function generateHowToSchema(howTo: {
  name: string;
  description: string;
  totalTime?: string;
  estimatedCost?: { currency: string; value: string };
  steps: Array<{
    name: string;
    text: string;
    url?: string;
    image?: string;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howTo.name,
    description: howTo.description,
    ...(howTo.totalTime && { totalTime: howTo.totalTime }),
    ...(howTo.estimatedCost && {
      estimatedCost: {
        "@type": "MonetaryAmount",
        currency: howTo.estimatedCost.currency,
        value: howTo.estimatedCost.value,
      },
    }),
    step: howTo.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url }),
      ...(step.image && {
        image: {
          "@type": "ImageObject",
          url: step.image,
        },
      }),
    })),
  };
}

export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#localbusiness`,
    name: "CartShift Studio",
    description: "E-commerce development agency specializing in Shopify and WordPress solutions",
    url: siteUrl,
    image: `${siteUrl}/images/og-default.png`,
    priceRange: "$$",
    serviceArea: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: 32.0853,
        longitude: 34.7818,
      },
      geoRadius: "50000",
    },
    areaServed: "Worldwide",
    knowsLanguage: ["English", "Hebrew"],
  };
}

export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "CartShift Studio",
    url: siteUrl,
    description: "Expert Shopify & WordPress development agency. Custom e-commerce stores, migrations, and optimization.",
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
    },
    inLanguage: ["en-US", "he-IL"],
    potentialAction: [
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/blog?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      {
        "@type": "ReadAction",
        target: `${siteUrl}/blog`,
      },
    ],
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}

export function generateFAQPageSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateReviewSchema(reviews: Array<{
  author: string;
  text: string;
  rating: number;
  date?: string;
}>) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CartShift Studio",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.author,
      },
      reviewBody: review.text,
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      ...(review.date && { datePublished: review.date }),
    })),
  };
}

export function generatePersonSchema(person: {
  name: string;
  jobTitle?: string;
  description?: string;
  url?: string;
  image?: string;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    ...(person.jobTitle && { jobTitle: person.jobTitle }),
    ...(person.description && { description: person.description }),
    ...(person.url && { url: person.url }),
    ...(person.image && {
      image: {
        "@type": "ImageObject",
        url: person.image.startsWith("http") ? person.image : `${siteUrl}${person.image}`,
      },
    }),
    ...(person.sameAs && person.sameAs.length > 0 && { sameAs: person.sameAs }),
    worksFor: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "CartShift Studio",
      url: siteUrl,
    },
  };
}

export function generateCollectionPageSchema(page: {
  name: string;
  description: string;
  url: string;
  items: Array<{
    name: string;
    url: string;
    description?: string;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.name,
    description: page.description,
    url: page.url.startsWith("http") ? page.url : `${siteUrl}${page.url}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: page.items.length,
      itemListElement: page.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
        ...(item.description && { description: item.description }),
      })),
    },
  };
}
