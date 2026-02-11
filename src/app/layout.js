import { Inter, Cormorant_Garamond } from "next/font/google";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CartDrawer from "@/components/cart/cart-drawer";
import CartInitializer from "@/components/layout/cart-initializer";
import PageTransition from "@/components/motion/page-transition";
import SubscriptionSDKProvider from "@/components/subscription/sdk-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "LUMIERE | Candle & Home Scent Subscription",
  description:
    "Illuminate your space with handcrafted soy candles and home fragrances, delivered monthly to your door.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cormorant.variable} font-sans`}>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-warm to-transparent" />
        <SubscriptionSDKProvider>
        <CartInitializer />
        <Header />
        <main className="min-h-screen">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        <CartDrawer />
        </SubscriptionSDKProvider>
      </body>
    </html>
  );
}
