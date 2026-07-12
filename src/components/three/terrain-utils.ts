// ─────────────────────────────────────────────────────────────────────────────
// Terrain utilities — Gaussian heightfield with peaks, slope ramp, checkpoints.
// ─────────────────────────────────────────────────────────────────────────────

export const GRID_SIZE = 200;
export const WORLD_SIZE = 72;
export const TERRAIN_HEIGHT = 10;

export interface Peak {
  nx: number;
  ny: number;
  sigma: number;
  amplitude: number;
}

export const PEAKS: Peak[] = [
  { nx: 0.42, ny: 0.20, sigma: 0.14, amplitude: 0.55 },
  { nx: 0.22, ny: 0.52, sigma: 0.14, amplitude: 0.50 },
  { nx: 0.66, ny: 0.44, sigma: 0.13, amplitude: 0.60 },
  { nx: 0.749, ny: 0.772, sigma: 0.12, amplitude: 1.0 },
];

export const SADDLE = { nx: 0.44, ny: 0.48, sigma: 0.10, amplitude: -0.3 };

export const SMALL_HILLS: Peak[] = [
  { nx: 0.12, ny: 0.18, sigma: 0.06, amplitude: 0.25 },
  { nx: 0.88, ny: 0.22, sigma: 0.05, amplitude: 0.20 },
  { nx: 0.55, ny: 0.78, sigma: 0.07, amplitude: 0.30 },
  { nx: 0.30, ny: 0.85, sigma: 0.06, amplitude: 0.22 },
  { nx: 0.75, ny: 0.10, sigma: 0.05, amplitude: 0.18 },
  { nx: 0.08, ny: 0.72, sigma: 0.06, amplitude: 0.24 },
  { nx: 0.50, ny: 0.50, sigma: 0.04, amplitude: 0.15 },
];

function gauss(nx: number, ny: number, cx: number, cy: number, sigma: number, amplitude: number): number {
  const dx = nx - cx;
  const dy = ny - cy;
  return amplitude * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
}

export function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function noise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
}

function fbm(x: number, y: number, octaves: number): number {
  let v = 0;
  let a = 0.5;
  for (let i = 0; i < octaves; i++) {
    v += a * noise2D(x, y);
    x *= 2;
    y *= 2;
    a *= 0.5;
  }
  return v;
}

export function sampleH(nx: number, ny: number): number {
  let h = 0;
  const slope = (nx + ny) * 0.5 * 0.45;
  h += slope;
  for (const p of PEAKS) h += gauss(nx, ny, p.nx, p.ny, p.sigma, p.amplitude);
  h += gauss(nx, ny, SADDLE.nx, SADDLE.ny, SADDLE.sigma, SADDLE.amplitude);
  for (const hill of SMALL_HILLS) h += gauss(nx, ny, hill.nx, hill.ny, hill.sigma, hill.amplitude);
  const edgeFade = Math.min(nx, 1 - nx) * 5.5;
  const edgeFadeY = Math.min(ny, 1 - ny) * 5.5;
  h *= Math.min(1, edgeFade, edgeFadeY);
  h += (fbm(nx * 8, ny * 8, 4) - 0.5) * 0.08;
  return Math.max(0, h);
}

export function sampleGrid(ix: number, iy: number): number {
  return sampleH(ix / (GRID_SIZE - 1), iy / (GRID_SIZE - 1));
}

export function toWorld(nx: number, ny: number, h: number): [number, number, number] {
  return [(nx - 0.5) * WORLD_SIZE, h * TERRAIN_HEIGHT, (ny - 0.5) * WORLD_SIZE];
}

export interface Checkpoint {
  id: number;
  nx: number;
  ny: number;
  title: string;
  theme: string;
  subtitle: string;
  description: string;
  accent: string;
}

export const CHECKPOINTS: Checkpoint[] = [
  { id: 0, nx: 0.12, ny: 0.18, title: "Genesis", theme: "Curiosity", subtitle: "Everything starts small.", description: "I found satisfaction in making repetitive task easier through automation. Whether I created small programs or experimented with macros, I enjoyed reducing complex problems into simple, logical parts. It was not just about completing the task, but also about understanding how it worked.", accent: "#8ecae6" },
  { id: 1, nx: 0.42, ny: 0.20, title: "Discovery", theme: "Learning through leverage", subtitle: "Knowledge compounds.", description: "As I learned more about programming, I realized that the biggest breakthroughs did not come from writing more code. It came from studying how other people and companies solved their problems. Every open source repo, article, and project became a new perspective to learn from and build upon.", accent: "#a8dadc" },
  { id: 2, nx: 0.75, ny: 0.10, title: "Challenge", theme: "Reframing", subtitle: "Progress isn't linear.", description: "Eventually, I hit a point where simply working harder did not pay off. More hours did not result in anything meaningful. I learned that real growth required me to challenge my assumptions, rethink how I approached problems, and accept that setbacks are a natural part of learning.", accent: "#b7e4c7" },
  { id: 3, nx: 0.88, ny: 0.22, title: "Growth", theme: "Systems Thinking", subtitle: "Thinking bigger.", description: "At some point, I became comfortable working on larger projects that required careful planning to ensure development went smoothly. New languages and frameworks stopped feeling like obstacles and became just another set of tools. Instead of stressing over individual pieces of code, I began focusing on how the system fit together as a whole.", accent: "#c7e8a0" },
  { id: 4, nx: 0.66, ny: 0.44, title: "Apex", theme: "Beyond Achievement", subtitle: "Achievement wasn't the destination.", description: "Reaching milestones felt rewarding, but they never felt like the end. Every problem I solved uncovered several more. I realized I am not motivated by checking off goals, but by discovering what lay beyond them.", accent: "#ffd6a5" },
  { id: 5, nx: 0.50, ny: 0.50, title: "Transition", theme: "Reflection", subtitle: "The uncomfortable middle.", description: "Without a clear next goal, I felt uncertain on what came next. Instead of rushing into another project, I took time to wonder what kind of work genuinely interests me and what direction I actually want to grow in.", accent: "#ffb3c6" },
  { id: 6, nx: 0.22, ny: 0.52, title: "Reinvention", theme: "Convergence", subtitle: "Returning to the beginning.", description: "Looking back, every stage shared the same foundation: curiosity. Even though the technologies changed, the projects grew larger, and the challenges got more complex, my motivation stayed the same. Growth is never about reaching the final destination but reaching a path to keep exploring.", accent: "#cdb4db" },
  { id: 7, nx: 0.749, ny: 0.772, title: "Present", theme: "Endless Curiosity", subtitle: "Still climbing.", description: "Today, I am less interested in proving what I already know and more excited about discovering what I don't. Every project is another chance to experiment, question my assumptions, and push past my current limits. The journey itself has become the goal.", accent: "#e8d5f5" },
];

const BAND_COLORS: { r: number; g: number; b: number }[] = [
  { r: 0x8e / 255, g: 0xca / 255, b: 0xe6 / 255 },
  { r: 0xa8 / 255, g: 0xda / 255, b: 0xdc / 255 },
  { r: 0xb7 / 255, g: 0xe4 / 255, b: 0xc7 / 255 },
  { r: 0xc7 / 255, g: 0xe8 / 255, b: 0xa0 / 255 },
  { r: 0xff / 255, g: 0xd6 / 255, b: 0xa5 / 255 },
  { r: 0xff / 255, g: 0xb3 / 255, b: 0xc6 / 255 },
  { r: 0xcd / 255, g: 0xb4 / 255, b: 0xdb / 255 },
  { r: 0xe8 / 255, g: 0xd5 / 255, b: 0xf5 / 255 },
];

export function elevationColor(h: number): [number, number, number] {
  const compressed = Math.pow(Math.max(0, Math.min(1, h)), 0.7);
  const bandIdx = compressed * 7;
  const i0 = Math.floor(bandIdx);
  const i1 = Math.min(7, i0 + 1);
  const t = bandIdx - i0;
  const c0 = BAND_COLORS[i0];
  const c1 = BAND_COLORS[i1];
  const brightness = 0.82 + h * 0.28;
  const r = (c0.r + (c1.r - c0.r) * t) * brightness;
  const g = (c0.g + (c1.g - c0.g) * t) * brightness;
  const b = (c0.b + (c1.b - c0.b) * t) * brightness;
  return [r, g, b];
}
