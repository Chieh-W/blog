'use client';

import { useEffect, useState } from 'react';

const BOOT_LINES = [
  'System: Signal Locked.',
  'Infra: Ubuntu Deployment Status - Online.',
  'WebGL: Optical Engine Uniforms Synced.',
  'CMS: Strapi Content Bus - Listening.',
  'Route: Blueprint Dive Handshake Armed.',
  'Theme: Dual-Mode Optical Engine Ready.',
  'Lenis: Scroll Clock Linked to Render Loop.',
  'Build: Standalone Runtime Integrity - OK.'
];

function timestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export function LogMatrixStream() {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let index = 0;
    const push = () => {
      const line = `[${timestamp()}] ${BOOT_LINES[index % BOOT_LINES.length]}`;
      index += 1;
      setLines((current) => [...current.slice(-7), line]);
    };

    push();
    const timer = window.setInterval(push, 1550);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <aside className="log-matrix-stream" data-reveal aria-label="Realtime Log Matrix Stream">
      <div className="terminal-panel-head">
        <span>LOG MATRIX STREAM</span>
        <span>LIVE</span>
      </div>
      <div className="terminal-lines">
        {lines.map((line, index) => (
          <div className="terminal-log-line" key={`${line}-${index}`}>{line}</div>
        ))}
      </div>
    </aside>
  );
}
