let safelist = [
  'tw-btn-outline-primary',
  'tw-btn',
  'tw-bg-secondary',
  'tw-tooltip-top',
  'tw-tooltip-right',
  'tw-tooltip-bottom',
  'tw-tooltip-left',
];

// Whitelisting level options from ListItem component
for (let i = 0; i < 100; i++) {
  safelist.push(`tw-pl-[${2 + (i || 0) * 1}rem`);
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'tw-',
  content: [
    './src/pages/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/elements/**/*.{js,jsx,ts,tsx}',
    './src/templates/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        '965px': { max: '965px' },
        '50rem': { max: '50rem' },
      },
      colors: {
        'light-grey': 'rgba(0,0,0,.03)',
        'border-grey': 'rgba(0,0,0,.125)',
        'disable-grey': '#dee2e6',
        'primary-blue': '#0d6efd',
        'dark-grey': '#6c757d',
        'deep-blue': '#0a58ca',
        'secondary-grey': 'rgba(108,117,125,1)',
        'text-light-grey': 'rgba(248,249,250,1)',
        'border-light-grey': '#d9deee',
        'default-gray': 'rgb(128, 128, 128)',
        danger: '#dc3545',
        'gray-900': '#212529',
        'light-orange': '#ec9982',
        'list-gray': '#5c6975',
        'light-blue': 'rgb(230,236,241)',
      },
      boxShadow: {
        card: '0 2px 5px 0px #e3e5ec',
      },
      transitionProperty: {
        btn: 'color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out',
      },
      zIndex: {
        2: '2',
      },
      borderWidth: {
        2.5: '2.5px',
      },
      padding: {
        0.8: '0.8rem',
      },
      fontFamily: {
        karla: 'Karla, sans-serif',
      },
    },
  },
  plugins: [],
  safelist: safelist,
};
