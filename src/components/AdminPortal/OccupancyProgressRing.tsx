import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';

interface OccupancyProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  trackColor?: string;
  animationDuration?: number;
}

export const OccupancyProgressRing: React.FC<OccupancyProgressRingProps> = ({
  percentage,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  color,
  trackColor = '#D5CEBF',
  animationDuration = 500
}) => {
  const clampedPercent = Math.min(Math.max(percentage, 0), 100);
  const [displayPercent, setDisplayPercent] = useState<number>(0);

  const radius = size / 2;
  const innerRadius = radius - strokeWidth;
  const outerRadius = radius;

  // Entrance animation: smoothly animate from 0% to clampedPercent on mount / change
  useEffect(() => {
    // Respect reduced motion accessibility
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayPercent(clampedPercent);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Smooth ease-out cubic function: 1 - (1 - t)^3
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(easeOutProgress * clampedPercent);

      setDisplayPercent(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    // Trigger initial frame
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [clampedPercent, animationDuration]);

  // Determine color based on threshold if not explicitly provided
  const ringColor =
    color ||
    (displayPercent >= 85
      ? '#8A1C1C' // High occupancy (red)
      : displayPercent >= 60
      ? '#D97706' // Moderate occupancy (amber)
      : '#1D4A35'); // Low/healthy occupancy (forest green)

  // D3 Arc Generator for background track
  const arcGenerator = d3
    .arc<any>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(strokeWidth / 2);

  const backgroundPath =
    arcGenerator({
      startAngle: 0,
      endAngle: 2 * Math.PI
    }) || '';

  // D3 Arc Generator for active progress using displayPercent
  const progressPath =
    arcGenerator({
      startAngle: 0,
      endAngle: (displayPercent / 100) * 2 * Math.PI
    }) || '';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background Track */}
          <path d={backgroundPath} fill={trackColor} transform={`translate(${radius}, ${radius})`} />

          {/* Active Progress Ring (using D3 arc with animated entrance value) */}
          {displayPercent > 0 && (
            <path
              d={progressPath}
              fill={ringColor}
              transform={`translate(${radius}, ${radius})`}
            />
          )}
        </svg>

        {/* Center Text counting up from 0 to displayPercent */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl sm:text-2xl font-black text-[#143426] leading-none transition-colors">
            {displayPercent}%
          </span>
          {sublabel && (
            <span className="text-[10px] font-semibold text-[#4A5148] uppercase tracking-wider mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      </div>

      {label && (
        <span className="text-xs font-bold text-[#143426] mt-2 text-center">
          {label}
        </span>
      )}
    </div>
  );
};
