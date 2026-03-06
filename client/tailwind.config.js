/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        loanlight: {
          "primary": "#1e40af",
          "primary-content": "#ffffff",
          "secondary": "#7c3aed",
          "secondary-content": "#ffffff",
          "accent": "#059669",
          "accent-content": "#ffffff",
          "neutral": "#1f2937",
          "neutral-content": "#f9fafb",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#e2e8f0",
          "base-content": "#1e293b",
          "info": "#3b82f6",
          "info-content": "#ffffff",
          "success": "#22c55e",
          "success-content": "#ffffff",
          "warning": "#f59e0b",
          "warning-content": "#ffffff",
          "error": "#ef4444",
          "error-content": "#ffffff",
        },
      },
      {
        loandark: {
          "primary": "#3b82f6",
          "primary-content": "#ffffff",
          "secondary": "#8b5cf6",
          "secondary-content": "#ffffff",
          "accent": "#10b981",
          "accent-content": "#ffffff",
          "neutral": "#374151",
          "neutral-content": "#f9fafb",
          "base-100": "#0f172a",
          "base-200": "#1e293b",
          "base-300": "#334155",
          "base-content": "#e2e8f0",
          "info": "#60a5fa",
          "info-content": "#ffffff",
          "success": "#34d399",
          "success-content": "#ffffff",
          "warning": "#fbbf24",
          "warning-content": "#1e293b",
          "error": "#f87171",
          "error-content": "#ffffff",
        },
      },
    ],
  },
};
