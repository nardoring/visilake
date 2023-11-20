import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
        colors: {
        tableColumnFont: '#464F60',
        lightIndigo: "#F7F9FD",
        darkIndigo: "#EBF0FA",
        lightGrey: "#F2F2F2",
        veryLightGrey: "#F9FAFC",
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
