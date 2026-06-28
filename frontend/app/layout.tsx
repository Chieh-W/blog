import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { GsapLayer } from '@/components/GsapLayer';

export const metadata: Metadata = {
  title: 'Cyber-Physical Nexus',
  description: '连接物理硬件与数字生态的极客构建者',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9053')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <GsapLayer />
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
