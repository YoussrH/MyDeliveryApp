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
        blue: {
          100: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        green: {
          100: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
        },
        yellow: {
          100: '#fef9c3',
          500: '#eab308',
          600: '#ca8a04',
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
        orange:{
          100: '#FEF0EA',
          200: '#FF7C44',
          300:'#FF6F31',
          600:'#FD683D'
        }
      },
    },
  },
});

export default tw;