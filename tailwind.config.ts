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
        // Yielder huisstijl
        yielder: {
          navy: "#1f3b61",
          "navy-warm": "#2a4a7a",
          "navy-dark": "#17304f",
          orange: "#f5a623",
          gold: "#c9a96e",
          "gold-light": "#f0e6d3",
        },
        // Achtergronden
        "warm-50": "#fefdfb",
        "warm-100": "#faf8f5",
        "warm-200": "#f5f1eb",
        "warm-300": "#ebe5db",
        "surface-warm": "#fdfcfa",
        // shadcn CSS variable mapping
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      fontSize: {
        display: ["2.25rem", { lineHeight: "1.2", fontWeight: "700" }],
        heading: ["1.25rem", { lineHeight: "1.3", fontWeight: "700" }],
        subheading: ["1rem", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }],
        micro: ["0.6875rem", { lineHeight: "1.3", fontWeight: "500" }],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(31,59,97,0.04), 0 4px 12px rgba(31,59,97,0.05)",
        "card-hover":
          "0 2px 8px rgba(31,59,97,0.06), 0 8px 24px rgba(31,59,97,0.08)",
        premium: "0 4px 20px rgba(31,59,97,0.08)",
        soft: "0 1px 2px rgba(31,59,97,0.03)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
