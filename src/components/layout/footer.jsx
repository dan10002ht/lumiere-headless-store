import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/motion-wrapper";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <FadeIn>
          {/* Newsletter */}
          <div className="mb-12 text-center">
            <h3 className="font-serif text-2xl font-light tracking-wide">
              Stay Illuminated
            </h3>
            <p className="mt-2 text-sm text-background/60">
              Subscribe for exclusive scents, early access, and candlelit
              inspiration.
            </p>
            <div className="mx-auto mt-6 flex max-w-sm gap-3">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 border-b border-background/30 bg-transparent px-0 py-2 text-sm placeholder:text-background/40 outline-none focus:border-warm transition-colors"
              />
              <Button
                variant="outline"
                className="border-background/30 text-background hover:bg-warm hover:border-warm hover:text-white transition-all"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Gold separator */}
        <div className="mb-12 h-px bg-gradient-to-r from-transparent via-warm/40 to-transparent" />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <h2 className="text-xl font-light tracking-[0.3em] font-serif">
              LUMIERE
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-background/50">
              Handcrafted soy candles and home fragrances, thoughtfully curated
              and delivered to your door.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-background/70">
              Shop
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-background/50 transition-colors hover:text-warm"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/collections"
                  className="text-sm text-background/50 transition-colors hover:text-warm"
                >
                  Collections
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-background/70">
              About
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="text-sm text-background/50">Our Story</span>
              </li>
              <li>
                <span className="text-sm text-background/50">
                  Sustainability
                </span>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-background/70">
              Help
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="text-sm text-background/50">
                  Shipping & Returns
                </span>
              </li>
              <li>
                <span className="text-sm text-background/50">Contact Us</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 h-px bg-background/10" />
        <div className="mt-6 text-center">
          <p className="text-xs text-background/40">
            &copy; {new Date().getFullYear()} LUMIERE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
