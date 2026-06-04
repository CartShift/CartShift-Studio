'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Eye,
  FileText,
  Languages,
  Mail,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { EmailPreview, EmailPreviewLocale } from '@/lib/email-preview/render-email-previews';

type PreviewMode = 'preview' | 'text' | 'html';
type ViewportMode = 'desktop' | 'mobile';

interface EmailPreviewClientProps {
  locale: EmailPreviewLocale;
  previewsByLocale: Record<EmailPreviewLocale, EmailPreview[]>;
}

const modeIcons = {
  preview: Eye,
  text: FileText,
  html: Code2,
} as const;

export function EmailPreviewClient({ locale, previewsByLocale }: EmailPreviewClientProps) {
  const [activeLocale, setActiveLocale] = useState<EmailPreviewLocale>(locale);
  const [selectedId, setSelectedId] = useState(previewsByLocale[locale][0]?.id);
  const [mode, setMode] = useState<PreviewMode>('preview');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');

  const previews = previewsByLocale[activeLocale];
  const selected = useMemo(
    () => previews.find(preview => preview.id === selectedId) ?? previews[0],
    [previews, selectedId]
  );

  const copyValue = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-500/20">
              <Mail className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
                Email previews
              </h1>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Source-rendered React Email templates for QA before deploy.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['en', 'he'] as EmailPreviewLocale[]).map(value => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={activeLocale === value ? 'primary' : 'outline'}
              onClick={() => setActiveLocale(value)}
              aria-pressed={activeLocale === value}
            >
              <Languages className="h-4 w-4" />
              {value.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-3">
          {previews.map(preview => (
            <button
              key={preview.id}
              type="button"
              onClick={() => setSelectedId(preview.id)}
              className={cn(
                'portal-focus-ring w-full rounded-xl border p-4 text-start transition-colors',
                selected.id === preview.id
                  ? 'border-primary-400 bg-primary-50 text-primary-950 dark:border-primary-500/60 dark:bg-primary-500/15 dark:text-white'
                  : 'border-surface-200 bg-white text-surface-700 hover:border-surface-300 hover:bg-surface-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-surface-200 dark:hover:bg-white/[0.06]'
              )}
              aria-pressed={selected.id === preview.id}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-bold">{preview.name}</span>
                {selected.id === preview.id ? <Check className="h-4 w-4" /> : null}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-surface-500 dark:text-surface-400">
                {preview.description}
              </span>
            </button>
          ))}
        </aside>

        <section className="min-w-0 space-y-4">
          <Card padding="lg" variant="glass">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                    {selected.name}
                  </h2>
                  <Badge variant="blue">{activeLocale.toUpperCase()}</Badge>
                  <Badge variant="gray">{selected.id}</Badge>
                </div>
                <div className="grid gap-2 text-sm text-surface-600 dark:text-surface-300 md:grid-cols-2">
                  <p className="min-w-0 truncate">
                    <span className="font-bold text-surface-900 dark:text-white">Subject:</span>{' '}
                    {selected.subject}
                  </p>
                  <p className="min-w-0 truncate">
                    <span className="font-bold text-surface-900 dark:text-white">To:</span>{' '}
                    {selected.recipient}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(['preview', 'text', 'html'] as PreviewMode[]).map(value => {
                  const Icon = modeIcons[value];
                  return (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={mode === value ? 'primary' : 'outline'}
                      onClick={() => setMode(value)}
                      aria-pressed={mode === value}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="capitalize">{value}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(['desktop', 'mobile'] as ViewportMode[]).map(value => {
                const Icon = value === 'desktop' ? Monitor : Smartphone;
                return (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={viewport === value ? 'secondary' : 'outline'}
                    disabled={mode !== 'preview'}
                    onClick={() => setViewport(value)}
                    aria-pressed={viewport === value}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="capitalize">{value}</span>
                  </Button>
                );
              })}
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                copyValue(
                  mode === 'text' ? selected.text : selected.html,
                  mode === 'text' ? 'Text' : 'HTML'
                )
              }
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>

          {mode === 'preview' ? (
            <div className="overflow-x-auto rounded-xl border border-surface-200 bg-surface-100 p-4 dark:border-white/10 dark:bg-surface-950">
              <iframe
                title={`${selected.name} ${activeLocale} email preview`}
                srcDoc={selected.html}
                sandbox=""
                className={cn(
                  'mx-auto h-[760px] rounded-lg border border-surface-200 bg-white shadow-sm transition-[width] dark:border-white/10',
                  viewport === 'mobile' ? 'w-[390px]' : 'w-full max-w-[760px]'
                )}
              />
            </div>
          ) : (
            <pre
              dir={mode === 'text' && activeLocale === 'he' ? 'rtl' : 'ltr'}
              className="max-h-[760px] overflow-auto rounded-xl border border-surface-200 bg-surface-950 p-4 text-start text-xs leading-relaxed text-surface-100 dark:border-white/10"
            >
              {mode === 'text' ? selected.text : selected.html}
            </pre>
          )}
        </section>
      </div>
    </div>
  );
}
