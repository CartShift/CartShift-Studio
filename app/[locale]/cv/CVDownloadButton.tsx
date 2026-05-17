'use client';

import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import { Download, Loader2 } from 'lucide-react';
import { CVDocument } from './CVDocument';
import enMessages from '../../../messages/en.json';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <Button
        size="sm"
        variant="glass"
        disabled
        leftIcon={<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        className="min-h-[40px]"
      >
        Preparing PDF
      </Button>
    ),
  }
);

interface CVDownloadButtonProps {
  label: string;
}

const experienceKeys = [
  'cartshift',
  'curalife',
  'paragonex',
  'ecommerce_venture',
  'hot',
  'leumi',
  'entrepreneurship',
  'elbit',
  'airforce',
] as const;

const skillKeys = ['primary', 'ecommerce', 'ai', 'cloud', 'legacy'] as const;
const languageKeys = ['hebrew', 'english', 'german'] as const;

const cv = enMessages.cv as any;

const cvDocument = (
  <CVDocument
    name={cv.name}
    subtitle={cv.subtitle}
    location={cv.location}
    email={cv.email}
    github="https://github.com/yotamon"
    linkedin="https://linkedin.com/in/yotam-faraggi"
    summary={cv.summary.text}
    experiences={experienceKeys.map(key => ({
      company: cv.experience[key].company,
      title: cv.experience[key].title,
      duration: cv.experience[key].duration,
      durationYears: cv.experience[key].durationYears,
      location: 'location' in cv.experience[key] ? cv.experience[key].location : undefined,
      description: 'description' in cv.experience[key] ? cv.experience[key].description : undefined,
      highlights: cv.experience[key].highlights,
    }))}
    skills={skillKeys.map(key => ({
      category: cv.skills[key].category,
      items: cv.skills[key].items,
    }))}
    education={cv.education}
    languages={languageKeys.map(key => ({
      name: cv.languageSkills[key].name,
      level: cv.languageSkills[key].level,
    }))}
  />
);

export function CVDownloadButton({ label }: CVDownloadButtonProps) {
  if (process.env.NODE_ENV === 'test') {
    return (
      <Button
        size="sm"
        variant="glass"
        leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
        className="min-h-[40px]"
      >
        {label}
      </Button>
    );
  }

  return (
    <PDFDownloadLink document={cvDocument} fileName="yotam-faraggi-cv.pdf">
      {({ loading }) => (
        <Button
          size="sm"
          variant="glass"
          disabled={loading}
          leftIcon={
            loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )
          }
          className="min-h-[40px]"
        >
          {loading ? 'Preparing PDF' : label}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
