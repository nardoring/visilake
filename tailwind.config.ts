import { type Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.tsx'],
  theme: {
    // https://tailwindcss.com/docs/theme
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        indigo: '#1790D0',
        lightIndigo: '#F7F9FD',
        darkIndigo: '#EBF0FA',
        veryDarkBlue: '#1C3E76',

        // Custom colours from Dashboard doc
        // https://github.com/nardoring/project-docs/tree/main/client-docs
        red: '#C9024A',
        green: '#00A13A',
        blue: '#006CD8',
        darkBlue: '#003A78',
        boldBlue: '#005EA1',
        highlightBlue: '#1790D0',
        positiveGreen: '#00A131A',

        lightRed: '#F4CCDB',
        lightGreen: '#CEEEDD',

        // for dark mode
        lightBlue: '#5CACE0',
        lightBlue2: '#9FD2F3',
        veryLightBlue: '#C9E8FB',

        // shades
        darkGrey: '#7E8285',
        lightGrey: '#BFC3C6',
        veryLightGrey: '#F4F7FC',

        // more
        purple: '#005A1',
        orange: '#1790d0',
        pink: '#00A131A',
        olive: '#E6007D',
        yellow: 'BF9000',
        lightYellow: '003A78',
        veryLightYellow: 'FFE699',
        veryVeryLightYellow: 'FFF2CC',
      },
      fontFamily: {
        Nunito: ['Nunito', 'sans'],
      },
    },
    fontSize: {
      sm: '0.8rem',
      base: '1rem',
      xl: '1.25rem',
      '2xl': '1.563rem',
      '3xl': '1.953rem',
      '4xl': '2.441rem',
      '5xl': '3.052rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      '8xl': '6rem',
      '9xl': '8rem',
      '10xl': '10rem',
      '18xl': '16rem',
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
  },
  plugins: [],
} satisfies Config;
