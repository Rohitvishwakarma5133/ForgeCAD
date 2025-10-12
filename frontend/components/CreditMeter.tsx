'use client';

import { useEffect, useMemo, useState } from 'react';

interface CreditMeterProps {
  totalCredits: number; // e.g., 100
  usedCredits: number;  // e.g., 23
}

export default function CreditMeter({ totalCredits, usedCredits }: CreditMeterProps) {
  const [animatedUsed, setAnimatedUsed] = useState(0);

  useEffect(() => {
    // animate to target value
    const t = setTimeout(() => setAnimatedUsed(usedCredits), 50);
    return () => clearTimeout(t);
  }, [usedCredits]);

  const radius = 90;
  const cx = 100;
  const cy = 100;
  const circumference = Math.PI * radius; // semicircle length

  const pctRemaining = Math.max(0, Math.min(1, (totalCredits - animatedUsed) / Math.max(1, totalCredits)));
  const dashoffset = circumference * (1 - pctRemaining);
  const pctLabel = Math.round(pctRemaining * 100);

  return (
    <div className="flex items-center justify-center">
      <svg width={220} height={130} viewBox="0 0 200 120" className="overflow-visible">
        {/* Track */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="currentColor"
          className="text-gray-200 dark:text-zinc-800"
          strokeWidth={14}
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="url(#grad)"
          strokeWidth={14}
          strokeLinecap="round"
          style={{ strokeDasharray: `${circumference}px`, strokeDashoffset: `${dashoffset}px`, transition: 'stroke-dashoffset 900ms ease' }}
        />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        {/* Labels */}
        <text x="100" y="65" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100" fontSize="24" fontWeight="700">{pctLabel}%</text>
        <text x="100" y="85" textAnchor="middle" className="fill-gray-500 dark:fill-gray-400" fontSize="10">Credits Remaining</text>
      </svg>
    </div>
  );
}