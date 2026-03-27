import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fika: {
          // Fondos
          beige:   "#f5f0e8",   // fondo principal
          cream:   "#ede8df",   // fondo secundario / hover
          paper:   "#faf7f2",   // blanco cálido para cards

          // Primarios
          black:   "#1a1208",   // texto e interfaz primaria
          dark:    "#2a2010",   // bordes oscuros, sidebar
          panel:   "#221a0f",   // panel lateral oscuro

          // Acento
          gold:    "#c8a96e",   // oro viejo — acento principal
          "gold-light": "#e0bf80",  // hover del oro
          "gold-dark":  "#a88950",  // oro oscuro

          // Texto sobre fondos claros
          muted:   "#a89060",   // texto secundario sobre beige
          subtle:  "#d4c4a0",   // texto tenue sobre oscuro
          border:  "#e8dfc8",   // borde sutil sobre beige

          // Estados de mesas
          free:    "#4a7c59",   // verde — libre
          "free-bg": "#edf5f0",
          busy:    "#c07030",   // naranja — ocupada
          "busy-bg": "#fef3e8",
          ready:   "#2e5fa3",   // azul — lista para cobrar
          "ready-bg": "#eef4fc",
          dirty:   "#7a7670",   // gris — sucia
          "dirty-bg": "#f0eeec",

          // Acción principal
          success: "#3a6b45",   // verde cobro
          "success-light": "#e8f5ee",
          danger:  "#8b2e2e",   // rojo anulación
          "danger-light": "#fceaea",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        mono:    ["DM Mono", "Courier New", "monospace"],
        sans:    ["DM Sans", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px", letterSpacing: "0.08em" }],
        "xs":  ["11px", { lineHeight: "16px" }],
        "sm":  ["12px", { lineHeight: "18px" }],
        "base":["14px", { lineHeight: "20px" }],
      },
      borderRadius: {
        DEFAULT: "6px",
        lg: "10px",
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        card:   "0 1px 4px rgba(26,18,8,0.07), 0 0 0 1px rgba(200,169,110,0.12)",
        "card-hover": "0 4px 16px rgba(26,18,8,0.10), 0 0 0 1px rgba(200,169,110,0.25)",
        ticket: "inset 0 1px 0 rgba(200,169,110,0.15)",
        modal:  "0 20px 60px rgba(26,18,8,0.35)",
      },
      spacing: {
        "sidebar": "64px",
        "panel":   "320px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
      },
      animation: {
        "fade-in":  "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-slow": "pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;