import { asset } from '../lib/assets';

type ScreenshotProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
};

/**
 * Real product capture. Fixed intrinsic size keeps CLS at zero, and the
 * rounded frame plus hairline matches the page radius lock.
 */
export function Screenshot({ src, alt, width, height, priority = false, className = '' }: ScreenshotProps) {
  return (
    <img
      src={asset(src)}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={`block w-full rounded-panel border border-hairline bg-surface object-cover object-top ${className}`}
    />
  );
}
