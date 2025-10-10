import "./globals.css"
import AuthNavbar from "@/components/auth-navbar"
import Footer from "@/components/Footer"
import ClientOnly from "@/components/client-only"

export const metadata = {
  title: "Eleganza - Premium Fashion",
  description: "Discover the latest in fashion at Eleganza",
  generator: "v0.app",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <ClientOnly>
          <AuthNavbar />
        </ClientOnly>
        {children}
        <Footer />
      </body>
    </html>
  )
}
