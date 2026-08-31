import React from 'react';
import { Helmet } from 'react-helmet-async';
import type { WithContext, Organization, SoftwareApplication, LocalBusiness, FAQPage, BreadcrumbList, WebSite, WebPage } from 'schema-dts';
import { SITE_URL, SITE_NAME } from './SEO';

// ============================================================
// Helper: Render JSON-LD safely inside Helmet
// Type safety is enforced at call sites via WithContext<T> typed variables.
// ============================================================
function JsonLd({ data }: { data: unknown }) {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}

// ============================================================
// Organization Schema
// ============================================================
export function OrganizationSchema() {
  const schema: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_NAME,
    "url": SITE_URL,
    "logo": `${SITE_URL}/img/logo_header.png`,
    "description": "Nền tảng công nghệ quản lý vận hành và giám sát an ninh toàn diện cho doanh nghiệp Việt Nam.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "36 Cẩm Bắc 11",
      "addressLocality": "Cẩm Lệ",
      "addressRegion": "Đà Nẵng",
      "addressCountry": "VN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+84-905-441-263",
      "contactType": "customer service",
      "email": "support@aegism.com",
      "availableLanguage": ["Vietnamese", "English"]
    },
    "sameAs": []
  };

  return <JsonLd data={schema} />;
}

// ============================================================
// SoftwareApplication Schema
// ============================================================
export function SoftwareApplicationSchema() {
  const schema: WithContext<SoftwareApplication> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AEGISM",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, Android, iOS",
    "description": "Phần mềm quản lý vận hành, giám sát tuần tra QR Code và báo cáo sự cố an ninh theo thời gian thực.",
    "url": SITE_URL,
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "499000",
      "highPrice": "999000",
      "priceCurrency": "VND",
      "offerCount": 3
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": 50,
      "bestRating": "5"
    }
  };

  return <JsonLd data={schema} />;
}

// ============================================================
// LocalBusiness Schema
// ============================================================
export function LocalBusinessSchema() {
  const schema: WithContext<LocalBusiness> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "AEGISM - Công ty Công nghệ An ninh",
    "image": `${SITE_URL}/img/logo_header.png`,
    "url": SITE_URL,
    "telephone": "+84-905-441-263",
    "email": "support@aegism.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "36 Cẩm Bắc 11",
      "addressLocality": "Cẩm Lệ",
      "addressRegion": "Đà Nẵng",
      "postalCode": "550000",
      "addressCountry": "VN"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "17:30"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "08:00",
        "closes": "12:00"
      }
    ],
    "priceRange": "₫₫"
  };

  return <JsonLd data={schema} />;
}

// ============================================================
// FAQ Schema
// ============================================================
interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSchema({ items }: { items: FAQItem[] }) {
  const schema: WithContext<FAQPage> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question" as const,
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer" as const,
        "text": item.answer
      }
    }))
  };

  return <JsonLd data={schema} />;
}

// ============================================================
// BreadcrumbList Schema
// ============================================================
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema: WithContext<BreadcrumbList> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem" as const,
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`
    }))
  };

  return <JsonLd data={schema} />;
}

// ============================================================
// WebSite Schema (for sitelinks search box)
// ============================================================
export function WebSiteSchema() {
  const schema: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": SITE_URL,
    "description": "Nền tảng quản lý vận hành và giám sát an ninh toàn diện.",
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/img/logo_header.png`
      }
    }
  };

  return <JsonLd data={schema} />;
}

// ============================================================
// WebPage Schema (per-page SEO context)
// ============================================================
interface WebPageSchemaProps {
  name: string;
  description: string;
  url: string;
}

export function WebPageSchema({ name, description, url }: WebPageSchemaProps) {
  const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;
  const schema: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": name,
    "description": description,
    "url": fullUrl,
    "isPartOf": {
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": SITE_URL
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/img/logo_header.png`
      }
    }
  };

  return <JsonLd data={schema} />;
}
