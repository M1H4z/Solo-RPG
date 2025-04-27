/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050816", // Very dark blue/black
        surface: "#101223", // Dark surface for cards/containers
        primary: {
          // Electric Blue
          DEFAULT: "#2563eb",
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1", // Adjusted primary to be slightly more violet
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        secondary: {
          // Deep Purple
          DEFAULT: "#7c3aed",
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed", // DEFAULT
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        accent: {
          // Gold/Yellow
          DEFAULT: "#facc15",
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15", // DEFAULT
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
          950: "#422006",
        },
        "text-primary": "#f8fafc", // White/Off-white
        "text-secondary": "#94a3b8", // Light gray
        "text-disabled": "#475569", // Muted gray for disabled states
        "border-light": "#334155", // Slightly lighter border
        "border-dark": "#1e293b", // Darker border
        danger: "#dc2626", // Red for destructive actions/errors
        success: "#16a34a", // Green for success messages
        warning: "#f97316", // Orange for warnings
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["Roboto Mono", "ui-monospace", "SFMono-Regular"],
        // Example: Adding a display font if needed later
        // display: ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        "glow-primary": "0 0 15px 5px rgba(37, 99, 235, 0.5)", // Glow effect for primary color
        "glow-secondary": "0 0 15px 5px rgba(124, 58, 237, 0.5)", // Glow effect for secondary color
        "glow-accent": "0 0 15px 5px rgba(250, 204, 21, 0.5)", // Glow effect for accent color
      },
    },
  },
  plugins: [],
};
