import { forwardRef, type HTMLAttributes } from "react";

/** SVG refraction filter, mounted once. Referenced by .glass via backdrop-filter. */
export function GlassDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <filter id="liquid-glass" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="3" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="38" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

const Glass = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...rest }, ref) => (
    <div ref={ref} className={`glass ${className}`} {...rest}>
      <div className="glass-content">{children}</div>
    </div>
  )
);
export default Glass;
