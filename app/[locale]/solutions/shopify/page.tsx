import { setRequestLocale } from 'next-intl/server';
import { ShopifyTemplate } from "@/components/templates/ShopifyTemplate";
import { generateMetadata as genMeta, generateServiceSchema, generateBreadcrumbSchema, generateFAQPageSchema } from "@/lib/seo";
import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = genMeta({
  title: "Shopify Development Agency | Store Setup, Custom Features & Migration Services",
  description: "Expert Shopify development services: store setup, custom features, performance optimization, and migration. Trusted by 100+ e-commerce businesses. Free consultation.",
  url: "/solutions/shopify",
  keywords: [
    "Shopify development",
    "Shopify store setup",
    "custom Shopify theme",
    "Shopify migration",
    "Shopify developer",
    "Shopify SEO",
    "Shopify performance optimization",
    "Shopify app development",
    "hire Shopify developer",
  ],
});

export default async function ShopifyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  const serviceSchema = generateServiceSchema(
    "Shopify Development",
    "Expert Shopify development services including store setup, custom features, performance optimization, and ongoing support."
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Solutions", url: "/" },
    { name: "Shopify Development", url: "/solutions/shopify" },
  ]);

  const faqSchema = generateFAQPageSchema([
    {
      question: "What Shopify development services do you offer?",
      answer: "We offer comprehensive Shopify development services including store setup and configuration, custom theme development, app integration, performance optimization, migration from other platforms, ongoing maintenance and support, and SEO optimization for Shopify stores.",
    },
    {
      question: "How long does it take to set up a Shopify store?",
      answer: "The timeline depends on the complexity of your requirements. A basic store setup typically takes 1-2 weeks, while a fully customized store with advanced features can take 4-8 weeks. We'll provide a detailed timeline during our initial consultation based on your specific needs.",
    },
    {
      question: "Can you migrate my existing store to Shopify?",
      answer: "Yes, we specialize in e-commerce migrations. We can migrate your store from Magento, BigCommerce, or other platforms to Shopify. Our migration process includes data transfer, product migration, customer data migration, order history (if applicable), and theme customization to match your brand.",
    },
    {
      question: "Do you provide ongoing support after the store is launched?",
      answer: "Absolutely. We offer ongoing support and maintenance packages to ensure your store continues to perform optimally. This includes regular updates, security monitoring, performance optimization, bug fixes, and feature additions as your business grows.",
    },
    {
      question: "How much does Shopify development cost?",
      answer: "Pricing varies based on project scope and requirements. We provide custom quotes tailored to your specific needs rather than fixed packages. During our free consultation, we'll discuss your goals and provide a transparent pricing proposal that delivers maximum ROI for your investment.",
    },
    {
      question: "Can you customize Shopify themes?",
      answer: "Yes, we specialize in custom Shopify theme development. We can modify existing themes or build completely custom themes from scratch to match your brand identity and business requirements. Our themes are optimized for performance, conversion, and mobile responsiveness.",
    },
    {
      question: "Do you help with Shopify SEO?",
      answer: "Yes, SEO optimization is a crucial part of our Shopify development services. We optimize on-page elements, implement structured data, improve site speed, ensure mobile-friendliness, and provide content optimization strategies to help your store rank better in search engines.",
    },
    {
      question: "What payment gateways can you integrate?",
      answer: "We can integrate all major payment gateways supported by Shopify, including Shopify Payments, PayPal, Stripe, Authorize.net, and many others. We'll help you choose the best payment solution for your business and handle the complete integration.",
    },
    {
      question: "Can you build custom Shopify apps?",
      answer: "Yes, we develop custom Shopify apps to add unique functionality to your store. Whether you need custom checkout features, inventory management tools, or integrations with third-party services, we can build tailored solutions that meet your specific business needs.",
    },
    {
      question: "How do I get started with your Shopify development services?",
      answer: "Getting started is easy! Simply contact us through our contact form or schedule a free consultation. We'll discuss your project requirements, answer any questions, and provide a detailed proposal. There's no obligation, and we're here to help you succeed.",
    },
  ]);

  return (
    <>
      <Script
        id="shopify-service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <Script
        id="shopify-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="shopify-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <ShopifyTemplate />
    </>
  );
}

