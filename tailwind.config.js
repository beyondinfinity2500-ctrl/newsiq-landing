/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',       // پوشه اپ (صفحات اصلی)
    './pages/**/*.{js,ts,jsx,tsx,mdx}',     // اگر احیاناً پوشه pages داشتید
    './components/**/*.{js,ts,jsx,tsx,mdx}', // پوشه کامپوننت‌ها
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
