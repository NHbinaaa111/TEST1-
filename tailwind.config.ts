import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "glow-burst": {
          "0%": { 
            filter: "blur(10px)",
            opacity: "0.4",
          },
          "50%": { 
            filter: "blur(15px)",
            opacity: "0.8",
          },
          "100%": { 
            filter: "blur(10px)",
            opacity: "0.4",
          },
        },
        "ripple": {
          "0%": { 
            transform: "scale(0)",
            opacity: "0.7",
          },
          "100%": { 
            transform: "scale(2)",
            opacity: "0",
          },
        },
        "orb-click": {
          "0%": { 
            transform: "scale(1)",
          },
          "50%": { 
            transform: "scale(0.95)",
          },
          "100%": { 
            transform: "scale(1)",
          },
        },
        "float": {
          "0%": { 
            transform: "translateY(0px)",
          },
          "50%": { 
            transform: "translateY(-10px)",
          },
          "100%": { 
            transform: "translateY(0px)",
          },
        },
        "fragment-1": {
          "0%": { 
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: "1"
          },
          "10%": {
            opacity: "1"
          },
          "80%": { 
            transform: "translate(-120px, -90px) scale(0.3) rotate(-45deg)",
            opacity: "0.8"
          },
          "100%": { 
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: "1"
          }
        },
        "fragment-2": {
          "0%": { 
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: "1"
          },
          "10%": {
            opacity: "1"
          },
          "80%": { 
            transform: "translate(120px, -90px) scale(0.3) rotate(45deg)",
            opacity: "0.8"
          },
          "100%": { 
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: "1"
          }
        },
        "fragment-3": {
          "0%": { 
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: "1"
          },
          "10%": {
            opacity: "1"
          },
          "80%": { 
            transform: "translate(-130px, 20px) scale(0.3) rotate(-60deg)",
            opacity: "0.8"
          },
          "100%": { 
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: "1"
          }
        },
        "fragment-4": {
          "0%": { 
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: "1"
          },
          "10%": {
            opacity: "1"
          },
          "80%": { 
            transform: "translate(130px, 20px) scale(0.3) rotate(60deg)",
            opacity: "0.8"
          },
          "100%": { 
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: "1"
          }
        },
        "fragment-5": {
          "0%": { 
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: "1"
          },
          "10%": {
            opacity: "1"
          },
          "80%": { 
            transform: "translate(-80px, 110px) scale(0.3) rotate(-30deg)",
            opacity: "0.8"
          },
          "100%": { 
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: "1"
          }
        },
        "fragment-6": {
          "0%": { 
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: "1"
          },
          "10%": {
            opacity: "1"
          },
          "80%": { 
            transform: "translate(80px, 110px) scale(0.3) rotate(30deg)",
            opacity: "0.8"
          },
          "100%": { 
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: "1"
          }
        },
        "explosion-ring": {
          "0%": {
            transform: "scale(0.2)",
            opacity: "1"
          },
          "100%": {
            transform: "scale(2)",
            opacity: "0"
          }
        },
        "particles-float": {
          "0%, 100%": {
            transform: "translateY(0) translateX(0)",
          },
          "25%": {
            transform: "translateY(-5px) translateX(5px)",
          },
          "50%": {
            transform: "translateY(-10px) translateX(-5px)",
          },
          "75%": {
            transform: "translateY(-5px) translateX(-10px)",
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 3s ease-in-out infinite",
        "ripple": "ripple 1s forwards ease-out",
        "glow-burst": "glow-burst 0.8s ease-in-out",
        "orb-click": "orb-click 0.5s ease-in-out",
        "fragment-1": "fragment-1 2s cubic-bezier(0.2, 0.6, 0.35, 1)",
        "fragment-2": "fragment-2 2s cubic-bezier(0.2, 0.6, 0.35, 1)",
        "fragment-3": "fragment-3 2s cubic-bezier(0.2, 0.6, 0.35, 1)",
        "fragment-4": "fragment-4 2s cubic-bezier(0.2, 0.6, 0.35, 1)",
        "fragment-5": "fragment-5 2s cubic-bezier(0.2, 0.6, 0.35, 1)",
        "fragment-6": "fragment-6 2s cubic-bezier(0.2, 0.6, 0.35, 1)",
        "explosion-ring": "explosion-ring 1.5s forwards ease-out"
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
