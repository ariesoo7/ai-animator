import { useEffect, useRef } from "react";
import { NeatGradient } from "@firecms/neat";

const c = (color: string) => ({ color, enabled: true });

const config = {
  colors: [c("#0f0431"), c("#61440b"), c("#073e44"), c("#091f5c"), c("#5c4708")],
  speed: 4, horizontalPressure: 4, verticalPressure: 6,
  waveFrequencyX: 1, waveFrequencyY: 1, waveAmplitude: 1,
  secondaryWaveEnabled: false, secondaryWaveFrequencyX: 3, secondaryWaveFrequencyY: 3,
  secondaryWaveAmplitude: 5, secondaryWaveSpeed: 0.6, secondaryWaveAngle: 1,
  shadows: 3, highlights: 0, colorBrightness: 1.15, colorSaturation: 0,
  wireframe: false, antialias: false, colorBlending: 4,
  backgroundColor: "#003FFF", backgroundAlpha: 1,
  grainScale: 0, grainSparsity: 0, grainIntensity: 0, grainSpeed: 0,
  resolution: 1, yOffset: 0, yOffsetWaveMultiplier: 3.2, yOffsetColorMultiplier: 3.5,
  yOffsetFlowMultiplier: 4, flowDistortionA: 3.1, flowDistortionB: 2.4,
  flowScale: 1.5, flowEase: 0.31, flowEnabled: true,
  enableProceduralTexture: false, transparentTextureVoid: false, textureMode: "bitmap",
  bakeEdgeSoftness: 1, textureVoidLikelihood: 0.06, textureVoidWidthMin: 10,
  textureVoidWidthMax: 500, textureBandDensity: 0.8, textureColorBlending: 0.06,
  textureSeed: 333, textureEase: 0.65, proceduralBackgroundColor: "#444006",
  textureShapeTriangles: 20, textureShapeCircles: 15, textureShapeBars: 15,
  textureShapeSquiggles: 10, domainWarpEnabled: false, domainWarpIntensity: 0.6,
  domainWarpScale: 3, vignetteIntensity: 0.85, vignetteRadius: 0.65,
  fresnelEnabled: true, fresnelPower: 3.7, fresnelIntensity: 0.7, fresnelColor: "#3a0606",
  iridescenceEnabled: true, iridescenceIntensity: 0.35, iridescenceSpeed: 3.9,
  prismEdgeEnabled: false, prismEdgeIntensity: 0.5, prismEdgeThinness: 3,
  prismEdgeSpread: 1, prismEdgeSpeed: 0.5, prismEdgeRipple: 1,
  bloomIntensity: 0.8, bloomThreshold: 0.9, chromaticAberration: 4,
  shapeType: "plane", shapeRotationX: 0, shapeRotationY: 0, shapeRotationZ: 0,
  shapeAutoRotateSpeedX: 0, shapeAutoRotateSpeedY: 0, sphereRadius: 15,
  torusRadius: 15, torusTube: 5, cylinderRadius: 10, cylinderHeight: 40,
  planeBend: 0, planeTwist: 0, silhouetteFade: 0.25, cylinderFade: 0.08, ribbonFade: 0.05,
  flatShading: true, cameraLock: true, cameraX: 0, cameraY: 0, cameraZ: 0,
  cameraRotationX: 0, cameraRotationY: 0, cameraRotationZ: 0, cameraZoom: 1,
};

export default function Background() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    // config is cast because the library's exact option types vary between versions
    const g = new NeatGradient({ ref: ref.current, ...(config as object) } as any);
    return () => g.destroy();
  }, []);
  return <canvas ref={ref} id="gradient" className="bg-canvas" />;
}
