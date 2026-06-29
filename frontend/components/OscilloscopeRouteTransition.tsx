'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

function routeFromHref(href: string) {
  const url = new URL(href, window.location.href);
  return `${url.pathname}${url.search}${url.hash}`;
}

function isDayMode() {
  return document.documentElement.dataset.theme === 'day';
}

function resetRouteArtifacts() {
  document.body.classList.remove('optical-routing-active');
  document.body.classList.remove('focus-resolution-active');
  document.body.style.overflow = '';
  document.querySelectorAll('.blueprint-route-canvas, .focus-resolution-canvas, .route-dive-shell').forEach((node) => node.remove());
  document.querySelectorAll<HTMLElement>('[data-route-focus="true"]').forEach((node) => node.removeAttribute('data-route-focus'));
  document.querySelectorAll<HTMLElement>('.mobile-route-exit').forEach((node) => node.classList.remove('mobile-route-exit'));
}

function runFocusResolution() {
  resetFocusArtifacts();
  document.body.classList.add('focus-resolution-active');

  const overlay = document.createElement('div');
  overlay.className = 'focus-resolution-canvas focus-resolution-scan';
  overlay.dataset.theme = isDayMode() ? 'day' : 'dark';
  document.body.appendChild(overlay);

  window.setTimeout(() => {
    document.body.classList.remove('focus-resolution-active');
    overlay.remove();
  }, 360);
}

function resetFocusArtifacts() {
  document.body.classList.remove('focus-resolution-active');
  document.querySelectorAll('.focus-resolution-canvas').forEach((node) => node.remove());
}

function runBlueprintDive(target: HTMLElement, onCommit: () => void) {
  resetRouteArtifacts();

  const rect = target.getBoundingClientRect();
  const shell = document.createElement('div');
  const frame = document.createElement('div');
  shell.className = 'blueprint-route-canvas route-dive-shell';
  shell.dataset.theme = isDayMode() ? 'day' : 'dark';
  frame.className = 'route-dive-frame';
  frame.style.left = `${rect.left}px`;
  frame.style.top = `${rect.top}px`;
  frame.style.width = `${Math.max(1, rect.width)}px`;
  frame.style.height = `${Math.max(1, rect.height)}px`;
  frame.style.setProperty('--route-dx', `${window.innerWidth * 0.5 - (rect.left + rect.width * 0.5)}px`);
  frame.style.setProperty('--route-dy', `${window.innerHeight * 0.5 - (rect.top + rect.height * 0.5)}px`);
  shell.appendChild(frame);
  document.body.appendChild(shell);

  target.setAttribute('data-route-focus', 'true');
  document.body.classList.add('optical-routing-active');
  document.body.style.overflow = 'hidden';

  window.requestAnimationFrame(() => frame.classList.add('is-dive-active'));
  window.setTimeout(onCommit, 610);
  window.setTimeout(() => {
    shell.remove();
    target.removeAttribute('data-route-focus');
    document.body.classList.remove('optical-routing-active');
    document.body.style.overflow = '';
  }, 980);
}

function isRoutableAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  const anchor = target.closest<HTMLAnchorElement>('a[data-osc-route="true"]');
  if (!anchor) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname) return null;
  return anchor;
}

export function OscilloscopeRouteTransition() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    resetRouteArtifacts();
    if (pathname.startsWith('/posts/')) {
      window.setTimeout(() => runFocusResolution(), 30);
    }
  }, [pathname]);

  useEffect(() => {
    const observed = new WeakSet<HTMLElement>();
    const autoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const card = entry.target as HTMLElement;
        card.toggleAttribute('data-auto-active', entry.isIntersecting && entry.intersectionRatio > 0.62);
      });
    }, { threshold: [0.45, 0.62, 0.82], rootMargin: '-28% 0px -28% 0px' });

    const bindAutoCards = () => {
      document.querySelectorAll<HTMLElement>('[data-log-card="true"]').forEach((card) => {
        if (observed.has(card)) return;
        observed.add(card);
        autoObserver.observe(card);
      });
    };

    const mutationObserver = new MutationObserver(bindAutoCards);
    bindAutoCards();
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const cleanupOnRestore = () => {
      resetRouteArtifacts();
      window.setTimeout(bindAutoCards, 0);
    };

    window.addEventListener('pageshow', cleanupOnRestore);
    window.addEventListener('popstate', cleanupOnRestore);
    window.addEventListener('visibilitychange', cleanupOnRestore);

    const onClick = (event: MouseEvent) => {
      const anchor = isRoutableAnchor(event.target);
      if (!anchor) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();
      resetRouteArtifacts();

      const href = anchor.href;
      const route = routeFromHref(href);
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      router.prefetch(new URL(href, window.location.href).pathname);

      if (isMobile || reducedMotion) {
        anchor.classList.add('mobile-route-exit');
        window.setTimeout(() => router.push(route), 180);
        return;
      }

      try {
        runBlueprintDive(anchor, () => router.push(route));
      } catch {
        resetRouteArtifacts();
        router.push(route);
      }
    };

    document.addEventListener('click', onClick, true);
    return () => {
      autoObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('pageshow', cleanupOnRestore);
      window.removeEventListener('popstate', cleanupOnRestore);
      window.removeEventListener('visibilitychange', cleanupOnRestore);
      document.removeEventListener('click', onClick, true);
      resetRouteArtifacts();
    };
  }, [router]);

  return null;
}
