import Link from 'next/link';
import { bundle } from './data/bundle';
import { T, FONT_MONO, FONT_DISPLAY, FONT_SANS } from './tokens';

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.maroon, margin: '48px 0 10px' }}>{children}</p>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 30, letterSpacing: '-0.015em', margin: '0 0 14px', color: T.maroonDeep }}>{children}</h2>
);

export default function NyscOverviewPage() {
  const { meta, evolution, mechanism, limits, compare, results } = bundle;
  return (
    <div data-theme="light" style={{ display: 'contents' }}>
    <main style={{ background: T.bone, minHeight: '100vh', color: T.ink, fontFamily: FONT_SANS }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '7px 16px', background: T.maroonDeep, color: T.bone, fontSize: 12.5, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7 }}>Intellign × NYSC</span>
        <span>{meta.confidentialBanner}</span>
      </div>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '56px 24px 96px' }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: T.maroonDeep, marginBottom: 28 }}>Intellign</div>
        <p style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.maroon, margin: 0 }}>Supporting document</p>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 54, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '10px 0 16px', color: T.maroonDeep }}>{meta.title}</h1>
        <p style={{ fontSize: 18, color: T.neutral600, lineHeight: 1.55, maxWidth: 640, margin: 0 }}>{meta.blurb}. {meta.banner}</p>
        <Link href="/demo/nysc-deployment/workspace" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '12px 22px', background: T.maroon, color: T.bone, borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          Watch the deployment in the workspace →
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginTop: 40 }}>
          {results.map((c) => (
            <div key={c.lbl} style={{ background: '#fff', border: `1px solid ${c.hi ? 'rgba(92,20,39,0.22)' : T.neutral200}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.neutral500, marginBottom: 4 }}>{c.lbl}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 34, color: c.hi ? T.maroon : T.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{c.val}</span>
                {c.sub && <span style={{ fontSize: 12, color: T.neutral500 }}>{c.sub}</span>}
              </div>
            </div>
          ))}
        </div>

        <Eyebrow>The problem</Eyebrow>
        <p style={{ lineHeight: 1.7, color: T.neutral700, fontSize: 16, margin: 0 }}>
          Newly qualified health graduates serving through the National Youth Service Corps must be placed at primary health facilities. Each placement has to fit the graduate&apos;s specialization, reach the facilities with the greatest need, and avoid overloading any facility. With 500 graduates and 750 facilities the number of possible plans is far too large to check by hand.
        </p>

        <Eyebrow>How the approach evolved</Eyebrow>
        <H2>Each version exposed the next problem</H2>
        {evolution.map((v) => (
          <div key={v.id} style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
            <b style={{ color: T.maroonDeep }}>{v.name}</b>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: T.neutral700, lineHeight: 1.55 }}><b>What it did.</b> {v.did}</p>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: T.neutral700, lineHeight: 1.55 }}><b>What it exposed.</b> {v.exposed}</p>
            <p style={{ margin: '6px 0 0', fontFamily: FONT_MONO, fontSize: 10.5, color: T.neutral500 }}>{v.source}</p>
          </div>
        ))}

        <Eyebrow>Results</Eyebrow>
        <H2>Version 3 beside version 4</H2>
        <div style={{ overflowX: 'auto', background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: T.neutral50, textAlign: 'left' }}>
                {['Measure', compare.head[0], compare.head[1]].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.neutral500, fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compare.rows.map((r) => (
                <tr key={r.label} style={{ borderTop: `1px solid ${T.neutral200}` }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.label}</td><td style={{ padding: '10px 14px' }}>{r.a}</td><td style={{ padding: '10px 14px' }}>{r.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: T.neutral500 }}>Source: invention disclosure, section 12.2. Setup: 500 generated graduate records, 750 facilities sampled from 44,915.</p>

        <Eyebrow>How the engine works</Eyebrow>
        <ol style={{ paddingLeft: 20, lineHeight: 1.75, color: T.neutral700, fontSize: 16, margin: 0 }}>
          {mechanism.map((m) => <li key={m}>{m}</li>)}
        </ol>

        <Eyebrow>Limits we state openly</Eyebrow>
        <ul style={{ paddingLeft: 20, lineHeight: 1.75, color: T.neutral700, fontSize: 15, margin: 0 }}>
          {limits.map((l) => <li key={l}>{l}</li>)}
        </ul>
      </div>
    </main>
    </div>
  );
}
