import React from "react";
import { Circle, Group, Line, vec } from "@shopify/react-native-skia";

interface Props {
  width: number;
  height: number;
  time: number;
}

// Dark room with faint floor grid and dust particles
export function LaserBackground({ width, height, time }: Props) {
  const gridLines: React.JSX.Element[] = [];
  const spacing = 60;

  // Horizontal grid
  for (let y = spacing; y < height; y += spacing) {
    gridLines.push(
      <Line
        key={`h${y}`}
        p1={vec(0, y)}
        p2={vec(width, y)}
        color="rgba(255,255,255,0.03)"
        style="stroke"
        strokeWidth={0.5}
      />
    );
  }
  // Vertical grid
  for (let x = spacing; x < width; x += spacing) {
    gridLines.push(
      <Line
        key={`v${x}`}
        p1={vec(x, 0)}
        p2={vec(x, height)}
        color="rgba(255,255,255,0.03)"
        style="stroke"
        strokeWidth={0.5}
      />
    );
  }

  // Floating dust particles
  const dust: React.JSX.Element[] = [];
  for (let i = 0; i < 20; i++) {
    const baseX = ((i * 197 + 31) % 1000) / 1000 * width;
    const baseY = ((i * 431 + 67) % 1000) / 1000 * height;
    const driftX = Math.sin(time * 0.3 + i * 1.7) * 20;
    const driftY = Math.cos(time * 0.2 + i * 2.3) * 15;
    const opacity = 0.1 + Math.sin(time * 0.5 + i) * 0.06;

    dust.push(
      <Circle
        key={`d${i}`}
        cx={baseX + driftX}
        cy={baseY + driftY}
        r={1.5}
        color={`rgba(255,255,255,${opacity})`}
      />
    );
  }

  return (
    <Group>
      {gridLines}
      {dust}
    </Group>
  );
}
