/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': '#090a0f',
        'brand-card': '#12151f',
        'brand-card-hover': '#171b29',
        'accent-primary': '#00f2fe',
        'accent-secondary': '#4facfe',
        'accent-mint': '#00f5a0',
        'accent-coral': '#ff5e62',
        'accent-purple': '#a18cd1',
        'accent-orange': '#f59e0b',
        'text-primary': '#ffffff',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 242, 254, 0.3)',
        'glow-mint': '0 0 15px rgba(0, 245, 160, 0.3)',
        'glow-coral': '0 0 15px rgba(255, 94, 98, 0.3)',
        'glow-red-lg': '0 0 30px rgba(255, 94, 98, 0.5)',
      },
      animation: {
        'border-glow': 'borderGlowPulse 2s infinite alternate',
        'pulse-text': 'redPulseText 1.5s infinite alternate',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        borderGlowPulse: {
          '0%': { borderColor: 'rgba(255, 94, 98, 0.3)', boxShadow: '0 0 10px rgba(255, 94, 98, 0.15)' },
          '100%': { borderColor: 'rgba(255, 94, 98, 0.9)', boxShadow: '0 0 30px rgba(255, 94, 98, 0.5)' },
        },
        redPulseText: {
          '0%': { opacity: '0.7' },
          '100%': { opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
