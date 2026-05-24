/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nordic: {
          bg: '#F4F6F8',        // Frost Cream Light Ceramic
          panel: '#FFFFFF',     // Clean White Card
          border: '#E2E8F0',    // Soft Slate Divider
          emerald: '#10B981',   // Mint Neon Accent
          emeraldHover: '#059669',
          alert: '#F43F5E',     // Soft Coral Red
          alertBg: '#FFF1F2',
          textMain: '#0F172A',  // Dark Indigo Gray
          textMuted: '#64748B'  // Cool Slate Subtext
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        }
      }
    },
  },
  plugins: [],
}