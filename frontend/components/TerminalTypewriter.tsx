'use client';

import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

const HEX_CHARS = '0123456789ABCDEF[]/_-.: SYSINITLOCKEDTRACEONLINE';

function randomFrame(length: number) {
  return Array.from({ length }, () => HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]).join('');
}

export function TerminalTypewriter({ lines, className = '' }: { lines: string[]; className?: string }) {
  const outputRef = useRef<HTMLSpanElement | null>(null);
  const serializedLines = useMemo(() => lines.join('\u0001'), [lines]);

  useEffect(() => {
    const output = outputRef.current;
    if (!output) return;

    gsap.registerPlugin(TextPlugin);
    const sourceLines = serializedLines.split('\u0001').filter(Boolean);
    if (!sourceLines.length) return;

    let lineIndex = 0;
    let scrambleTimer = 0;
    let holdTimer = 0;
    let tween: gsap.core.Tween | null = null;
    let disposed = false;

    const play = () => {
      if (disposed) return;
      const target = sourceLines[lineIndex % sourceLines.length];
      lineIndex += 1;
      let ticks = 0;
      const width = Math.max(target.length, 26);
      output.textContent = '[INITIALIZING..._]';

      scrambleTimer = window.setInterval(() => {
        ticks += 1;
        output.textContent = ticks < 4 ? `[${randomFrame(width - 2)}]` : '[SIGNAL_LOCKED...]';
        if (ticks >= 4) {
          window.clearInterval(scrambleTimer);
          tween = gsap.to(output, {
            duration: Math.min(1.2, Math.max(0.54, target.length * 0.018)),
            text: { value: target, delimiter: '' },
            ease: 'none',
            onComplete: () => {
              holdTimer = window.setTimeout(play, 2700);
            }
          });
        }
      }, 46);
    };

    play();

    return () => {
      disposed = true;
      window.clearInterval(scrambleTimer);
      window.clearTimeout(holdTimer);
      tween?.kill();
    };
  }, [serializedLines]);

  return (
    <span className={`terminal-typewriter ${className}`} aria-live="polite">
      <span ref={outputRef} />
      <span className="terminal-cursor" aria-hidden>_</span>
    </span>
  );
}
