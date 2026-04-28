module.exports = {
  darkMode: 'class',
  content: ['./App.jsx', './main.jsx', './styles.css'],
  theme: {
    extend: {
      colors: {
        paper: '#FDFCF7',
        ink: '#002B36',
        burgundy: '#A63D40',
        gold: '#CC9B21',
        slate: '#4A5459',
        cyan: '#21B8CC',
        green: '#4ECC21',
      },
      fontFamily: {
        sans: ['"Segoe UI Semilight"', 'Inter', 'system-ui'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
      },
    },
  },
  plugins: [],
};
