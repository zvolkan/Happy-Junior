import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    // Include ALL src files so JIT picks up classes in lib/constants.ts, data/mock.ts, store/, etc.
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ── ALB Tarım — "Koyu Orman" ──────────────────────────────────────
        tarim: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          400: '#4ade80',
          500: '#16a34a',
          600: '#166534',
          700: '#14532d',
          800: '#0b4023',
          900: '#052e16',
          accent: '#a3e635',
        },
        // ── ALB Su Teknolojileri — "Derin Su" ─────────────────────────────
        // Tarım paletiyle bilinçli olarak eşlenmiş: 600 ve 700 tonlarının
        // beyaz üzerindeki kontrast oranları neredeyse birebir aynı, böylece
        // iki marka yan yana geldiğinde aynı ağırlıkta duruyor.
        albsu: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          400: '#22d3ee',
          500: '#0891b2',
          600: '#155e75',
          700: '#164e63',
          800: '#0e3f52',
          900: '#083344',
          accent: '#67e8f9',
        },
        // ── Aktif marka ───────────────────────────────────────────────────
        // Değerler CSS değişkenlerinden okunuyor; <html data-brand="..."> ile
        // belirleniyor (bkz. src/styles/brand.css). Böylece sayfalarda
        // `isAlbSu ? 'bg-blue-600' : 'bg-green-600'` gibi koşullar yerine tek
        // bir `bg-brand-600` yazılabiliyor.
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
