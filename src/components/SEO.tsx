import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title = "Vouch | Verified Tradespeople Marketplace in Liberia", 
  description = "The most trusted platform to find, hire, and pay verified professionals in Liberia. Background checks, trust scores, and community ratings.",
  canonical,
  ogImage = "https://vouch.lr/og-image.jpg",
  ogType = "website"
}) => {
  const fullTitle = title.includes("Vouch") ? title : `${title} | Vouch Liberia`;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Vouch Liberia" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Accessibility / Direction */}
      <html lang="en" dir="ltr" />
    </Helmet>
  );
};
