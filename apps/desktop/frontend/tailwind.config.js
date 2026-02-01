/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // 核心：更深邃的背景与更具冲力的点缀色
          primary: {
            DEFAULT: '#FFD200',
            hover: '#FFDF40',
            low: 'rgba(255, 210, 0, 0.1)', // 用于呼吸灯底色
          },
          secondary: '#121316', // 更接近终末地的深舱色
          sub: '#1A1B1F',      // 模块背景色
          accent: '#B2E600',   // 升级/精炼绿
          'text-main': '#F2F2F2',
          muted: '#666666',    // 装饰线颜色
          'industrial-blue': '#007ACC', // 辅助科技蓝
        },
        fontFamily: {
          // 建议在 index.html 引入：<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Barlow:wght@600;800&display=swap" rel="stylesheet">
          sans: ['Barlow', 'Inter', 'system-ui', 'sans-serif'], // 略窄的字体更具工业感
          mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        },
        keyframes: {
          breath: {
            '0%, 100%': { opacity: '0.3', transform: 'scaleX(0.95)' },
            '50%': { opacity: '1', transform: 'scaleX(1)' },
          },
          'scan-line': {
            '0%': { transform: 'translateY(-100%)' },
            '100%': { transform: 'translateY(100%)' },
          }
        },
        animation: {
          breath: 'breath 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'scan-fast': 'scan-line 3s linear infinite',
        },
        backgroundImage: {
          // 模拟屏幕微弱的横纹感
          'scan-pattern': 'linear-gradient(rgba(18, 19, 22, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        }
      },
    },
    plugins: [],
  }