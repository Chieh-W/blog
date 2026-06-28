'use client';

import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function GsapLayer() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = new Lenis({
      lerp: reducedMotion ? 1 : 0.075,
      smoothWheel: !reducedMotion,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.15
    });

    const syncScrollTrigger = () => ScrollTrigger.update();
    lenis.on('scroll', syncScrollTrigger);

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
      gsap.fromTo(el,
        { autoAlpha: 0, y: 28, filter: 'blur(8px)' },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: reducedMotion ? 0.01 : 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 86%' }
        }
      );
    });

    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 250);

    return () => {
      window.clearTimeout(refreshId);
      cancelAnimationFrame(rafId);
      (lenis as { off?: (event: string, callback: () => void) => void }).off?.('scroll', syncScrollTrigger);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return null;
}
