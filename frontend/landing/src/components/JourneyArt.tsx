import { asset } from '../lib/assets';

type JourneyArtProps = {
  file: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

/**
 * Journey step artwork. The intrinsic size is passed in per image so the
 * browser reserves the right box before the file arrives, which keeps the
 * sticky stack from reflowing mid-scroll.
 */
export function JourneyArt({ file, alt, width, height, className = '' }: JourneyArtProps) {
  return (
    <img
      src={asset(`/images/${file}.png`)}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={`block w-full ${className}`}
    />
  );
}
