import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const appName = 'Floently Finnish';
const description =
  'Floently Finnish helps adults learn practical Finnish for YKI, workplace communication, grammar, vocabulary, roleplay and everyday life in Finland.';
const canonicalUrl = 'https://learn.floently.com/';
const imageUrl = 'https://learn.floently.com/floently-finnish-icon.png';

export default function Html({ children }: PropsWithChildren) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Floently',
    url: 'https://learn.floently.com/',
    logo: imageUrl,
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: appName,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'iOS, Android, Web',
    description,
    url: canonicalUrl,
    image: imageUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>{appName} | Learn Finnish for YKI, Work and Daily Life</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Floently" />
        <meta property="og:title" content={`${appName} | Learn Finnish for YKI, Work and Daily Life`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={imageUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${appName} | Learn Finnish for YKI, Work and Daily Life`} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
