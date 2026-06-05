import { createElement } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import App from './App.js';

const root = createRoot(document.getElementById('root'));
root.render(createElement(App));
