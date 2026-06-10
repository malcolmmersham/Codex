// Tiny no-build rendering helper.
// Binds htm to React.createElement so we get JSX-like syntax that runs
// natively in the browser — no transpiler, no build step. This is what makes
// the app deployable as plain static files on GitHub Pages.
import { createElement } from 'https://esm.sh/react@18.3.1';
import htm from 'https://esm.sh/htm@3.1.1';

export const html = htm.bind(createElement);
export { createElement };
export * from 'https://esm.sh/react@18.3.1';
