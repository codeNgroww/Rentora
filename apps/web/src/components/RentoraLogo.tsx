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
  variant = 'dark',
}: RentoraLogoProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      {/* Emerald Fluid Ring Icon from screenshot */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 8px rgba(18, 163, 112, 0.25))' }}
      >
        <defs>
          <linearGradient id="emerald-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="40%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="emerald-glow" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Outer fluid torus / loop */}
        <circle
          cx="22"
          cy="22"
          r="16"
          stroke="url(#emerald-ring-grad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="90 20"
          transform="rotate(-30 22 22)"
        />

        {/* Inner dynamic orbital curve */}
        <path
          d="M14 26C16 30 22 32 27 29C32 26 33 20 29 16C26 13 20 13 16 17"
          stroke="url(#emerald-glow)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Vibrant Emerald Core Node */}
        <circle cx="22" cy="22" r="3.2" fill="#10b981" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: `${textSize}px`,
                fontWeight: 800,
                letterSpacing: '-0.3px',
                color: variant === 'light' ? '#ffffff' : '#0f172a',
                fontFamily: 'inherit',
                lineHeight: 1.1,
              }}
            >
              Rentora
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '6px',
                background: '#e6f7f0',
                border: '1px solid #a7f3d0',
                color: '#059669',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
              }}
            >
              UAE
            </span>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 500,
              color: variant === 'light' ? 'rgba(255,255,255,0.7)' : '#64748b',
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
              marginTop: '1px',
            }}
          >
            Smart Property Cloud
          </span>
        </div>
      )}
    </div>
  );
}
