"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductGallery({ images }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef(null);
  const imageNodes = images.edges.map((edge) => edge.node);

  if (imageNodes.length === 0) {
    return (
      <div className="aspect-[4/5] rounded bg-muted flex items-center justify-center text-muted-foreground">
        No image available
      </div>
    );
  }

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  return (
    <div className="space-y-4">
      {/* Main image with zoom */}
      <div
        ref={containerRef}
        className="relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded bg-muted"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative h-full w-full"
          >
            <Image
              src={imageNodes[selectedIndex].url}
              alt={imageNodes[selectedIndex].altText || "Product image"}
              fill
              className="object-cover transition-transform duration-300"
              style={{
                transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                transform: isZoomed ? "scale(1.8)" : "scale(1)",
              }}
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnails */}
      {imageNodes.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {imageNodes.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded transition-all duration-200 ${
                selectedIndex === index
                  ? "ring-2 ring-warm ring-offset-2 ring-offset-background"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={image.url}
                alt={image.altText || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
