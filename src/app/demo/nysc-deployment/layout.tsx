import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NYSC Strategic Deployment: supporting document',
  description: 'Recorded run replay of the NYSC healthcare graduate deployment.',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function NyscLayout({ children }: { children: React.ReactNode }) {
  return children;
}
