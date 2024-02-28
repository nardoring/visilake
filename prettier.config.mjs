/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').options} */
const config = {
  plugins: ['prettier-plugin-tailwindcss'],

  bracketSameLine: false,
  bracketSpacing: true,
  jsxSingleQuote: true,
  printWidth: 80,
  semi: true,
  singleAttributePerLine: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
};

export default config;
