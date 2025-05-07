// In your tw.js file (where you create the tw instance)
import { create } from 'twrnc';

// Create the customized `tw` function
const tw = create({
  theme: {
    fontFamily: {
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    extend: {
      colors: {
        violet: {
          100: '#ede9fe',
          600: '#7c3aed',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          500: '#64748b',
          800: '#1e293b',
        },
        red: {
          100: '#fee2e2',
          500: '#ef4444',
          700: '#b91c1c',
        },
      },
    },
  },
});

export default tw;