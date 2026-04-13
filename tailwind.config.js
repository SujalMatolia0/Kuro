/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0d1117',
          secondary: '#161b22',
          tertiary: '#1c2333',
        },
        accent: {
          green: '#00ff9f',
          blue: '#00bfff',
          red: '#ff6b6b',
          amber: '#ffa500',
        },
        border: '#30363d',
        text: {
          primary: '#e6edf3',
          muted: '#7d8590',
        },
        platform: {
          fusion: '#00ff9f',
          sales: '#00bfff',
          service: '#ff6b6b',
          oic: '#ffa500',
          bip: '#a855f7',
          vbs: '#ec4899',
          oda: '#14b8a6',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'system-ui', 'monospace'],
      },
      borderRadius: {
        standard: '6px',
        card: '10px',
      }
    },
  },
  plugins: [],
}
