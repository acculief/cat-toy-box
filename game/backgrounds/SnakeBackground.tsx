import React from "react";
import { Circle, Group, Line, Path, Skia, vec } from "@shopify/react-native-skia";

interface Props {
  width: number;
  height: number;
  time: number;
}

// Dark forest floor with fallen leaves, moss patches, and tiny mushrooms
export function SnakeBackground({ width, height, time }: Props) {
  const seed = 73;

  // Moss patches - subtle green circles
  const mosses: React.JSX.Element[] = [];
  for (let i = 0; i < 20; i++) {
    const x = ((i * 197 + seed) % 1000) / 1000 * width;
    const y = ((i * 431 + seed) % 1000) / 1000 * height;
    const r = 8 + (i % 5) * 6;
    const alpha = 0.06 + (i % 4) * 0.015;
    mosses.push(
      <Circle
        key={`m${i}`}
        cx={x}
        cy={y}
        r={r}
        color={`rgba(${60 + (i % 30)}, ${100 + (i % 40)}, ${50 + (i % 20)}, ${alpha})`}
      />
    );
  }

  // Fallen leaves - small oval shapes in brown/amber tones
  const leaves: React.JSX.Element[] = [];
  for (let i = 0; i < 25; i++) {
    const x = ((i * 283 + seed) % 1000) / 1000 * width;
    const y = ((i * 547 + seed) % 1000) / 1000 * height;
    const rot = ((i * 137) % 360) * (Math.PI / 180);
    const sway = Math.sin(time * 0.3 + i * 1.2) * 0.05;
    const r = i % 3 === 0 ? 0 : (i % 3 === 1 ? 1 : 2);
    const browns = [
      "rgba(139, 90, 43, 0.18)",
      "rgba(160, 120, 50, 0.15)",
      "rgba(180, 140, 60, 0.12)",
    ];
    const leafW = 5 + (i % 3) * 2;
    const leafH = 3 + (i % 2) * 1.5;
    const leafPath = Skia.Path.MakeFromSVGString(
      `M ${x - leafW} ${y}
       Q ${x} ${y - leafH} ${x + leafW} ${y}
       Q ${x} ${y + leafH} ${x - leafW} ${y} Z`
    );
    if (leafPath) {
      leaves.push(
        <Group key={`l${i}`} transform={[{ translateX: x }, { translateY: y }, { rotate: rot + sway }, { translateX: -x }, { translateY: -y }]}>
          <Path path={leafPath} color={browns[r]} style="fill" />
          {/* Leaf vein */}
          <Line
            p1={vec(x - leafW * 0.7, y)}
            p2={vec(x + leafW * 0.7, y)}
            color={`rgba(100, 70, 30, 0.08)`}
            style="stroke"
            strokeWidth={0.5}
          />
        </Group>
      );
    }
  }

  // Tiny mushrooms - stem + cap shapes
  const mushrooms: React.JSX.Element[] = [];
  for (let i = 0; i < 8; i++) {
    const x = ((i * 371 + seed * 2) % 1000) / 1000 * width;
    const y = ((i * 613 + seed * 2) % 1000) / 1000 * height;
    const stemH = 5 + (i % 3) * 2;
    const capR = 3 + (i % 3) * 1.5;
    const alpha = 0.12 + (i % 3) * 0.03;
    const capColor = i % 2 === 0
      ? `rgba(180, 140, 100, ${alpha})`
      : `rgba(160, 80, 60, ${alpha})`;

    mushrooms.push(
      <Group key={`mu${i}`}>
        {/* Stem */}
        <Line
          p1={vec(x, y)}
          p2={vec(x, y - stemH)}
          color={`rgba(200, 180, 160, ${alpha * 0.8})`}
          style="stroke"
          strokeWidth={1.5}
          strokeCap="round"
        />
        {/* Cap */}
        <Circle
          cx={x}
          cy={y - stemH}
          r={capR}
          color={capColor}
        />
        {/* Cap highlight */}
        <Circle
          cx={x - capR * 0.3}
          cy={y - stemH - capR * 0.2}
          r={capR * 0.3}
          color={`rgba(255, 255, 255, ${alpha * 0.4})`}
        />
      </Group>
    );
  }

  // Small dirt specks
  const specks: React.JSX.Element[] = [];
  for (let i = 0; i < 35; i++) {
    const x = ((i * 317 + seed) % 1000) / 1000 * width;
    const y = ((i * 523 + seed) % 1000) / 1000 * height;
    const r = 0.8 + (i % 3) * 0.5;
    specks.push(
      <Circle
        key={`sp${i}`}
        cx={x}
        cy={y}
        r={r}
        color={`rgba(80, 60, 40, ${0.06 + (i % 4) * 0.02})`}
      />
    );
  }

  return (
    <Group>
      {mosses}
      {specks}
      {leaves}
      {mushrooms}
    </Group>
  );
}
