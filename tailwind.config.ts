import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    // Include ALL src files so JIT picks up classes in lib/constants.ts, data/mock.ts, store/, etc.
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Gövde: yuvarlak hatlı, çocuk ürünlerine uygun ama okunaklı
        sans: ['"Nunito Variable"', 'Nunito', 'system-ui', 'sans-serif'],
        // Başlıklar: karakterli, geniş-dar ekseni olan grotesk
        display: ['"Bricolage Grotesque Variable"', '"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ── Mağaza rengi ──────────────────────────────────────────────────
        // Değerler CSS değişkenlerinden okunuyor (bkz. src/styles/brand.css).
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        sun: 'rgb(var(--sun) / <alpha-value>)',
        aqua: 'rgb(var(--aqua) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        brand: {
          50: 'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
          accent: 'rgb(var(--brand-accent) / <alpha-value>)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    // Enables `prose` utility classes used in blog post content
    require('@tailwindcss/typography'),
  ],
};

export default config;
