'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type Phase = 'idle' | 'cover' | 'reveal';

const REVEAL_TARGETS = [
  '.v5-inner-heading',
  '.v5-list-caption',
  '.v5-work-row',
  '.v5-about-copy > :is(.v5-section-kicker,h1,.v5-about-body,.v5-about-aside,.v5-about-extras)',
  '.v5-about-disc',
  '.v5-about-skills > div',
  '.v5-inner-contact > :is(.v5-section-kicker,h1,p,.v5-email-action,.v5-contact-links)',
  '.v5-exp-section-head',
  '.v5-exp-job',
  '.v5-exp-early-item',
  '.v5-exp-skill',
  '.v5-exp-additional > div',
  '.v5-exp-outro .v5-shell > :is(.v5-exp-kicker,h2,p,.v5-exp-actions)',
].join(',');

function motionEnabled() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function belongsToPortfolio(path: string) {
  return /^\/(?:en|he)(?:\/(?:portfolio-v5(?:\/|$))|\/?$)/.test(path);
}

export default function PortfolioMotion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const pendingRef = useRef<string | null>(null);
  const timers = useRef<number[]>([]);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const isHomepage = /^\/(?:en|he)(?:\/portfolio-v5)?\/?$/.test(pathname);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }, []);

  useEffect(() => {
    if (!pendingRef.current || pathname !== pendingRef.current) return;
    const route = pathname.match(/^\/(?:en|he)\/portfolio-v5(?:\/([^/]+))?/)?.[1] || '';
    const selector = route === 'work' ? '.v5-subpage--work'
      : route === 'experience' ? '.v5-experience'
      : route === 'about' ? '.v5-subpage--about'
      : route === 'contact' ? '.v5-subpage--contact'
      : '.v5-immersive-home';
    const direction = pathname.startsWith('/he/') ? 'rtl' : 'ltr';
    let frame = 0;
    let settled = false;
    const revealWhenReady = () => {
      if (settled || pendingRef.current !== pathname) return;
      // usePathname can update before streamed RSC content mounts.
      // Only uncover once the matching page is in the DOM.
      if (!surfaceRef.current?.querySelector('main' + selector + '[dir="' + direction + '"]')) return;
      settled = true;
      clearTimers();
      observer.disconnect();
      frame = window.requestAnimationFrame(() => setPhase('reveal'));
      timers.current.push(window.setTimeout(() => {
        setPhase('idle');
        pendingRef.current = null;
      }, 730));
    };
    const observer = new MutationObserver(revealWhenReady);
    if (surfaceRef.current) observer.observe(surfaceRef.current, { childList: true, subtree: true });
    revealWhenReady();
    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname, clearTimers]);

  useEffect(() => {
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
          pendingRef.current || !motionEnabled()) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.hasAttribute('download') ||
          (link.target && link.target !== '_self')) return;

      const next = new URL(link.href, window.location.href);
      if (next.origin !== window.location.origin || !belongsToPortfolio(next.pathname) ||
          !belongsToPortfolio(window.location.pathname)) return;
      // Browser-native hash jumps, including the Experience timeline, must remain instant.
      if (next.pathname === window.location.pathname && next.search === window.location.search) return;

      event.preventDefault();
      const destination = next.pathname + next.search + next.hash;
      pendingRef.current = next.pathname;
      setPhase('cover');
      timers.current.push(window.setTimeout(() => router.push(destination), 480));
      // Never leave an overlay stuck if the destination fails to resolve.
      timers.current.push(window.setTimeout(() => {
        if (pendingRef.current) {
          pendingRef.current = null;
          setPhase('idle');
        }
      }, 6500));
    };
    document.addEventListener('click', navigate, true);
    return () => {
      document.removeEventListener('click', navigate, true);
      clearTimers();
    };
  }, [router, clearTimers]);

  // Reveal once, on intersection. Content remains fully visible without JS and
  // for users who request reduced motion. Does not allocate per-row listeners.
  useEffect(() => {
    const root = surfaceRef.current;
    if (!root) return;
    root.removeAttribute('data-v5-reveal-ready');
    if (!motionEnabled() || !('IntersectionObserver' in window)) return;

    let observer: IntersectionObserver | null = null;
    const frame = window.requestAnimationFrame(() => {
      const nodes = [...root.querySelectorAll<HTMLElement>(REVEAL_TARGETS)];
      observer = new IntersectionObserver((entries, activeObserver) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const node = entry.target as HTMLElement;
          node.setAttribute('data-v5-visible', 'true');
          activeObserver.unobserve(node);
        }
      }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

      nodes.forEach((node, index) => {
        node.setAttribute('data-v5-reveal', '');
        node.style.setProperty('--v5-reveal-delay', (index % 4) * 55 + 'ms');
        observer?.observe(node);
      });
      root.setAttribute('data-v5-reveal-ready', 'true');
    });
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      root.removeAttribute('data-v5-reveal-ready');
    };
  }, [pathname]);

  // A passive, RAF-throttled reading progress indicator on longer inner pages.
  useEffect(() => {
    const node = progressRef.current;
    if (!node || isHomepage) return;
    let frame = 0;
    const render = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      node.style.transform = 'scaleX(' + progress + ')';
    };
    const request = () => { if (!frame) frame = window.requestAnimationFrame(render); };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    request();
    return () => {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname, isHomepage]);

  // A pointer-following editorial cursor; no continuous RAF when stationary.
  useEffect(() => {
    const node = cursorRef.current;
    if (!node) return;
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!media.matches || !motionEnabled()) return;
    let x = -100, y = -100, targetX = -100, targetY = -100, raf = 0;
    let currentRow: HTMLElement | null = null;

    const tick = () => {
      x += (targetX - x) * 0.24;
      y += (targetY - y) * 0.24;
      node.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > .4) {
        raf = window.requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };
    const move = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      node.dataset.visible = 'true';
      const target = event.target instanceof Element ? event.target : null;
      node.dataset.hover = target?.closest('a,button,[role="button"]') ? 'true' : 'false';
      const row = target?.closest<HTMLElement>('.v5-work-row') || null;
      if (currentRow && currentRow !== row) {
        currentRow.style.removeProperty('--v5-parallax-x');
        currentRow.style.removeProperty('--v5-parallax-y');
      }
      currentRow = row;
      if (row) {
        const box = row.getBoundingClientRect();
        row.style.setProperty('--v5-parallax-x', ((event.clientX - box.left) / box.width - .5) * 14 + 'px');
        row.style.setProperty('--v5-parallax-y', ((event.clientY - box.top) / box.height - .5) * 13 + 'px');
      }
      if (!raf) raf = window.requestAnimationFrame(tick);
    };
    const hide = (event: Event) => {
      // Moving between descendants is not leaving the document.
      if (!(event instanceof PointerEvent) || !event.relatedTarget) {
        node.dataset.visible = 'false';
      }
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerout', hide, { passive: true });
    window.addEventListener('blur', hide);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerout', hide);
      window.removeEventListener('blur', hide);
      if (raf) window.cancelAnimationFrame(raf);
      currentRow?.style.removeProperty('--v5-parallax-x');
      currentRow?.style.removeProperty('--v5-parallax-y');
    };
  }, [pathname]);

  return (
    <div className="v5-motion-root">
      <div className="v5-motion-surface" key={pathname} ref={surfaceRef}>
        {children}
      </div>
      <div className={'v5-transition-wipe v5-transition-wipe--' + phase}
        aria-hidden="true"><span>YF<sup>✳</sup></span></div>
      {!isHomepage && <div className={'v5-scroll-progress' + (pathname.startsWith('/he/') ? ' v5-scroll-progress--rtl' : '')}
        ref={progressRef} aria-hidden="true" />}
      <div className="v5-custom-cursor" ref={cursorRef} aria-hidden="true" />
    </div>
  );
}
