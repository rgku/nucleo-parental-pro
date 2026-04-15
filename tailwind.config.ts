import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Trust & Calm
        primary: {
          DEFAULT: '#00464a',
          container: '#006064',
          fixed: '#a6eff3',
          'fixed-dim': '#8ad3d7',
          'on-primary': '#ffffff',
          'on-primary-container': '#8fd8dc',
          'on-primary-fixed': '#002021',
          'on-primary-fixed-variant': '#004f53',
          tint: '#14696d',
        },
        // Secondary - Support
        secondary: {
          DEFAULT: '#546067',
          container: '#d7e4ec',
          fixed: '#d7e4ec',
          'fixed-dim': '#bbc8d0',
          on: '#ffffff',
          'on-container': '#5a666d',
          'on-fixed': '#111d23',
          'on-fixed-variant': '#3c494f',
        },
        // Tertiary - Resolution (positive financial)
        tertiary: {
          DEFAULT: '#004914',
          container: '#00641f',
          fixed: '#9ff79f',
          'fixed-dim': '#83da85',
          on: '#ffffff',
          'on-container': '#88df89',
          'on-fixed': '#002105',
          'on-fixed-variant': '#005318',
        },
        // Surface - Background layers
        surface: {
          DEFAULT: '#f7f9fc',
          dim: '#d8dadd',
          bright: '#f7f9fc',
          variant: '#e0e3e6',
          container: '#eceef1',
          'container-low': '#f2f4f7',
          'container-lowest': '#ffffff',
          'container-high': '#e6e8eb',
          'container-highest': '#e0e3e6',
          tint: '#14696d',
        },
        // On colors
        on: {
          surface: '#191c1e',
          'surface-variant': '#3f4949',
          background: '#191c1e',
          secondary: '#ffffff',
          error: '#ffffff',
          tertiary: '#ffffff',
        },
        // Error (never use bright red)
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          'on': '#ffffff',
          'on-container': '#93000a',
        },
        // Orange Soft - warnings (de-escalation)
        'orange-soft': '#FF7043',
        // Outline
        outline: {
          DEFAULT: '#6f7979',
          variant: '#bec8c9',
        },
        // Inverse
        inverse: {
          surface: '#2d3133',
          'on-surface': '#eff1f4',
          primary: '#8ad3d7',
        },
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.5rem',
        xl: '1.5rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #00464a, #006064)',
        'primary-gradient-hover': 'linear-gradient(135deg, #003c3f, #005052)',
      },
      boxShadow: {
        'card': '0 32px 64px -12px rgba(0,0,0,0.04)',
        'elevated': '0 8px 32px rgba(0,70,74,0.12)',
        'nav': '0 8px 32px rgba(0,70,74,0.1)',
        'ghost': '0 0 0 1px rgba(0,0,0,0.06)',
        'input-focus': '0 0 0 1.5px #00464a',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config