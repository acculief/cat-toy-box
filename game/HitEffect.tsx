import React from "react";
import { Circle, Group, Skia, Path } from "@shopify/react-native-skia";

export interface HitParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
  color: string;
  lifetime: number;
}

let nextId = 0;

export function spawnHitParticles(
  x: number,
  y: number,
  color: string,
  count: number = 8
): HitParticle[] {
  const particles: HitParticle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const speed = 200 + Math.random() * 300;
    particles.push({
      id: nextId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 4 + Math.random() * 6,
      opacity: 1,
      color,
      lifetime: 0,
    });
  }
  return particles;
}

export function tickHitParticles(
  particles: HitParticle[],
  dt: number
): HitParticle[] {
  const alive: HitParticle[] = [];
  for (const p of particles) {
    const np = { ...p };
    np.lifetime += dt;
    np.x += np.vx * dt;
    np.y += np.vy * dt;
    np.vx *= 0.95;
    np.vy *= 0.95;
    np.vy += 200 * dt; // gravity
    np.opacity = Math.max(0, 1 - np.lifetime / 0.6);
    np.r = Math.max(0, np.r - dt * 6);
    if (np.opacity > 0 && np.r > 0) alive.push(np);
  }
  return alive;
}

interface HitEffectProps {
  particles: HitParticle[];
}

export function HitEffectLayer({ particles }: HitEffectProps) {
  return (
    <>
      {particles.map((p) => (
        <Circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={p.r}
          color={p.color}
          opacity={p.opacity}
        />
      ))}
    </>
  );
}

// Score pop-up data
export interface ScorePop {
  id: number;
  x: number;
  y: number;
  text: string;
  opacity: number;
  lifetime: number;
  scale: number;
}

let nextPopId = 0;

export function spawnScorePop(
  x: number,
  y: number,
  combo: number
): ScorePop {
  const text = combo > 1 ? `${combo} combo!` : "+1";
  return {
    id: nextPopId++,
    x,
    y: y - 20,
    text,
    opacity: 1,
    lifetime: 0,
    scale: combo > 1 ? 1.2 + Math.min(combo * 0.1, 0.8) : 1,
  };
}

export function tickScorePops(pops: ScorePop[], dt: number): ScorePop[] {
  const alive: ScorePop[] = [];
  for (const p of pops) {
    const np = { ...p };
    np.lifetime += dt;
    np.y -= 80 * dt; // float up
    np.opacity = Math.max(0, 1 - np.lifetime / 0.8);
    if (np.opacity > 0) alive.push(np);
  }
  return alive;
}
