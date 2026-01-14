interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Rgb | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function mix(color1: Rgb, color2: Rgb, weight: number): Rgb {
  const w = weight / 100;
  const r = Math.round(color1.r * (1 - w) + color2.r * w);
  const g = Math.round(color1.g * (1 - w) + color2.g * w);
  const b = Math.round(color1.b * (1 - w) + color2.b * w);
  return { r, g, b };
}

export function generateThemePalette(
  baseHex: string,
  type: 'primary' | 'accent'
): Record<string, string> {
  const base = hexToRgb(baseHex);
  if (!base) return {};

  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  // Palette generation logic matching the tailwind configuration strategy
  const palette: Record<number, Rgb> = {
    50: mix(base, white, 95),
    100: mix(base, white, 85),
    200: mix(base, white, 70),
    300: mix(base, white, 50),
    400: mix(base, white, 30),
    500: mix(base, white, 10),
    600: base, // Base color is 600
    700: mix(base, black, 10),
    800: mix(base, black, 25),
    900: mix(base, black, 40),
    950: mix(base, black, 60),
  };

  const variables: Record<string, string> = {};

  Object.entries(palette).forEach(([shade, rgb]) => {
    variables[`--color-${type}-${shade}`] = `${rgb.r} ${rgb.g} ${rgb.b}`;
  });

  return variables;
}

export function applyTheme(
  primaryHex?: string,
  accentHex?: string,
  fontFamily?: string,
  borderRadius?: string,
  fontFamilyHe?: string
) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (primaryHex) {
    const primaryPalette = generateThemePalette(primaryHex, 'primary');
    Object.entries(primaryPalette).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }

  if (accentHex) {
    const accentPalette = generateThemePalette(accentHex, 'accent');
    Object.entries(accentPalette).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }

  // Define allowed fonts map
  const fontMap: Record<string, string> = {
    // English fonts
    inter: 'var(--font-inter)',
    roboto: 'var(--font-roboto)',
    outfit: 'var(--font-outfit)',
    playfair: 'var(--font-playfair)',
    'plus-jakarta': 'var(--font-plus-jakarta)',
    montserrat: 'var(--font-montserrat)',
    lato: 'var(--font-lato)',
    'open-sans': 'var(--font-open-sans)',
    raleway: 'var(--font-raleway)',
    nunito: 'var(--font-nunito)',
    merriweather: 'var(--font-merriweather)',
    oswald: 'var(--font-oswald)',
    quicksand: 'var(--font-quicksand)',
    'work-sans': 'var(--font-work-sans)',
    'dm-sans': 'var(--font-dm-sans)',
    'crimson-text': 'var(--font-crimson-text)',

    // Hebrew fonts
    assistant: 'var(--font-assistant)',
    heebo: 'var(--font-heebo)',
    rubik: 'var(--font-rubik)',
    varela: 'var(--font-varela)',
    secular: 'var(--font-secular)',
    amatic: 'var(--font-amatic)',
    'frank-ruhl': 'var(--font-frank-ruhl)',
    miriam: 'var(--font-miriam)',
    alef: 'var(--font-alef)',
    tinos: 'var(--font-tinos)',
    arimo: 'var(--font-arimo)',
    'suez-one': 'var(--font-suez-one)',
  };

  // Set English Font
  if (fontFamily) {
    const fontVal = fontMap[fontFamily] || fontFamily;
    root.style.setProperty('--font-en', fontVal);
  }

  // Set Hebrew Font
  if (fontFamilyHe) {
    const fontVal = fontMap[fontFamilyHe] || fontFamilyHe;
    root.style.setProperty('--font-he', fontVal);
  }

  // Update Main Font based on DOM lang attribute (initial set)
  // Note: CSS rules in globals.css should handle switching based on [lang] attribute, but we can set a default here too.
  // We'll update the global style rule injection to handle dynamic loading if needed, but for now we set variables.

  if (borderRadius) {
    root.style.setProperty('--radius', borderRadius);
  }
}
