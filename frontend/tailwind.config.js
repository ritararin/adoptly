export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#f8f7f2', soft: '#fbfbf8', dim: '#f0f3ed', deep: '#eaeae3' },
        forest: { DEFAULT: '#1f5c48', dark: '#174b3a', mid: '#4e8a6b', tint: '#e8f0e9', wash: '#edf3e9', glow: '#d9e7d9' },
        terracotta: { DEFAULT: '#df805b', dark: '#ae7650', deep: '#784e37', soft: '#f1e3d0' },
        gold: { DEFAULT: '#f5c36a', soft: '#f7cf83', ink: '#73552b' },
        ink: { DEFAULT: '#1e2923', head: '#23342b', muted: '#78847b', faint: '#89928b', whisper: '#a2aaa3', ghost: '#b6bdb7' },
        line: { DEFAULT: '#e5e6df', soft: '#edf0ea', faint: '#f2f3ef' }
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif']
      },
      boxShadow: {
        soft: '0 8px 30px rgba(36,55,43,0.04)',
        lift: '0 14px 44px rgba(36,55,43,0.08)'
      }
    }
  },
  plugins: []
}