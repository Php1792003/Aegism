import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, SITE_NAME } from './SEO';

// ============================================================
// Organization Schema
// ============================================================
export function OrganizationSchema() {
  const schema = {
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

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// ============================================================
// SoftwareApplication Schema
// ============================================================
export function SoftwareApplicationSchema() {
  const schema = {
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
      "offerCount": "3"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "50",
      "bestRating": "5"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// ============================================================
// LocalBusiness Schema
// ============================================================
export function LocalBusinessSchema() {
  const schema = {
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

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// ============================================================
// FAQ Schema
// ============================================================
interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSchema({ items }: { items: FAQItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// ============================================================
// BreadcrumbList Schema
// ============================================================
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// ============================================================
// WebSite Schema (for sitelinks search box)
// ============================================================
export function WebSiteSchema() {
  const schema = {
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

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
