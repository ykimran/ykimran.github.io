import { mkdir, copyFile } from 'node:fs/promises';
const generated = new URL('./generated/', import.meta.url);
await mkdir(generated, { recursive: true });
await copyFile(new URL('../private/studio.js', import.meta.url), new URL('studio-js.txt', generated));
await copyFile(new URL('../private/studio.css', import.meta.url), new URL('studio-css.txt', generated));
console.log('Bundled the same editor source used by Vercel.');
