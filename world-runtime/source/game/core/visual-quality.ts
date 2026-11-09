export type VisualQuality = "auto" | "low" | "cinematic";
export function readVisualQuality(value: string | null): VisualQuality {
  return value === "low" || value === "cinematic" ? value : "auto";
}

/**
 * Low-poly presentation. Every tier keeps the ink outline (one cheap screen pass);
 * the expensive extras (bloom, HDR, environment lighting, soft shadows) are only
 * used in Cinematic. Resolution then adapts to the measured frame time.
 */
export function visualProfile(
  quality: VisualQuality,
  mobile: boolean,
  dpr = 1,
) {
  const performance = quality === "low";
  const cinematic = quality === "cinematic";
  const device = Math.max(1, Number.isFinite(dpr) ? dpr : 1);
  return {
    pixelRatio: performance
      ? 0.75
      : Math.min(cinematic ? (mobile ? 1.5 : 1.75) : mobile ? 1.25 : 1.25, device),
    minPixelRatio: performance ? 0.6 : mobile ? 0.7 : 0.8,
    shadows: !performance,
    softShadows: cinematic,
    shadowSize: cinematic && !mobile ? 2048 : 1024,
    postProcessing: true,
    environment: cinematic && !mobile,
    samples: 0,
    bloom: cinematic && !mobile,
    bloomStrength: 0.035,
    exposure: 0.98,
  };
}

/**
 * Drops resolution when frames take too long and restores it when there is
 * headroom. Returns a new pixel ratio, or null when nothing should change.
 */
export function adaptivePixelRatio(max: number, min: number) {
  let current = max,
    average = 16.7,
    samples = 0,
    cooldown = 90;
  return (frameMs: number) => {
    if (!Number.isFinite(frameMs) || frameMs <= 0 || frameMs > 250) return null;
    average += (frameMs - average) * 0.05;
    samples++;
    if (--cooldown > 0 || samples < 60) return null;
    let next = current;
    if (average > 24 && current > min) next = Math.max(min, +(current - 0.15).toFixed(2));
    else if (average < 15 && current < max) next = Math.min(max, +(current + 0.1).toFixed(2));
    if (next === current) return null;
    current = next;
    cooldown = 120;
    return next;
  };
}

export function physicalSurface(colour: string) {
  const glass = new Set([
    "#243b49",
    "#182d3a",
    "#1c2430",
    "#aacbd0",
    "#152d3b",
    "#29444a",
    "#a9cfce",
  ]);
  return glass.has(colour.toLowerCase())
    ? { roughness: 0.24, metalness: 0.32, envMapIntensity: 0.75 }
    : { roughness: 0.84, metalness: 0.025, envMapIntensity: 0.25 };
}

/** Small optional camera accents; no physical 4DX hardware integration. */
export function immersiveMotion(
  seconds: number,
  walking: boolean,
  speed: number,
  enabled: boolean,
  reduced: boolean,
) {
  if (
    !enabled ||
    reduced ||
    !Number.isFinite(seconds) ||
    !Number.isFinite(speed)
  )
    return { rise: 0, bank: 0 };
  const drive = Math.min(1, Math.abs(speed) / 200);
  return {
    rise:
      Math.sin(seconds * (drive > 0 ? 17 : 8)) *
      (drive > 0 ? 0.012 * drive : walking ? 0.016 : 0),
    bank: Math.sin(seconds * 2) * 0.002 * drive,
  };
}

/** Match colour and depth passes in the curved world, including instancing/skinning. */
export function curvedVertexShader(source: string) {
  return source
    .replace(
      "#include <common>",
      "#include <common>\nuniform vec3 uFocus;\nuniform vec2 uBend;",
    )
    .replace(
      "#include <project_vertex>",
      `vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
  mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
vec4 bw = modelMatrix * mvPosition;
float bz = bw.z - uFocus.z;
float bx = bw.x - uFocus.x;
bw.y -= bz * bz * uBend.x + bx * bx * uBend.y;
mvPosition = viewMatrix * bw;
gl_Position = projectionMatrix * mvPosition;`,
    )
    .replace(
      "#include <worldpos_vertex>",
      `#include <worldpos_vertex>
#if defined(USE_ENVMAP) || defined(DISTANCE) || defined(USE_SHADOWMAP) || defined(USE_TRANSMISSION) || NUM_SPOT_LIGHT_COORDS > 0
float curveZ = worldPosition.z - uFocus.z;
float curveX = worldPosition.x - uFocus.x;
worldPosition.y -= curveZ * curveZ * uBend.x + curveX * curveX * uBend.y;
#endif`,
    );
}
