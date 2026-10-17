'use client';

import React from 'react';
import Image from 'next/image';

interface UodLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const UodLogo: React.FC<UodLogoProps> = ({
  className = '',
  size = 'md',
  showText = false
}) => {
  const dimensions = {
    sm: { width: 32, height: 32, textClass: 'text-sm' },
    md: { width: 44, height: 44, textClass: 'text-base' },
    lg: { width: 64, height: 64, textClass: 'text-xl' },
    xl: { width: 88, height: 88, textClass: 'text-2xl' }
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center rounded-xl overflow-hidden bg-white/5 p-1 border border-white/10 shadow-md">
        <Image
          src="/logo-uod.png"
          alt="Universidad Odontológica Dominicana (UOD)"
          width={dimensions.width}
          height={dimensions.height}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-extrabold tracking-tight text-white ${dimensions.textClass}`}>
            UOD
          </span>
          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
            Univ. Odontológica Dominicana
          </span>
        </div>
      )}
    </div>
  );
};
