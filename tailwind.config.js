module.exports = {
  content: ["./pages/*.{md,njk}", "./posts/*.md", "./_includes/**/*.njk"],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ],
}