import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'exports');
const outFile = resolve(outDir, 'intellign-nysc-deployment.html');

const result = await build({
  entryPoints: [resolve(root, 'scripts/nysc-export-entry.tsx')],
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  target: 'es2019',
  minify: true,
  jsx: 'automatic',
  tsconfigRaw: { compilerOptions: { jsx: 'react-jsx' } },
  loader: { '.json': 'json' },
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'error',
});

const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

// Embed the app's own self-hosted fonts (src/fonts) and define the same --font-* variables as src/app/globals.css,
// so the export renders with the same typography as the product.
const fontUri = (file) => `data:font/woff2;base64,${readFileSync(resolve(root, 'src/fonts', file)).toString('base64')}`;
const fontCss = [
  `@font-face{font-family:'Instrument Serif';src:url(${fontUri('instrument-serif-normal.woff2')}) format('woff2');font-weight:400;font-style:normal;font-display:block}`,
  `@font-face{font-family:'Inter Tight';src:url(${fontUri('inter-tight-normal.woff2')}) format('woff2');font-weight:300 700;font-style:normal;font-display:block}`,
  `@font-face{font-family:'JetBrains Mono';src:url(${fontUri('jetbrains-mono-normal.woff2')}) format('woff2');font-weight:100 800;font-style:normal;font-display:block}`,
  `:root{--font-display:'Instrument Serif','Times New Roman',Georgia,serif;--font-sans:'Inter Tight',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;--font-mono:'JetBrains Mono',ui-monospace,'SF Mono',Menlo,monospace}`,
].join('\n');
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Intellign: NYSC Strategic Deployment (supporting document)</title>
<style>
${fontCss}
html,body{margin:0;background:#F4EFE7;font-family:var(--font-sans);-webkit-font-smoothing:antialiased}
*{box-sizing:border-box}
button:disabled{opacity:.45;cursor:default}
</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, html);
console.log(`wrote ${outFile} (${(html.length / 1024).toFixed(0)} KB)`);
