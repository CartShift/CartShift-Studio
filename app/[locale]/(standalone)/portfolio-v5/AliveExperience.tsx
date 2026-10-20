'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, AudioLines, Check,
  LoaderCircle, Mic2,
  Sparkles, Volume2, VolumeX, X,
} from 'lucide-react';
import type { PortfolioShowcaseProject } from '@/lib/portfolio-showcase';
import type { AliveView } from '@/lib/yotam-alive';

type Locale = 'en' | 'he';
type Capability = { ai: boolean; voice: boolean };
type Reply = {
  answer: string;
  project: string;
  view: AliveView;
  mode: 'ai' | 'guided';
  voiceToken: string | null;
};
type Message = { id: number; role: 'user' | 'assistant'; content: string; mode?: 'ai' | 'guided' };
type SpeechRecognizer = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechBrowser = Window & {
  SpeechRecognition?: new () => SpeechRecognizer;
  webkitSpeechRecognition?: new () => SpeechRecognizer;
};
type Props = { locale: Locale; projects: PortfolioShowcaseProject[] };

const prompts = {
  en: [
    { label: 'Show me your AI work', question: 'What have you built with AI?' },
    { label: 'How do you make engineering decisions?', question: 'Tell me about documented architecture decisions in your products.' },
    { label: 'What would you bring to our team?', question: 'What sort of projects and responsibilities does Yotam have experience with?' },
  ],
  he: [
    { label: 'תראה לי את עבודות ה-AI', question: 'איזה מוצרים בנית שמשתמשים ב-AI?' },
    { label: 'איך אתה מקבל החלטות הנדסיות?', question: 'ספר על החלטות ארכיטקטורה מתועדות במוצרים שלך.' },
    { label: 'מה אתה יכול להביא לצוות שלנו?', question: 'באילו סוגי פרויקטים ואחריות יש ליותם ניסיון?' },
  ],
};

const labels = {
  en: {
    eyebrow: 'AN INTERACTIVE INTRODUCTION',
    entryTitle: 'Don\'t just read about me.',
    entryAccent: 'Ask my work.',
    entryDescription: 'A living guide to the products, decisions and engineering behind this portfolio.',
    entryAction: 'Enter the experience',
    entryAside: 'TYPE · EXPLORE · SPEAK',
    close: 'Close experience',
    subtitle: 'Talk to the portfolio',
    identity: 'AI guide · not Yotam himself',
    guided: 'Guided tour',
    ai: 'Live AI',
    ready: 'Start with a question, or follow a thread.',
    placeholder: 'Ask about a project, a technical decision, or how I work…',
    send: 'Send message',
    listening: 'Listening…',
    microphone: 'Dictate with microphone',
    noMic: 'Speech recognition is not supported in this browser. You can still type.',
    enableVoice: 'Enable AI voice',
    disableVoice: 'Mute AI voice',
    voiceNote: 'Voice playback requires a configured, authorized custom voice. Microphone dictation depends on your browser.',
    needVoice: 'Custom voice is not configured yet. Text exploration is available.',
    project: 'The work',
    evidence: 'Documented engineering highlights',
    technologies: 'Built with',
    experience: 'Experience',
    underHood: 'Under the hood',
    caseStudy: 'Read the full case study',
    selectProject: 'Explore another project',
    intro: 'Five products. One curiosity: making difficult things feel intuitive.',
    powered: 'Answers grounded in public project descriptions. No private systems or client data are exposed.',
    offline: 'Live AI is not enabled yet. You are exploring a transparent guided tour.',
    error: 'The live guide is unavailable right now. Explore a project on the right or try again.',
  },
  he: {
    eyebrow: 'היכרות אינטראקטיבית',
    entryTitle: 'אל תקראו רק עליי.',
    entryAccent: 'תשאלו את העבודות שלי.',
    entryDescription: 'מדריך חי למוצרים, להחלטות ולחשיבה ההנדסית מאחורי הפורטפוליו.',
    entryAction: 'להיכנס לחוויה',
    entryAside: 'לכתוב · לגלות · לדבר',
    close: 'סגירת החוויה',
    subtitle: 'לדבר עם הפורטפוליו',
    identity: 'מדריך AI · לא יותם עצמו',
    guided: 'סיור מודרך',
    ai: 'AI חי',
    ready: 'אפשר להתחיל בשאלה או לבחור נושא.',
    placeholder: 'שאלו על פרויקט, החלטה הנדסית או על דרך העבודה שלי…',
    send: 'שליחת הודעה',
    listening: 'מקשיב…',
    microphone: 'הכתבה קולית',
    noMic: 'הכתבה קולית אינה נתמכת בדפדפן הזה. אפשר לכתוב.',
    enableVoice: 'הפעלת קול AI',
    disableVoice: 'השתקת קול AI',
    voiceNote: 'הקראה דורשת קול אישי מורשה ומוגדר. הכתבה קולית תלויה בתמיכת הדפדפן.',
    needVoice: 'הקול המותאם עדיין לא הוגדר. אפשר להשתמש בחוויית הטקסט.',
    project: 'העבודה',
    evidence: 'נקודות הנדסיות מתועדות',
    technologies: 'טכנולוגיות',
    experience: 'החוויה',
    underHood: 'מאחורי הקלעים',
    caseStudy: 'לסיפור הפרויקט המלא',
    selectProject: 'פרויקטים נוספים',
    intro: 'חמישה מוצרים. סקרנות אחת: להפוך מערכות מורכבות לחוויות אינטואיטיביות.',
    powered: 'התשובות מבוססות על תיאורי פרויקטים פומביים בלבד. אין גישה למערכות פרטיות או למידע לקוחות.',
    offline: 'ה-AI החי עדיין לא הופעל. זהו סיור מודרך ושקוף.',
    error: 'מדריך ה-AI אינו זמין כרגע. אפשר לחקור פרויקטים או לנסות שוב.',
  },
};

export default function AliveExperience({ locale, projects }: Props) {
  const t = labels[locale];
  const he = locale === 'he';
  const dialogRef = useRef<HTMLDialogElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognizer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const voiceRef = useRef(false);
  const serial = useRef(0);
  const [open, setOpen] = useState(false);
  const [capability, setCapability] = useState<Capability>({ ai: false, voice: false });
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [notice, setNotice] = useState('');
  const [activeSlug, setActiveSlug] = useState(projects[0]?.slug ?? 'starlinker');
  const [view, setView] = useState<'project' | 'architecture'>('project');
  const [mode, setMode] = useState<'guided' | 'ai'>('guided');
  const [tab, setTab] = useState<'experience' | 'engineering'>('experience');

  const active = projects.find(project => project.slug === activeSlug) ?? projects[0];

  function stopAudio() {
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
  }

  function stopSession() {
    requestRef.current?.abort();
    requestRef.current = null;
    busyRef.current = false;
    setBusy(false);
    try { recognitionRef.current?.stop(); } catch { /* Already stopped */ }
    recognitionRef.current = null;
    setListening(false);
    stopAudio();
  }

  useEffect(() => () => {
    requestRef.current?.abort();
    try { recognitionRef.current?.stop(); } catch { /* Closed */ }
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, open]);

  function openExperience() {
    dialogRef.current?.showModal();
    setOpen(true);
    setNotice('');
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 60);
    fetch('/api/yotam/alive', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then((info: Capability | null) => {
        if (!info) return;
        setCapability({ ai: Boolean(info.ai), voice: Boolean(info.voice) });
        setMode(info.ai ? 'ai' : 'guided');
      })
      .catch(() => setCapability({ ai: false, voice: false }));
  }

  function closeExperience() {
    dialogRef.current?.close();
    setOpen(false);
    stopSession();
    launcherRef.current?.focus({ preventScroll: true });
  }

  function navigateProject(slug: string) {
    setActiveSlug(slug);
    setView('project');
    setTab('experience');
  }

  async function speak(reply: Reply) {
    if (!voiceRef.current || !reply.voiceToken || !capability.voice) return;
    stopAudio();
    try {
      const response = await fetch('/api/yotam/alive/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply.answer, locale, token: reply.voiceToken }),
        cache: 'no-store',
      });
      if (!response.ok || !dialogRef.current?.open || !voiceRef.current) return;
      const url = URL.createObjectURL(await response.blob());
      if (!dialogRef.current?.open || !voiceRef.current) { URL.revokeObjectURL(url); return; }
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => stopAudio();
      await audio.play();
    } catch {
      setNotice(t.needVoice);
    }
  }

  async function send(text: string) {
    const value = text.trim();
    if (!value || busyRef.current || !dialogRef.current?.open) return;
    busyRef.current = true;
    setBusy(true);
    setNotice('');
    setQuestion('');
    const history = messages.slice(-6).map(message => ({
      role: message.role,
      content: message.content.slice(0, 800),
    }));
    setMessages(previous => [...previous, { id: ++serial.current, role: 'user', content: value }]);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch('/api/yotam/alive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, question: value, history }),
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Guide unavailable');
      const answer = await response.json() as Reply;
      if (controller.signal.aborted || !dialogRef.current?.open) return;
      if (typeof answer.answer !== 'string' || answer.answer.length > 1600) throw new Error('Invalid guide answer');
      setMode(answer.mode);
      setMessages(previous => [...previous, {
        id: ++serial.current, role: 'assistant', content: answer.answer, mode: answer.mode,
      }]);
      if (answer.project !== 'none' && projects.some(project => project.slug === answer.project)) {
        setActiveSlug(answer.project);
        setTab(answer.view === 'architecture' ? 'engineering' : 'experience');
        setView(answer.view === 'architecture' ? 'architecture' : 'project');
      } else if (answer.view === 'work') {
        setTab('experience');
      }
      if (answer.mode === 'guided') setNotice(t.offline);
      if (voiceRef.current && answer.mode === 'ai') void speak(answer);
    } catch {
      if (!controller.signal.aborted) setNotice(t.error);
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      busyRef.current = false;
      setBusy(false);
    }
  }

  function startDictation() {
    if (busyRef.current) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const browser = window as SpeechBrowser;
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) { setNotice(t.noMic); return; }
    try {
      const recognition = new Constructor();
      recognition.lang = he ? 'he-IL' : 'en-US';
      recognition.interimResults = false;
      recognition.onresult = event => {
        const transcript = event.results[0]?.[0]?.transcript?.trim();
        if (transcript) void send(transcript);
      };
      recognition.onerror = () => { setListening(false); setNotice(t.noMic); };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      setNotice('');
    } catch { setNotice(t.noMic); setListening(false); }
  }

  function toggleVoice() {
    if (!capability.voice || !capability.ai) { setNotice(t.needVoice); return; }
    const enabled = !voiceEnabled;
    voiceRef.current = enabled;
    setVoiceEnabled(enabled);
    if (!enabled) stopAudio();
  }

  return (
    <>
      <div className="alive-entry" aria-label={t.eyebrow}>
        <div className="alive-entry-copy">
          <span className="alive-eyebrow"><span className="alive-live-dot" /> {t.eyebrow}</span>
          <h2>{t.entryTitle} <em>{t.entryAccent}</em></h2>
          <p>{t.entryDescription}</p>
        </div>
        <button ref={launcherRef} className="alive-launch" type="button" onClick={openExperience}>
          <span className="alive-launch-rings" aria-hidden="true"><AudioLines size={24} /></span>
          <span>{t.entryAction}</span>
          <ArrowUpRight size={20} aria-hidden="true" />
        </button>
        <span className="alive-entry-aside">{t.entryAside}</span>
      </div>

      <dialog ref={dialogRef} className="alive-dialog" dir={he ? 'rtl' : 'ltr'}
        aria-labelledby="alive-dialog-title"
        onClose={() => { setOpen(false); stopSession(); }}>
        <div className="alive-shell">
          <header className="alive-header">
            <div className="alive-wordmark"><span className="alive-symbol">Y<span aria-hidden="true">✳</span></span>
              <div><strong>YOTAM / ALIVE</strong><small>{t.identity}</small></div>
            </div>
            <div className="alive-header-end">
              <span className="alive-mode"><span className="alive-live-dot" />{mode === 'ai' ? t.ai : t.guided}</span>
              <button type="button" className="alive-icon-button alive-close" onClick={closeExperience} aria-label={t.close}>
                <X size={21} />
              </button>
            </div>
          </header>
          <div className="alive-main">
            <section className="alive-conversation" aria-labelledby="alive-dialog-title">
              <div className="alive-chat-heading">
                <span className="alive-index">01 / THE CONVERSATION</span>
                <h2 id="alive-dialog-title">{t.subtitle}<span>.</span></h2>
                <p>{t.ready}</p>
              </div>
              <div className="alive-transcript" ref={transcriptRef} role="log" aria-live="polite" aria-relevant="additions text">
                {messages.length === 0 ? (
                  <div className="alive-onboarding">
                    <div className="alive-onboarding-art" aria-hidden="true">
                      <div className="alive-orbit alive-orbit-one" />
                      <div className="alive-orbit alive-orbit-two" />
                      <div className="alive-orbit-center"><AudioLines size={32} strokeWidth={1.3}/></div>
                    </div>
                    <p>{t.intro}</p>
                    <div className="alive-prompts">
                      {prompts[locale].map(prompt => (
                        <button type="button" key={prompt.label} onClick={() => void send(prompt.question)}>
                          <span>{prompt.label}</span><ArrowUpRight size={17}/>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : messages.map(message => (
                  <div className={'alive-message alive-message--' + message.role} key={message.id}>
                    <span className="alive-message-role">
                      {message.role === 'user' ? (he ? 'אתם' : 'YOU') : 'YOTAM / AI'}
                    </span>
                    <p>{message.content}</p>
                  </div>
                ))}
                {busy && <p className="alive-typing" role="status"><LoaderCircle size={17} className="alive-spin" />{he ? 'בוחן את העבודות…' : 'Exploring the work…'}</p>}
              </div>
              <div className="alive-composer">
                {notice && <p className="alive-notice" role="status">{notice}</p>}
                <form onSubmit={event => { event.preventDefault(); void send(question); }}>
                  <label htmlFor="alive-question" className="sr-only">{t.placeholder}</label>
                  <input ref={inputRef} id="alive-question" value={question}
                    onChange={event => setQuestion(event.target.value)}
                    maxLength={500} autoComplete="off" placeholder={listening ? t.listening : t.placeholder}
                    disabled={busy} />
                  <button type="button" className={'alive-control' + (listening ? ' alive-control--active' : '')}
                    onClick={startDictation} aria-label={t.microphone} aria-pressed={listening}>
                    <Mic2 size={18} />
                  </button>
                  <button type="button" className={'alive-control' + (voiceEnabled ? ' alive-control--active' : '')}
                    onClick={toggleVoice} aria-label={voiceEnabled ? t.disableVoice : t.enableVoice}
                    aria-pressed={voiceEnabled} title={t.voiceNote}>
                    {voiceEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>}
                  </button>
                  <button type="submit" className="alive-send" aria-label={t.send} disabled={busy || !question.trim()}>
                    {busy ? <LoaderCircle className="alive-spin" size={19} /> : <ArrowRight size={20}/>}
                  </button>
                </form>
                <p className="alive-fineprint"><Sparkles size={12}/>{t.powered}</p>
              </div>
            </section>

            <aside className="alive-workbench" aria-label={t.project}>
              <div className="alive-workbench-top">
                <span className="alive-index">02 / THE WORKBENCH</span>
                <span className="alive-workbench-counter">{String(projects.findIndex(p => p.slug === activeSlug) + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>
              </div>
              <div className="alive-workbench-heading">
                <div>
                  <span className="alive-workbench-type">{active?.descriptor}</span>
                  <h3>{active?.title}<span>.</span></h3>
                </div>
                <span className="alive-workbench-year">{active?.year}</span>
              </div>
              <div className="alive-switch" role="group" aria-label={he ? 'תצוגת פרויקט' : 'Project view'}>
                <button type="button" className={tab === 'experience' ? 'is-active' : ''} aria-pressed={tab === 'experience'}
                  onClick={() => { setTab('experience'); setView('project'); }}>{t.experience}</button>
                <button type="button" className={tab === 'engineering' ? 'is-active' : ''} aria-pressed={tab === 'engineering'}
                  onClick={() => { setTab('engineering'); setView('architecture'); }}>{t.underHood}</button>
              </div>
              <div className="alive-stage" key={active?.slug + view}>
                {tab === 'experience' ? (
                  <>
                    <div className="alive-stage-image">
                      {active?.hero ? (
                        <Image src={active.hero.src} alt={active.hero.alt} fill
                          sizes="(max-width: 900px) 90vw, 42vw"
                          unoptimized={/^https?:\/\//.test(active.hero.src)}
                          className="alive-product-image" />
                      ) : <span>{active?.title}</span>}
                    </div>
                    <span className="alive-stage-meta">{active?.hero?.label ?? active?.descriptor}</span>
                  </>
                ) : (
                  <div className="alive-architecture">
                    <div className="alive-architecture-center">
                      <span>ENGINEERING LENS</span>
                      <strong>{active?.title}</strong>
                      <small>{active?.role}</small>
                    </div>
                    <div className="alive-architecture-trails">
                      {active?.highlights.slice(0, 3).map((item, i) =>
                        <div key={item} className="alive-architecture-point">
                          <span>{String(i + 1).padStart(2, '0')}</span>{item}
                        </div>)}
                    </div>
                    <p>{t.evidence} · {he ? 'לא דיאגרמת מערכת מלאה' : 'Not a full system diagram'}</p>
                  </div>
                )}
              </div>
              <p className="alive-project-summary">{active?.summary}</p>
              {tab === 'engineering' && (
                <div className="alive-tech">
                  <span>{t.technologies}</span>
                  <div>{active?.technologies.slice(0, 7).map(tech => <span key={tech}>{tech}</span>)}</div>
                </div>
              )}
              <Link className="alive-case-link" href={`/${locale}/yotam/work/${active?.slug}`}>
                {t.caseStudy}<ArrowUpRight size={18}/>
              </Link>
              <div className="alive-project-rail">
                <span>{t.selectProject}</span>
                <div>
                  {projects.map((project, index) =>
                    <button type="button" key={project.slug} aria-pressed={project.slug === activeSlug}
                      onClick={() => navigateProject(project.slug)}
                      title={project.title}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <span>{project.title}</span>
                      {activeSlug === project.slug && <Check size={14}/>}
                    </button>)}
                </div>
              </div>
            </aside>
          </div>
          <footer className="alive-footer">
            <span>© YOTAM FARAGGI / 2026</span>
            <span>{he ? 'אפשר לסגור בכל רגע באמצעות Esc' : 'PRESS ESC TO EXIT'}</span>
          </footer>
        </div>
      </dialog>
    </>
  );
}
