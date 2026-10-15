import React from 'react';

interface RentoraLogoProps {
  size?: number;
  showText?: boolean;
  textSize?: number;
  variant?: 'light' | 'dark' | 'color';
}

export function RentoraLogo({
  size = 36,
  showText = false,
  textSize = 18,
  variant = 'light',
}: RentoraLogoProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 10px rgba(79, 70, 229, 0.35))' }}
      >
        <defs>
          <linearGradient id="rentora-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <linearGradient id="rentora-pillar" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="60%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#3730a3" />
          </linearGradient>

          <linearGradient id="rentora-loop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>

          <linearGradient id="rentora-kick" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Premium Hexagonal / Squircle Container */}
        <rect
          x="1"
          y="1"
          width="42"
          height="42"
          rx="12"
          fill="url(#rentora-bg-grad)"
          stroke="rgba(129, 140, 248, 0.3)"
          strokeWidth="1.5"
        />

        {/* Isometric Pillar (Building spine / Left stem of 'R') */}
        <path
          d="M11 11H17.5V33H11V11Z"
          fill="url(#rentora-pillar)"
        />
        {/* Beveled Top Facet */}
        <path
          d="M11 11L14.5 8H17.5V11H11Z"
          fill="#c7d2fe"
        />

        {/* Upper Architecture Arch / Loop of 'R' */}
        <path
          d="M17.5 11H26C29.866 11 33 14.134 33 18C33 21.866 29.866 25 26 25H17.5V11Z"
          fill="url(#rentora-loop)"
        />
        {/* Inner Window cutout */}
        <path
          d="M17.5 15.5H25C26.3807 15.5 27.5 16.6193 27.5 18C27.5 19.3807 26.3807 20.5 25 20.5H17.5V15.5Z"
          fill="#0f172a"
        />

        {/* Dynamic Architectural Cantilever Kick (Diagonal leg of 'R') */}
        <path
          d="M21 22.5L30.5 33H24.5L17.5 24.5H21V22.5Z"
          fill="url(#rentora-kick)"
        />

        {/* High-Rise Beacon Accent Node */}
        <circle cx="31" cy="12" r="2.2" fill="#38bdf8" />
        <circle cx="31" cy="12" r="4" stroke="#38bdf8" strokeWidth="0.75" strokeOpacity="0.4" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: `${textSize}px`,
                fontWeight: 800,
                letterSpacing: '-0.4px',
                color: variant === 'dark' ? '#0f172a' : '#ffffff',
                fontFamily: 'inherit',
              }}
            >
              Rentora
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.25), rgba(6, 182, 212, 0.25))',
                border: '1px solid rgba(129, 140, 248, 0.35)',
                color: '#818cf8',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
              }}
            >
              UAE
            </span>
          </div>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 500,
              color: variant === 'dark' ? '#64748b' : '#94a3b8',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
            }}
          >
            Smart Property Cloud
          </span>
        </div>
      )}
    </div>
  );
}
