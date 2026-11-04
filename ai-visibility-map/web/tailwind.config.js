export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { slate: { rgp: '#24313A' }, deep: '#141D23', teal: { rgp: '#176F73', l: '#5CC4C8' }, steel: '#5B6B75', cloud: '#F2F5F6', line: '#DCE3E6', amber: { rgp: '#E3A52B' } },
    fontFamily: { serif: ['Spectral', 'Georgia', 'serif'], sans: ['Inter', 'system-ui', 'sans-serif'] }
  } }, plugins: []
}
