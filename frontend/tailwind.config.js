export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark': {
          900: '#0a0a1a',
          800: '#0f0f2e',
          700: '#161640',
          600: '#1e1e52',
        },
        'neon': {
          cyan: '#00f5ff',
          purple: '#b347ea',
          pink: '#ff47ab',
          green: '#00ff88',
          blue: '#4785ff',
        }
      },
    },
  },
  plugins: [],
}