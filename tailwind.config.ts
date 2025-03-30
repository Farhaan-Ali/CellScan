
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Custom cancer detection app colors
				cancer: {
					blue: '#1EAEDB',
					teal: '#33C3F0',
					purple: '#8B5CF6',
					pink: '#D946EF',
					dark: '#1A1F2C',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				'pulse-glow': {
					'0%, 100%': { 
						boxShadow: '0 0 10px rgba(30, 174, 219, 0.5)',
						transform: 'scale(1)'
					},
					'50%': { 
						boxShadow: '0 0 20px rgba(30, 174, 219, 0.9), 0 0 30px rgba(217, 70, 239, 0.5)',
						transform: 'scale(1.03)'
					},
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' },
				},
				'scan': {
					'0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
				},
				'bounce-light': {
					'0%, 100%': { 
						transform: 'translateY(0)', 
						boxShadow: '0 0 5px rgba(30, 174, 219, 0.3)'
					},
					'50%': { 
						transform: 'translateY(-5px)', 
						boxShadow: '0 0 15px rgba(30, 174, 219, 0.7)'
					},
				},
				'rotate-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' },
				},
				'border-glow': {
					'0%, 100%': { borderColor: 'rgba(30, 174, 219, 0.7)' },
					'50%': { borderColor: 'rgba(217, 70, 239, 0.7)' },
				},
				'shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'20%, 60%': { transform: 'translateX(-5px)' },
					'40%, 80%': { transform: 'translateX(5px)' },
				},
				'appear': {
					'0%': { opacity: '0', transform: 'scale(0.8)' },
					'100%': { opacity: '1', transform: 'scale(1)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 2s infinite',
				'float': 'float 3s ease-in-out infinite',
				'scan': 'scan 2s infinite linear',

				'bounce-light': 'bounce-light 2s ease-in-out infinite',
				'rotate-slow': 'rotate-slow 8s linear infinite',
				'border-glow': 'border-glow 2s infinite',
				'shake': 'shake 0.5s ease-in-out',
				'appear': 'appear 0.3s ease-out forwards',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'neural-pattern': 'url("/assets/neural-pattern.svg")',
			},
			fontFamily: {
				'exo': ['"Exo 2"', 'sans-serif'],
				'quicksand': ['Quicksand', 'sans-serif'],
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
