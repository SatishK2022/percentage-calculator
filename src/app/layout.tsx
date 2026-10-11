import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://ignoupercentagecalculator.com'),
  title: {
    default: 'IGNOU Percentage Calculator | Accurate Grade Card Marks & Division Evaluator',
    template: '%s | IGNOU Percentage Calculator',
  },
  description:
    'Calculate your IGNOU percentage accurately using official evaluation rules for BCA, MCA, BAG, BCOMG, BSCG, and Master degrees. Verified 30:70 assignment and term-end exam calculation.',
  keywords: [
    'IGNOU percentage calculator',
    'how to calculate IGNOU percentage',
    'IGNOU grade card percentage',
    'IGNOU BCA percentage calculator',
    'IGNOU MCA percentage calculator',
    'IGNOU CBCS grade calculator',
    'IGNOU marks to percentage',
    'IGNOU 30 70 formula',
    'IGNOU division calculator',
    'IGNOU credit system percentage',
    'official IGNOU grade card status',
  ],
  authors: [{ name: 'IGNOU Academic Tool' }],
  creator: 'IGNOU Student Utility',
  publisher: 'IGNOU Calculator',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'IGNOU Percentage Calculator | Accurate Grade Card Marks & CGPA Evaluator',
    description:
      'Official IGNOU Percentage Calculator for BCA, MCA, BAG, BCOMG, BSCG, and Master degrees. Accurate continuous assessment (30%) and term-end exam (70%) credit-weighted calculation.',
    url: 'https://ignoupercentagecalculator.com',
    siteName: 'IGNOU Percentage Calculator',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IGNOU Percentage Calculator',
    description:
      'Calculate your IGNOU percentage accurately using official programme evaluation rules for BCA, MCA, and CBCS.',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#140e0a',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://ignoupercentagecalculator.com/#webapp',
      name: 'IGNOU Percentage Calculator',
      url: 'https://ignoupercentagecalculator.com',
      description:
        'Free online tool to calculate official IGNOU percentage and divisions using verified 30:70 assignment/TEE weightage and credit rules.',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://ignoupercentagecalculator.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How is IGNOU percentage calculated?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'IGNOU calculates percentage by awarding 30% weightage to continuous assessment assignments and 70% weightage to term-end examinations (TEE). For programmes following the Choice Based Credit System (CBCS), courses are aggregated using credit-weighting.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the passing criteria for IGNOU courses?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Students must pass Assignments and Term-End Examinations separately. The minimum passing mark is 35% for undergraduate programmes (BA, BCOM, BSC) and 40% for BCA, MCA, and Master degree programmes.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does credit-weighting work in IGNOU percentage calculation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'In credit-weighted programmes such as CBCS (BAG, BCOMG, BSCG) and MCA_NEW, each completed course score is multiplied by its course credits. The total sum is then divided by the total completed credits.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are incomplete or pending IGNOU courses counted as zero in the percentage?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Courses that are awaiting term-end examination marks or assignment marks are not treated as zero. The percentage is calculated based on completed course credits.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-amber-500/20 selection:text-amber-300">
        {children}
      </body>
    </html>
  );
}
