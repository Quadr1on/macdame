import { Marcellus, Figtree } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

// Display: Marcellus, a flared, inscriptional serif. It reads ceremonial and
// handcrafted without shouting, and it stays crisp over busy fabric photography
// at small sizes, where high-contrast serifs lose their hairlines. It ships in
// a single weight, so hierarchy comes from size, not bold (see globals.css).
const display = Marcellus({ subsets: ['latin'], weight: '400', variable: '--font-marcellus' })

// Body and UI: Figtree, a clean, open sans with real weights for prices,
// buttons and labels.
const body = Figtree({ subsets: ['latin'], variable: '--font-figtree' })

export const metadata = {
  title: 'Macdame - Authentic South Indian Wear',
  description: 'Shop authentic traditional South Indian clothing including sarees, vesti, and more. Quality traditional wear for the modern Indian family.',
  keywords: 'traditional clothing, south indian wear, sarees, vesti, ethnic wear',
}

export default function RootLayout({ children }) {
  return (
    // Font variables sit on <html> so the --type-* tokens declared on :root can
    // resolve them.
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
