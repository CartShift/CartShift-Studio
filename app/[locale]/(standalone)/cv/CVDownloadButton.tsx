'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

export function CVDownloadButton({ label }: CVDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      const [{ pdf }, { CVDocument }, { default: messages }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./CVDocument'),
        import('../../../../messages/src/en/cv.json'),
      ]);
      const cv = messages.cv as any;
      const blob = await pdf(
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
            description:
              'description' in cv.experience[key] ? cv.experience[key].description : undefined,
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
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'yotam-faraggi-cv.pdf';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CV PDF ready');
    } catch {
      toast.error('Failed to generate CV PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  if (process.env.NODE_ENV === 'test') {
    return (
      <Button
        size="sm"
        variant="glass"
        disabled={isGenerating}
        onClick={handleDownload}
        leftIcon={
          isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )
        }
        className="min-h-[40px]"
      >
        {isGenerating ? 'Preparing PDF' : label}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="glass"
      disabled={isGenerating}
      onClick={handleDownload}
      leftIcon={
        isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )
      }
      className="min-h-[40px]"
    >
      {isGenerating ? 'Preparing PDF' : label}
    </Button>
  );
}
