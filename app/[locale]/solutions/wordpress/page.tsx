import { setRequestLocale } from 'next-intl/server';
import { WordPressTemplate } from '@/components/templates/WordPressTemplate';
import {
  generateMetadata as genMeta,
  generateServiceSchema,
  generateBreadcrumbSchema,
  generateFAQPageSchema,
} from '@/lib/seo';
import Script from 'next/script';
import type { Metadata } from 'next';

export const metadata: Metadata = genMeta({
  title: 'WordPress Development | Custom Content Sites & News Platforms',
  description:
    'Professional WordPress development for content sites, news platforms, and custom websites. Custom themes, performance optimization, and ongoing support. Get started today.',
  url: '/solutions/wordpress',
  keywords: [
    'WordPress development',
    'custom WordPress theme',
    'WordPress content site',
    'WordPress news platform',
    'WordPress performance optimization',
    'WordPress SEO',
    'WordPress developer',
    'WordPress migration',
  ],
});

export default async function WordPressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const serviceSchema = generateServiceSchema(
    'WordPress Development',
    'Expert WordPress development services for content sites, news platforms, and custom websites. Theme customization, performance optimization, and ongoing support.'
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Solutions', url: '/' },
    { name: 'WordPress Development', url: '/solutions/wordpress' },
  ]);

  const faqSchema = generateFAQPageSchema([
    {
      question: 'What WordPress development services do you offer?',
      answer:
        'We offer comprehensive WordPress development services for content sites, news platforms, and custom websites. This includes custom theme development, plugin customization, performance optimization, content management setup, security hardening, and ongoing maintenance and support.',
    },
    {
      question: 'Do you build e-commerce sites with WordPress?',
      answer:
        'No, we specialize in Shopify for e-commerce stores. WordPress is ideal for content-driven sites like news platforms, blogs, corporate websites, and custom content management systems. For online stores, we recommend Shopify which offers better e-commerce features and reliability.',
    },
    {
      question: 'How long does it take to develop a WordPress site?',
      answer:
        "The timeline varies based on project complexity. A basic content site typically takes 2-3 weeks, while a fully customized site with advanced features can take 6-10 weeks. We'll provide a detailed timeline during our consultation.",
    },
    {
      question: 'Can you migrate my existing WordPress site?',
      answer:
        'Yes, we handle WordPress migrations from various hosting providers and can help optimize your site during the migration process. We ensure all content, media, and settings are safely transferred to your new hosting environment.',
    },
    {
      question: 'Do you provide WordPress hosting and maintenance?',
      answer:
        "While we don't provide hosting directly, we can recommend reliable hosting providers and handle all WordPress maintenance tasks including updates, security monitoring, backups, performance optimization, and technical support.",
    },
    {
      question: 'How much does WordPress development cost?',
      answer:
        "Pricing depends on your project requirements. We provide custom quotes based on your specific needs rather than fixed packages. During our free consultation, we'll discuss your goals and provide transparent pricing that delivers maximum value.",
    },
    {
      question: 'Can you customize WordPress themes?',
      answer:
        'Absolutely. We can modify existing WordPress themes or build completely custom themes tailored to your brand. Our themes are optimized for performance, SEO, mobile responsiveness, and user experience.',
    },
    {
      question: 'Do you help with WordPress security?',
      answer:
        'Yes, security is a top priority. We implement security best practices including SSL certificates, security plugins, regular updates, malware scanning, and secure hosting recommendations to protect your site from threats.',
    },
    {
      question: 'What types of sites are best for WordPress?',
      answer:
        'WordPress is ideal for content-driven sites including news platforms, blogs, corporate websites, portfolios, membership sites, and custom content management systems. For e-commerce stores, we recommend Shopify for better performance and e-commerce features.',
    },
    {
      question: 'How do I get started with your WordPress development services?',
      answer:
        " started is simple! Contact us through our contact form or schedule a free consultation. We'll discuss your project, answer questions, and provide a detailed proposal. There's no obligation, and we're committed to your success.",
    },
  ]);

  return (
    <>
      <Script
        id="wordpress-service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <Script
        id="wordpress-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="wordpress-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <WordPressTemplate />
    </>
  );
}
