/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                saffron: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#FF6B00',
                    600: '#FF8C00',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                },
                gold: {
                    400: '#FFD700',
                    500: '#FFC300',
                    600: '#FFB300',
                },
            },
            boxShadow: {
                card: '0 1px 2px rgba(124, 45, 18, 0.06), 0 1px 3px rgba(124, 45, 18, 0.06)',
                raised: '0 2px 4px rgba(124, 45, 18, 0.08), 0 4px 12px rgba(124, 45, 18, 0.08)',
            },
            fontFamily: {
                sans: ['Inter', 'Noto Sans Devanagari', 'Noto Sans Bengali', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Gujarati', 'Noto Sans Gurmukhi', 'system-ui', 'sans-serif'],
            },
            animation: {
                'bounce-slow': 'bounce 2s infinite',
                'pulse-slow': 'pulse 3s infinite',
                'fade-in': 'fadeIn 0.3s ease-in',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
};
