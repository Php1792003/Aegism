import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://aegism.online';
const SITE_NAME = 'AEGISM';
const DEFAULT_OG_IMAGE = `${SITE_URL}/img/logo_header.png`;
const DEFAULT_TITLE = 'Phần mềm quản lý an ninh & vận hành #1 Việt Nam';
const DEFAULT_DESCRIPTION =
  'Nền tảng AEGISM giúp số hóa tuần tra QR Code, giám sát GPS thời gian thực & báo cáo sự cố tức thì cho lực lượng bảo vệ và quản lý tòa nhà.';

interface OGImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  type?: string;
}

interface SEOProps {
  /** Page-specific title. Automatically formatted as "title | AEGISM". */
  title?: string;
  /** Meta description — truncated to 160 chars. */
  description?: string;
  /** Site name shown in OG. */
  name?: string;
  /** OG type — 'website', 'article', 'product', etc. */
  type?: string;
  /** Page URL path or full URL. */
  url?: string;
  /** OG image — string URL or full OGImage object with dimensions. */
  image?: string | OGImage;
  /** Canonical URL path or full URL. */
  canonical?: string;
  /** Set true to add noindex,nofollow. */
  noindex?: boolean;
  /** Meta keywords. */
  keywords?: string;
  /** Additional Helmet children. */
  children?: React.ReactNode;
}

/**
 * Truncate a string to maxLen, breaking at the last space before the limit.
 */
function truncateDescription(text: string, maxLen = 160): string {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

/**
 * Format title as "Page Title | AEGISM".
 * If the title already contains the site name, use it as-is.
 */
function formatTitle(title: string): string {
  if (title.includes(SITE_NAME)) return title;
  return `${title} | ${SITE_NAME}`;
}

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  name = SITE_NAME,
  type = 'website',
  url,
  image = DEFAULT_OG_IMAGE,
  canonical,
  noindex = false,
  keywords,
  children,
}: SEOProps) {
  const formattedTitle = formatTitle(title);
  const safeDescription = truncateDescription(description);
  const fullUrl = url
    ? url.startsWith('http') ? url : `${SITE_URL}${url}`
    : SITE_URL;
  const canonicalUrl = canonical
    ? canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`
    : fullUrl;

  // Normalize image to OGImage object
  const ogImage: OGImage = typeof image === 'string'
    ? {
        url: image.startsWith('http') ? image : `${SITE_URL}${image}`,
        width: 1200,
        height: 630,
        alt: formattedTitle,
        type: 'image/png',
      }
    : {
        url: image.url.startsWith('http') ? image.url : `${SITE_URL}${image.url}`,
        width: image.width ?? 1200,
        height: image.height ?? 630,
        alt: image.alt ?? formattedTitle,
        type: image.type ?? 'image/png',
      };

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{formattedTitle}</title>
      <meta name='description' content={safeDescription} />
      {keywords && <meta name='keywords' content={keywords} />}
      <meta name='robots' content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel='canonical' href={canonicalUrl} />
      <link rel='alternate' hrefLang='vi' href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:image" content={ogImage.url} />
      <meta property="og:image:width" content={String(ogImage.width)} />
      <meta property="og:image:height" content={String(ogImage.height)} />
      <meta property="og:image:alt" content={ogImage.alt!} />
      <meta property="og:image:type" content={ogImage.type!} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={name} />
      <meta property="og:locale" content="vi_VN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={ogImage.url} />
      <meta name="twitter:image:alt" content={ogImage.alt!} />
      <meta name="twitter:site" content={`@${name}`} />

      {children}
    </Helmet>
  );
}

export { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE };
