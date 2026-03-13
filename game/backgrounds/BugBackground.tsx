import React from "react";
import {
  Circle,
  Group,
  Line,
  Oval,
  Path,
  Skia,
  rect,
  vec,
} from "@shopify/react-native-skia";

interface Props {
  width: number;
  height: number;
  time: number;
}

// Lush grassy field with dirt patches, stones, and layered grass
export function BugBackground({ width, height, time }: Props) {
  const seed = 42;
  const elements: React.JSX.Element[] = [];

  // Scattered tiny dirt specks and soil grains
  for (let i = 0; i < 60; i++) {
    const x = ((i * 313 + seed) % 1000) / 1000 * width;
    const y = ((i * 517 + seed) % 1000) / 1000 * height;
    const r = 0.5 + (i % 4) * 0.4;
    const col = i % 3 === 0
      ? `rgba(130, 105, 75, ${0.08 + (i % 6) * 0.02})`
      : i % 3 === 1
      ? `rgba(105, 90, 65, ${0.06 + (i % 5) * 0.02})`
      : `rgba(95, 120, 70, ${0.06 + (i % 4) * 0.015})`;
    elements.push(
      <Circle key={`sp${i}`} cx={x} cy={y} r={r} color={col} />
    );
  }

  // A few tiny pebbles (very small, subtle)
  for (let i = 0; i < 5; i++) {
    const sx = ((i * 317 + seed) % 1000) / 1000 * width;
    const sy = ((i * 523 + seed) % 1000) / 1000 * height;
    const r = 1.5 + (i % 3);
    elements.push(
      <Oval
        key={`st${i}`}
        rect={rect(sx - r, sy - r * 0.6, r * 2, r * 1.2)}
        color={`rgba(${145 + (i % 20)}, ${135 + (i % 15)}, ${125 + (i % 15)}, 0.12)`}
      />
    );
  }

  // Back layer grass (shorter, darker)
  for (let i = 0; i < 40; i++) {
    const x = ((i * 173 + seed) % 1000) / 1000 * width;
    const baseY = height * 0.2 + ((i * 291 + seed) % 1000) / 1000 * height * 0.75;
    const h = 10 + (i % 5) * 3;
    const sway = Math.sin(time * 0.8 + i * 1.1) * 2;
    elements.push(
      <Line
        key={`gb${i}`}
        p1={vec(x, baseY)}
        p2={vec(x + sway, baseY - h)}
        color={`rgba(${70 + (i % 30)}, ${110 + (i % 25)}, ${50 + (i % 15)}, 0.18)`}
        style="stroke"
        strokeWidth={2.5}
        strokeCap="round"
      />
    );
  }

  // Front layer grass (taller, brighter, more sway)
  for (let i = 0; i < 70; i++) {
    const x = ((i * 137 + seed) % 1000) / 1000 * width;
    const baseY = height * 0.25 + ((i * 271 + seed) % 1000) / 1000 * height * 0.7;
    const h = 18 + (i % 8) * 6;
    const sway = Math.sin(time * 1.2 + i * 0.8) * 5 + Math.sin(time * 0.5 + i * 1.5) * 2;
    const curve = Math.sin(time * 0.9 + i * 0.4) * 3;
    const alpha = 0.2 + (i % 5) * 0.04;
    const g = 130 + (i % 40);
    const r = 80 + (i % 35);
    const b = 50 + (i % 20);

    // Use a curved path for more natural grass
    const path = Skia.Path.MakeFromSVGString(
      `M ${x} ${baseY} Q ${x + curve} ${baseY - h * 0.6} ${x + sway} ${baseY - h}`
    );
    if (path) {
      elements.push(
        <Path
          key={`gf${i}`}
          path={path}
          color={`rgba(${r}, ${g}, ${b}, ${alpha})`}
          style="stroke"
          strokeWidth={i % 3 === 0 ? 3 : 2}
          strokeCap="round"
        />
      );
    }
  }

  // Tiny clover/weed patches (very small)
  for (let i = 0; i < 7; i++) {
    const cx = ((i * 257 + seed) % 1000) / 1000 * width;
    const cy = ((i * 431 + seed) % 1000) / 1000 * height;
    const size = 2.5 + (i % 3);
    for (let p = 0; p < 3; p++) {
      const angle = (p * Math.PI * 2) / 3 + i * 0.5;
      const px = cx + Math.cos(angle) * size * 0.5;
      const py = cy + Math.sin(angle) * size * 0.5;
      elements.push(
        <Circle
          key={`cl${i}p${p}`}
          cx={px}
          cy={py}
          r={size * 0.4}
          color={`rgba(80, 140, 60, ${0.1 + (i % 3) * 0.02})`}
        />
      );
    }
  }

  // Floating dust motes
  for (let i = 0; i < 15; i++) {
    const baseX = ((i * 193 + seed) % 1000) / 1000 * width;
    const baseY = ((i * 347 + seed) % 1000) / 1000 * height;
    const dx = Math.sin(time * 0.4 + i * 1.7) * 12;
    const dy = Math.cos(time * 0.3 + i * 1.1) * 8;
    const opacity = 0.1 + Math.sin(time * 0.6 + i * 2.3) * 0.06;
    elements.push(
      <Circle
        key={`du${i}`}
        cx={baseX + dx}
        cy={baseY + dy}
        r={1.2 + (i % 2) * 0.5}
        color={`rgba(220, 200, 160, ${opacity})`}
      />
    );
  }

  return <Group>{elements}</Group>;
}
