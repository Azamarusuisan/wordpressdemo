/**
 * エクスポート用のスタンドアロンCSS生成
 * Tailwind CDNに依存せず、オフラインでも動作するようにする
 */

export function generateExportCSS(): string {
  return `
/* Reset & Base */
*, *::before, *::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: #e5e7eb;
}
html {
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  font-family: 'Noto Sans JP', ui-sans-serif, system-ui, sans-serif;
}
body {
  margin: 0;
  line-height: inherit;
  font-family: 'Noto Sans JP', sans-serif;
  scroll-behavior: smooth;
}
img {
  display: block;
  max-width: 100%;
  height: auto;
}
a {
  color: inherit;
  text-decoration: inherit;
}
button, input, textarea {
  font-family: inherit;
  font-size: 100%;
  line-height: inherit;
  color: inherit;
  margin: 0;
  padding: 0;
}
button {
  cursor: pointer;
  background-color: transparent;
  background-image: none;
}

/* Layout */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.items-end { align-items: flex-end; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.gap-6 { gap: 1.5rem; }

/* Sizing */
.w-full { width: 100%; }
.h-16 { height: 4rem; }
.h-48 { height: 12rem; }
.h-auto { height: auto; }
.min-h-screen { min-height: 100vh; }
.max-w-sm { max-width: 24rem; }
.max-w-md { max-width: 28rem; }
.max-w-xl { max-width: 36rem; }

/* Spacing */
.mx-auto { margin-left: auto; margin-right: auto; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mb-8 { margin-bottom: 2rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.px-8 { padding-left: 2rem; padding-right: 2rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.py-12 { padding-top: 3rem; padding-bottom: 3rem; }
.p-2 { padding: 0.5rem; }
.space-y-4 > * + * { margin-top: 1rem; }

/* Position */
.relative { position: relative; }
.absolute { position: absolute; }
.sticky { position: sticky; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.inset-x-0 { left: 0; right: 0; }
.top-0 { top: 0; }
.top-10 { top: 2.5rem; }
.top-1\\/2 { top: 50%; }
.bottom-10 { bottom: 2.5rem; }
.-translate-y-1\\/2 { transform: translateY(-50%); }
.z-10 { z-index: 10; }
.z-20 { z-index: 20; }
.z-50 { z-index: 50; }

/* Typography */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.font-medium { font-weight: 500; }
.font-bold { font-weight: 700; }
.font-black { font-weight: 900; }
.tracking-tight { letter-spacing: -0.025em; }
.leading-tight { line-height: 1.25; }
.text-center { text-align: center; }
.whitespace-pre-wrap { white-space: pre-wrap; }

/* Colors */
.text-white { color: #ffffff; }
.text-black { color: #000000; }
.text-gray-400 { color: #9ca3af; }
.text-gray-600 { color: #4b5563; }
.text-gray-700 { color: #374151; }
.text-gray-900 { color: #111827; }
.bg-white { background-color: #ffffff; }
.bg-white\\/90 { background-color: rgba(255, 255, 255, 0.9); }
.bg-gray-50 { background-color: #f9fafb; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-gray-900 { background-color: #111827; }
.bg-blue-600 { background-color: #2563eb; }

/* Borders */
.border { border-width: 1px; }
.border-gray-300 { border-color: #d1d5db; }
.rounded-md { border-radius: 0.375rem; }
.rounded-full { border-radius: 9999px; }
.rounded-lg { border-radius: 0.5rem; }

/* Shadows */
.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); }
.shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }

/* Effects */
.opacity-70 { opacity: 0.7; }
.overflow-hidden { overflow: hidden; }
.backdrop-blur-md { backdrop-filter: blur(12px); }
.pointer-events-none { pointer-events: none; }
.drop-shadow-text { filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8)); }

/* Transitions */
.transition-colors { transition-property: color, background-color, border-color; transition-duration: 150ms; }
.transition-transform { transition-property: transform; transition-duration: 150ms; }
.transition-all { transition-property: all; transition-duration: 150ms; }

/* Interactive States */
.hover\\:text-blue-600:hover { color: #2563eb; }
.hover\\:bg-blue-700:hover { background-color: #1d4ed8; }
.hover\\:bg-gray-100:hover { background-color: #f3f4f6; }
.hover\\:scale-105:hover { transform: scale(1.05); }
.active\\:scale-95:active { transform: scale(0.95); }
.focus\\:border-blue-500:focus { border-color: #3b82f6; }
.focus\\:ring-blue-500:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px #3b82f6;
}

/* Display */
.block { display: block; }
.hidden { display: none; }

/* Form Elements */
input, textarea {
  appearance: none;
  background-color: #fff;
}
input:focus, textarea:focus {
  outline: none;
}

/* Responsive - md (768px) */
@media (min-width: 768px) {
  .md\\:flex { display: flex; }
  .md\\:px-8 { padding-left: 2rem; padding-right: 2rem; }
  .md\\:max-w-xl { max-width: 36rem; }
  .md\\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
}

/* Responsive - lg (1024px) */
@media (min-width: 1024px) {
  .lg\\:max-w-2xl { max-width: 42rem; }
}
`.trim();
}
