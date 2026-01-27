import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: 'class',
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                marcan: {
                    red: '#ef4444',
                    glow: '#b91c1c',
                    dark: '#020617',
                    panel: '#0f172a',
                    glass: 'rgba(15, 23, 42, 0.85)',
                },
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
                heading: ['var(--font-montserrat)', 'sans-serif'],
            },
            boxShadow: {
                neon: '0 0 10px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.3)',
                glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [],
}
export default config
