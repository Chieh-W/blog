import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

const nav = [
  ['文章', '/posts'],
  ['项目', '/projects'],
  ['关于', '/about'],
  ['联系', '/contact']
] as const;

export function Header() {
  return (
    <header className="site-header">
      <nav className="container nav">
        <Link className="brand" href="/" aria-label="Cyber-Physical Nexus home">
          <span className="brand-mark" />
          <span>Cyber-Physical Nexus</span>
        </Link>
        <div className="nav-links">
          {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
