import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FBF0F0",
        foreground: "#4A3B5E",
        card: "#FFFFFF",
        "card-foreground": "#4A3B5E",
        primary: "#F0C0C0",
        "primary-foreground": "#4A3B5E",
        secondary: "#FCE4E4",
        "secondary-foreground": "#4A3B5E",
        muted: "#FDF3F3",
        "muted-foreground": "#7B6B8A",
        accent: "#D0BDE0",
        "accent-foreground": "#FFFFFF",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
        border: "#F8DEDE",
        input: "#FFFFFF",
        ring: "#F0C0C0",
      },
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
