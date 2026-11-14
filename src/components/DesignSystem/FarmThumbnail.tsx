import React, { useState } from 'react';
import defaultFarmThumb from '../../assets/images/farm_thumbnail_1790691751269.jpg';

export interface FarmThumbnailProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FarmThumbnail: React.FC<FarmThumbnailProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12 rounded-md',
    md: 'w-16 h-16 rounded-lg',
    lg: 'w-24 h-24 rounded-xl',
  };

  const imageSource = (!hasError && src) ? src : defaultFarmThumb;

  return (
    <div
      className={`relative overflow-hidden shrink-0 border border-[#49AABE]/30 bg-[#031923] ${sizeClasses[size]} ${className}`}
    >
      <img
        src={imageSource}
        alt={alt}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#031923]/60 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};
