import React from 'react';

interface LogoProps {
  className?: string; // used for sizing the container
  iconOnly?: boolean;
}

export function PortfyLogo({ className = "h-8", iconOnly = false }: LogoProps) {
  if (iconOnly) {
    return (
      <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="20" fill="#061A32" />
        <path d="M 40 40 L 70 40 L 40 70 Z" fill="#00D2B4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 450 100" className={className} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      {/* PORTFY text with geometric precision */}
      <g fill="#071b34">
        {/* P */}
        <path d="M 30 20 h 35 c 18 0 30 11 30 25 c 0 15 -12 25 -30 25 h -15 v 20 h -20 v -70 z m 20 18 v 15 h 13 c 7 0 11 -4 11 -8 c 0 -4 -4 -7 -11 -7 h -13 z" />
        {/* O */}
        <path d="M 155 55 c 0 22 -16 37 -38 37 c -22 0 -38 -15 -38 -37 c 0 -22 16 -37 38 -37 c 22 0 38 15 38 37 z m -21 0 c 0 -11 -7 -20 -17 -20 c -10 0 -17 9 -17 20 c 0 11 7 20 17 20 c 10 0 17 -9 17 -20 z" />
        {/* R */}
        <path d="M 170 20 h 35 c 18 0 30 11 30 25 c 0 11 -6 19 -16 23 l 18 22 h -24 l -15 -19 h -8 v 19 h -20 v -70 z M 190 38 v 15 h 13 c 7 0 11 -4 11 -8 c 0 -4 -4 -7 -11 -7 h -13 z" />
        {/* T */}
        <path d="M 245 20 h 60 v 18 h -20 v 52 h -20 v -52 h -20 v -18 z" />
        {/* F */}
        <path d="M 315 20 h 50 v 18 h -30 v 10 h 25 v 17 h -25 v 25 h -20 v -70 z" />
        {/* Y */}
        <path d="M 430 20 l -22 35 v 35 h -20 v -35 l -22 -35 h 22 l 10 18 l 10 -18 h 22 z" />
      </g>
      {/* The Teal Triangle over the R */}
      {/* Let's position it specifically replacing the R's counter */}
      <path d="M 190 38 h 18 l -18 15 z" fill="#00c8a5" />
    </svg>
  );
}
