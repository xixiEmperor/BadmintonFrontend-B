import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  plugins: [daisyui],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 炫酷霓虹色系
        neon: {
          pink: '#ff0080',
          cyan: '#00ffff',
          purple: '#8b5cf6',
          green: '#00ff41',
          blue: '#0099ff',
          orange: '#ff6600',
          yellow: '#ffff00',
        },
        // 深色科技风
        cyber: {
          dark: '#0a0a0a',
          darker: '#050505',
          gray: '#1a1a1a',
          'gray-light': '#2a2a2a',
          'gray-lighter': '#3a3a3a',
        },
        // 渐变色基础色
        gradient: {
          start: '#667eea',
          middle: '#764ba2',
          end: '#f093fb',
          'purple-start': '#4c1d95',
          'purple-end': '#c084fc',
          'blue-start': '#1e40af',
          'blue-end': '#60a5fa',
          'green-start': '#065f46',
          'green-end': '#34d399',
          'orange-start': '#ea580c',
          'orange-end': '#fb923c',
        },
        // 场地专用颜色
        venue: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#ec4899',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          'bg-primary': '#1e1b4b',
          'bg-secondary': '#312e81',
          'text-primary': '#e0e7ff',
          'text-secondary': '#c7d2fe',
        }
      },
      backgroundImage: {
        'gradient-cyber': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-neon': 'linear-gradient(135deg, #ff0080 0%, #00ffff 100%)',
        'gradient-venue': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
        'gradient-venue-dark': 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(255, 0, 128, 0.5)',
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(139, 92, 246, 0.5)',
        'cyber': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'venue': '0 10px 25px -5px rgba(99, 102, 241, 0.3)',
      },
      animation: {
        'pulse-neon': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.8), 0 0 30px rgba(139, 92, 246, 0.6)' },
        }
      }
    },
  },
}

