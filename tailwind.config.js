/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
              colors: {
          'cote-ivoire': {
            'primary': '#FF6B35',
            'secondary': '#FF8C42',
            'success': '#27AE60', // Vert GUCE
            'warning': '#F59E0B',
            'danger': '#EF4444',
            'info': '#3B82F6',
            'light': '#F8FAFC',
            'lighter': '#FFFFFF',
            'dark': '#1E293B',
            'darker': '#0F172A',
          },
          'oic': {
            'blue': '#1e40af', // Bleu principal du logo OIC
            'blue-light': '#1d4ed8', // Bleu clair du logo OIC
          }
        },
      backgroundColor: {
        'cote-ivoire': {
          light: '#FFFFFF',
          lighter: '#F8F9FA',
          white: '#FFFFFF',
        }
      },
      borderColor: {
        'cote-ivoire': {
          light: '#FFE4B5',
          medium: '#FFDAB9',
        }
      },
      boxShadow: {
        'cote-ivoire': {
          light: '0 1px 3px 0 rgba(255, 127, 0, 0.1), 0 1px 2px 0 rgba(255, 127, 0, 0.06)',
          medium: '0 4px 6px -1px rgba(255, 127, 0, 0.1), 0 2px 4px -1px rgba(255, 127, 0, 0.06)',
          large: '0 10px 15px -3px rgba(255, 127, 0, 0.1), 0 4px 6px -2px rgba(255, 127, 0, 0.05)',
          xl: '0 20px 25px -5px rgba(255, 127, 0, 0.1), 0 10px 10px -5px rgba(255, 127, 0, 0.04)',
        }
      }
    },
  },
  plugins: [],
};
