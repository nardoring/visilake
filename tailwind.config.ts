import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
        colors: {
        lightGrey: "#F2F2F2",
        lightBlue: "#F4F7FC",
        darkBlue: "#0A3749",
        veryDarkBlue: "#1C3E76"
      },
      fontFamily: {
        'Nunito': ['Nunito', 'sans'],
      },
    },
  },
  plugins: [],
} satisfies Config;
