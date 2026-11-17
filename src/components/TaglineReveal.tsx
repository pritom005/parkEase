import React, { useEffect, useRef, useState } from 'react';

interface TaglineRevealProps {
  text: string;
}

export const TaglineReveal: React.FC<TaglineRevealProps> = ({ text }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const words = text.split(' ');

  useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setRevealedCount(words.length);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Gradually reveal words one by one
            let index = 0;
            const interval = setInterval(() => {
              index += 1;
              setRevealedCount(index);
              if (index >= words.length) {
                clearInterval(interval);
              }
            }, 75);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [words.length]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div
        ref={containerRef}
        className="max-w-[680px] mx-auto text-center"
      >
        <span className="caption-3 uppercase tracking-wider text-[#4A5148] block mb-3">
          Our Promise to Chattogram Drivers
        </span>
        <h2 className="heading-3 sm:heading-2 font-semibold text-wrap:balance leading-tight">
          {words.map((word, idx) => {
            const isRevealed = idx < revealedCount;
            return (
              <span
                key={idx}
                className="inline-block transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] mr-2"
                style={{
                  color: isRevealed ? '#143426' : '#C9C1B0',
                  opacity: isRevealed ? 1 : 0.35,
                  transform: isRevealed ? 'translateY(0)' : 'translateY(6px)',
                }}
              >
                {word}
              </span>
            );
          })}
        </h2>
      </div>
    </section>
  );
};
