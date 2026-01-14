// Color Palette
export const colors = {
  primary: {
    main: '#8B4513',      // Saddle Brown
    light: '#A0522D',     // Sienna
    dark: '#654321',      // Dark Brown
  },
  secondary: {
    main: '#D4AF37',      // Gold
    light: '#FFD700',     // Golden
    dark: '#B8860B',      // Dark Goldenrod
  },
  cream: {
    main: '#FFF8F0',      // Floral White
    dark: '#F5E6D3',      // Old Lace
  },
  terracotta: '#C85A3E',  // Terracotta
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
}

// Spacing
export const spacing = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-12 md:py-16 lg:py-20',
  card: 'p-6',
  cardSmall: 'p-4',
}

// Typography
export const typography = {
  h1: 'text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900',
  h2: 'text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900',
  h3: 'text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900',
  h4: 'text-lg md:text-xl font-semibold text-gray-900',
  body: 'text-base text-gray-700',
  bodyLarge: 'text-lg text-gray-700',
  small: 'text-sm text-gray-600',
  tiny: 'text-xs text-gray-500',
}

// Shadows
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  card: 'shadow-md hover:shadow-lg transition-shadow',
}

// Borders
export const borders = {
  default: 'border border-gray-200',
  primary: 'border-2 border-primary',
  rounded: 'rounded-lg',
  roundedFull: 'rounded-full',
}

// Buttons (used with Shadcn)
export const buttonStyles = {
  primary: 'bg-primary hover:bg-primary-dark text-white',
  secondary: 'bg-secondary hover:bg-secondary-dark text-white',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
}