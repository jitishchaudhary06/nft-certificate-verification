"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    src: "https://images.unsplash.com/photo-1627556704302-624286467c65?auto=format&fit=crop&w=1400&q=80",
    alt: "Graduates celebrating on campus",
  },
  {
    src: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=80",
    alt: "University students walking on campus",
  },
  {
    src: "https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?auto=format&fit=crop&w=1400&q=80",
    alt: "Academic diploma and credentials",
  },
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-[0_30px_80px_rgba(0,0,0,0.35)] ring-1 ring-white/20">
        {slides.map((slide, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
              i === index ? "scale-100 opacity-100" : "scale-105 opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
          <p className="max-w-[70%] text-sm font-medium text-white/90">{slides[index].alt}</p>
          <div className="flex gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                aria-label={`Show slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* subtle depth frame */}
      <div className="pointer-events-none absolute -bottom-4 -right-4 -z-10 hidden h-full w-full rounded-[1.75rem] border border-white/15 bg-white/5 lg:block" />
    </div>
  );
}
