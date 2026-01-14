import type { Metadata, Viewport } from 'next';
import {
  Inter,
  Poppins,
  JetBrains_Mono,
  Outfit,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Montserrat,
  Lato,
  Open_Sans,
  Assistant,
  Heebo,
  Rubik,
  Varela_Round,
  Secular_One,
  Amatic_SC,
  Roboto,
  Raleway,
  Nunito,
  Merriweather,
  Oswald,
  Quicksand,
  Work_Sans,
  DM_Sans,
  Crimson_Text,
  Frank_Ruhl_Libre,
  Miriam_Libre,
  Alef,
  Tinos,
  Arimo,
  Suez_One,
} from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});
const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
  display: 'swap',
});
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans', display: 'swap' });

// Additional English Fonts
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });
const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-merriweather',
  display: 'swap',
});
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald', display: 'swap' });
const quicksand = Quicksand({ subsets: ['latin'], variable: '--font-quicksand', display: 'swap' });
const workSans = Work_Sans({ subsets: ['latin'], variable: '--font-work-sans', display: 'swap' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });
const crimsonText = Crimson_Text({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-crimson-text',
  display: 'swap',
});

// Hebrew Fonts
const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  variable: '--font-assistant',
  display: 'swap',
});
const heebo = Heebo({ subsets: ['hebrew', 'latin'], variable: '--font-heebo', display: 'swap' });
const rubik = Rubik({ subsets: ['hebrew', 'latin'], variable: '--font-rubik', display: 'swap' });
const varelaRound = Varela_Round({
  subsets: ['hebrew', 'latin'],
  weight: '400',
  variable: '--font-varela',
  display: 'swap',
});
const secularOne = Secular_One({
  subsets: ['hebrew', 'latin'],
  weight: '400',
  variable: '--font-secular',
  display: 'swap',
});
const amaticSc = Amatic_SC({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amatic',
  display: 'swap',
});

// Additional Hebrew Fonts
const frankRuhlLibre = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  variable: '--font-frank-ruhl',
  display: 'swap',
});
const miriamLibre = Miriam_Libre({
  subsets: ['hebrew', 'latin'],
  weight: '400',
  variable: '--font-miriam',
  display: 'swap',
});
const alef = Alef({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '700'],
  variable: '--font-alef',
  display: 'swap',
});
const tinos = Tinos({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '700'],
  variable: '--font-tinos',
  display: 'swap',
});
const arimo = Arimo({ subsets: ['hebrew', 'latin'], variable: '--font-arimo', display: 'swap' });
const suezOne = Suez_One({
  subsets: ['hebrew', 'latin'],
  weight: '400',
  variable: '--font-suez-one',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CartShift Studio',
  description: 'Expert Shopify & WordPress development agency',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0f4f8' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      suppressHydrationWarning
      className={`
        ${inter.variable} ${poppins.variable} ${jetbrainsMono.variable} ${outfit.variable} ${roboto.variable}
        ${playfair.variable} ${plusJakarta.variable} ${montserrat.variable} ${lato.variable} ${openSans.variable}
        ${raleway.variable} ${nunito.variable} ${merriweather.variable} ${oswald.variable} ${quicksand.variable} ${workSans.variable} ${dmSans.variable} ${crimsonText.variable}
        ${assistant.variable} ${heebo.variable} ${rubik.variable} ${varelaRound.variable} ${secularOne.variable} ${amaticSc.variable}
        ${frankRuhlLibre.variable} ${miriamLibre.variable} ${alef.variable} ${tinos.variable} ${arimo.variable} ${suezOne.variable}
    `}
    >
      <body className="font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
