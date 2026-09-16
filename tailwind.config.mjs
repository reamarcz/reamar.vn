/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        yellix: ['Yellix', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* Solidpixels: --background:#fff, hsl(0,0%,0%), hsl(0,0%,92.94%) */
        black: '#000000',
        white: '#ffffff',
        'section-bg': 'hsl(0, 0%, 92.94%)', /* #ededed */
      },
      maxWidth: {
        'content': '1200px',
        'wide': '1400px',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0,0,0,0.06)',
        'card': '0 2px 8px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
