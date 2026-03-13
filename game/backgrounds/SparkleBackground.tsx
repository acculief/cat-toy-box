import React from "react";
import { Circle, Group } from "@shopify/react-native-skia";

interface Props {
  width: number;
  height: number;
  time: number;
}

// Starfield with twinkling stars
export function SparkleBackground({ width, height, time }: Props) {
  const stars: React.JSX.Element[] = [];

  for (let i = 0; i < 50; i++) {
    const x = ((i * 211 + 53) % 1000) / 1000 * width;
    const y = ((i * 367 + 29) % 1000) / 1000 * height;
    const baseR = 0.5 + (i % 4) * 0.5;
    const twinkle = Math.sin(time * (1.5 + (i % 7) * 0.3) + i * 2.1);
    const opacity = 0.15 + twinkle * 0.12;
    const r = baseR + twinkle * 0.3;

    stars.push(
      <Circle
        key={`s${i}`}
        cx={x}
        cy={y}
        r={Math.max(0.3, r)}
        color={`rgba(200, 210, 255, ${Math.max(0.03, opacity)})`}
      />
    );
  }

  // A few brighter "nebula" blobs
  const nebulae: React.JSX.Element[] = [];
  for (let i = 0; i < 4; i++) {
    const x = ((i * 317 + 71) % 1000) / 1000 * width;
    const y = ((i * 523 + 43) % 1000) / 1000 * height;
    const pulse = Math.sin(time * 0.2 + i * 1.8) * 0.5 + 0.5;
    const colors = [
      "rgba(100, 50, 180,",
      "rgba(50, 100, 180,",
      "rgba(180, 50, 100,",
      "rgba(50, 150, 130,",
    ];

    nebulae.push(
      <Circle
        key={`n${i}`}
        cx={x + Math.sin(time * 0.15 + i) * 10}
        cy={y + Math.cos(time * 0.1 + i) * 8}
        r={30 + pulse * 15}
        color={`${colors[i]}${(0.03 + pulse * 0.02).toFixed(2)})`}
      />
    );
  }

  return (
    <Group>
      {nebulae}
      {stars}
    </Group>
  );
}
