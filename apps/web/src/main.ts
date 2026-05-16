import { buildIndependentWebAppShell, renderIndependentWebAppHtml } from './app-shell.js';

const root = document.querySelector('#storyspec-web-root');

if (root) {
  root.outerHTML = renderIndependentWebAppHtml(buildIndependentWebAppShell());
}
