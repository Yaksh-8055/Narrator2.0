import type { Config } from 'tailwindcss';

/**
 * tailwind.config.ts
 *
 * Content paths tell Tailwind which files to scan for class names.
 * Any class not found in these paths will be purged from the production build.
 *
 * The Inter font variable (--font-inter) is extended into the fontFamily
 * theme so it can be used as a Tailwind utility class: font-inter
 */
const config: Config = {
  content: [
    /* App Router pages and layouts */
    './app/**/*.{js,ts,jsx,tsx,mdx}',

    /* Reusable components */
    './components/**/*.{js,ts,jsx,tsx,mdx}',

    /* Any utility files that render JSX (e.g. lib helpers with UI) */
    './lib/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      /* ── Font family ───────────────────────────────────────────────────── */
      fontFamily: {
        /* Usage: className="font-sans"  →  Inter + system fallbacks */
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],

        /* Usage: className="font-serif"  →  Georgia + system fallbacks       */
        /* Used in story content display for a readable, book-like feel        */
        serif: ['Georgia', "'Times New Roman'", 'ui-serif', 'serif'],
      },
    },
  },

  plugins: [],
};

export default config;
