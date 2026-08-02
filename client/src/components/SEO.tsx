import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://aegism.online';
const SITE_NAME = 'AEGISM';
const DEFAULT_OG_IMAGE = `${SITE_URL}/img/logo_header.png`;

interface SEOProps {
  title?: string;
  description?: string;
  name?: string;
  type?: string;
  url?: string;
  image?: string;
  canonical?: string;
  noindex?: boolean;
  keywords?: string;
  children?: React.ReactNode;
}

export default function SEO({
  title = "AEGISM - Phần mềm quản lý an ninh & vận hành #1 Việt Nam",
  description = "Nền tảng AEGISM giúp số hóa tuần tra QR Code, giám sát GPS thời gian thực & báo cáo sự cố tức thì cho lực lượng bảo vệ và quản lý tòa nhà.",
  name = SITE_NAME,
  type = "website",
  url,
  image = DEFAULT_OG_IMAGE,
  canonical,
  noindex = false,
  keywords,
  children,
}: SEOProps) {
  const fullUrl = url ? (url.startsWith('http') ? url : `${SITE_URL}${url}`) : SITE_URL;
  const canonicalUrl = canonical ? (canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`) : fullUrl;
  const fullImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title}</title>
      <meta name='description' content={description} />
      {keywords && <meta name='keywords' content={keywords} />}
      <meta name='robots' content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel='canonical' href={canonicalUrl} />
      <link rel='alternate' hrefLang='vi' href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={name} />
      <meta property="og:locale" content="vi_VN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content={`@${name}`} />

      {children}
    </Helmet>
  );
}

export { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE };
