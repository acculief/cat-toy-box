import React from "react";
import { Circle, Group, Path, Skia } from "@shopify/react-native-skia";

interface Props {
  width: number;
  height: number;
  time: number;
}

// Underwater scene with light rays and gentle wave caustics
export function FishBackground({ width, height, time }: Props) {
  // Light rays from top
  const rays: React.JSX.Element[] = [];
  for (let i = 0; i < 5; i++) {
    const cx = width * 0.15 + i * width * 0.18;
    const sway = Math.sin(time * 0.4 + i * 1.5) * 30;
    const topW = 20 + i * 5;
    const botW = 60 + i * 15;
    const opacity = 0.04 + Math.sin(time * 0.3 + i * 0.9) * 0.02;

    const rayPath = Skia.Path.MakeFromSVGString(
      `M ${cx - topW / 2 + sway} 0
       L ${cx - botW / 2 + sway * 0.5} ${height}
       L ${cx + botW / 2 + sway * 0.5} ${height}
       L ${cx + topW / 2 + sway} 0 Z`
    );
    if (rayPath) {
      rays.push(
        <Path
          key={`r${i}`}
          path={rayPath}
          color={`rgba(120, 200, 255, ${opacity})`}
          style="fill"
        />
      );
    }
  }

  // Caustic circles (light patterns on the "floor")
  const caustics: React.JSX.Element[] = [];
  for (let i = 0; i < 15; i++) {
    const x = ((i * 257 + 13) % 1000) / 1000 * width;
    const y = height * 0.5 + ((i * 389 + 7) % 1000) / 1000 * height * 0.45;
    const r = 8 + (i % 5) * 4;
    const pulse = Math.sin(time * 1.5 + i * 1.1) * 0.5 + 0.5;
    const opacity = 0.03 + pulse * 0.03;

    caustics.push(
      <Circle
        key={`c${i}`}
        cx={x + Math.sin(time * 0.5 + i) * 5}
        cy={y}
        r={r * (0.8 + pulse * 0.4)}
        color={`rgba(100, 200, 255, ${opacity})`}
      />
    );
  }

  // Tiny floating particles (plankton)
  const plankton: React.JSX.Element[] = [];
  for (let i = 0; i < 12; i++) {
    const baseX = ((i * 173 + 41) % 1000) / 1000 * width;
    const baseY = ((i * 349 + 89) % 1000) / 1000 * height;
    const dx = Math.sin(time * 0.4 + i * 2.1) * 10;
    const dy = Math.cos(time * 0.3 + i * 1.7) * 8 - time * 3 % height;
    const y = ((baseY + dy) % height + height) % height;

    plankton.push(
      <Circle
        key={`p${i}`}
        cx={baseX + dx}
        cy={y}
        r={1.5}
        color="rgba(180, 220, 255, 0.15)"
      />
    );
  }

  return (
    <Group>
      {rays}
      {caustics}
      {plankton}
    </Group>
  );
}
