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

// Bright meadow with dense wildflowers, layered grass, and sunlit particles
export function LadybugBackground({ width, height, time }: Props) {
  const seed = 57;
  const elements: React.JSX.Element[] = [];

  // Subtle warm light patches (sunlight through canopy)
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 239 + seed) % 1000) / 1000 * width;
    const cy = ((i * 419 + seed) % 1000) / 1000 * height;
    const rx = 50 + (i % 4) * 25;
    const ry = 40 + (i % 3) * 20;
    const pulse = Math.sin(time * 0.2 + i * 1.5) * 0.015;
    elements.push(
      <Oval
        key={`sun${i}`}
        rect={rect(cx - rx, cy - ry, rx * 2, ry * 2)}
        color={`rgba(255, 245, 200, ${0.06 + pulse})`}
      />
    );
  }

  // Ground patches (soil and moss)
  for (let i = 0; i < 10; i++) {
    const cx = ((i * 311 + seed) % 1000) / 1000 * width;
    const cy = ((i * 467 + seed) % 1000) / 1000 * height;
    const rx = 25 + (i % 5) * 12;
    const ry = 18 + (i % 4) * 8;
    const col = i % 2 === 0
      ? "rgba(110, 140, 80, 0.06)"
      : "rgba(130, 110, 80, 0.05)";
    elements.push(
      <Oval key={`gp${i}`} rect={rect(cx - rx, cy - ry, rx * 2, ry * 2)} color={col} />
    );
  }

  // Back grass layer (short, darker)
  for (let i = 0; i < 45; i++) {
    const x = ((i * 163 + seed) % 1000) / 1000 * width;
    const baseY = height * 0.2 + ((i * 307 + seed) % 1000) / 1000 * height * 0.75;
    const h = 12 + (i % 5) * 4;
    const sway = Math.sin(time * 0.7 + i * 0.9) * 3;
    elements.push(
      <Line
        key={`gb${i}`}
        p1={vec(x, baseY)}
        p2={vec(x + sway, baseY - h)}
        color={`rgba(${75 + (i % 25)}, ${120 + (i % 20)}, ${45 + (i % 15)}, 0.15)`}
        style="stroke"
        strokeWidth={2}
        strokeCap="round"
      />
    );
  }

  // Main grass layer (tall, curved, lush)
  for (let i = 0; i < 65; i++) {
    const x = ((i * 149 + seed) % 1000) / 1000 * width;
    const baseY = height * 0.3 + ((i * 283 + seed) % 1000) / 1000 * height * 0.65;
    const h = 20 + (i % 9) * 6;
    const sway = Math.sin(time * 0.8 + i * 0.6) * 6 + Math.sin(time * 0.4 + i * 1.2) * 3;
    const curve = Math.sin(time * 0.6 + i * 0.3) * 4;
    const alpha = 0.18 + (i % 5) * 0.04;
    const g = 140 + (i % 35);

    const path = Skia.Path.MakeFromSVGString(
      `M ${x} ${baseY} Q ${x + curve} ${baseY - h * 0.5} ${x + sway} ${baseY - h}`
    );
    if (path) {
      elements.push(
        <Path
          key={`gm${i}`}
          path={path}
          color={`rgba(${85 + (i % 30)}, ${g}, ${55 + (i % 20)}, ${alpha})`}
          style="stroke"
          strokeWidth={i % 4 === 0 ? 3 : 2}
          strokeCap="round"
        />
      );
    }
  }

  // Wildflowers (daisy-like with multiple petals)
  const petalPalette = [
    [255, 200, 210], // pink
    [255, 230, 170], // yellow
    [220, 200, 255], // lavender
    [255, 220, 200], // peach
    [200, 230, 255], // light blue
    [255, 180, 180], // rose
  ];

  for (let i = 0; i < 22; i++) {
    const fx = ((i * 197 + seed) % 1000) / 1000 * width;
    const fy = ((i * 431 + seed) % 1000) / 1000 * height;
    const [pr, pg, pb] = petalPalette[i % petalPalette.length];
    const petalR = 3.5 + (i % 4) * 1.5;
    const petalCount = i % 3 === 0 ? 5 : 4;

    // Stem
    const stemH = 10 + (i % 4) * 4;
    const stemSway = Math.sin(time * 0.6 + i * 0.8) * 2;
    elements.push(
      <Line
        key={`fs${i}`}
        p1={vec(fx, fy)}
        p2={vec(fx + stemSway * 0.5, fy + stemH)}
        color="rgba(80, 130, 60, 0.15)"
        style="stroke"
        strokeWidth={1.5}
        strokeCap="round"
      />
    );

    // Petals
    for (let p = 0; p < petalCount; p++) {
      const angle = (p * Math.PI * 2) / petalCount + time * 0.08 + i;
      const px = fx + Math.cos(angle) * petalR * 0.8;
      const py = fy + Math.sin(angle) * petalR * 0.8;
      elements.push(
        <Circle
          key={`fp${i}p${p}`}
          cx={px}
          cy={py}
          r={petalR}
          color={`rgba(${pr}, ${pg}, ${pb}, 0.3)`}
        />
      );
    }
    // Center pistil
    elements.push(
      <Circle
        key={`fc${i}`}
        cx={fx}
        cy={fy}
        r={petalR * 0.45}
        color="rgba(255, 220, 80, 0.4)"
      />
    );
  }

  // Leaf shapes on ground
  for (let i = 0; i < 12; i++) {
    const lx = ((i * 317 + seed) % 1000) / 1000 * width;
    const ly = ((i * 523 + seed) % 1000) / 1000 * height;
    const rot = ((i * 137) % 360) * (Math.PI / 180);
    const leafSize = 14 + (i % 5) * 4;
    const leafSvg = `M 0 0 Q ${leafSize * 0.5} ${-leafSize * 0.35} ${leafSize} 0 Q ${leafSize * 0.5} ${leafSize * 0.35} 0 0 Z`;
    const leafPath = Skia.Path.MakeFromSVGString(leafSvg);
    if (leafPath) {
      elements.push(
        <Group key={`lf${i}`} transform={[{ translateX: lx }, { translateY: ly }, { rotate: rot }]}>
          <Path
            path={leafPath}
            color={`rgba(${90 + (i % 25)}, ${150 + (i % 20)}, ${60 + (i % 15)}, 0.13)`}
            style="fill"
          />
          {/* Leaf vein */}
          <Line
            p1={vec(0, 0)}
            p2={vec(leafSize * 0.9, 0)}
            color={`rgba(70, 120, 50, 0.08)`}
            style="stroke"
            strokeWidth={0.8}
          />
        </Group>
      );
    }
  }

  // Floating pollen / light particles
  for (let i = 0; i < 25; i++) {
    const baseX = ((i * 211 + seed) % 1000) / 1000 * width;
    const baseY = ((i * 389 + seed) % 1000) / 1000 * height;
    const driftX = Math.sin(time * 0.4 + i * 1.3) * 18;
    const driftY = Math.cos(time * 0.25 + i * 0.9) * 12 - time * 2;
    const px = ((baseX + driftX) % (width + 20)) - 10;
    const py = ((baseY + driftY) % (height + 20) + (height + 20)) % (height + 20) - 10;
    const r = 1 + (i % 3) * 0.6;
    const opacity = 0.15 + Math.sin(time * 0.5 + i * 2) * 0.08;

    elements.push(
      <Circle
        key={`po${i}`}
        cx={px}
        cy={py}
        r={r}
        color={`rgba(255, 245, 190, ${opacity})`}
      />
    );
  }

  // Small butterflies (simple wing shapes)
  for (let i = 0; i < 3; i++) {
    const bx = ((i * 337 + seed) % 1000) / 1000 * width;
    const by = ((i * 491 + seed) % 1000) / 1000 * height * 0.6;
    const drift = Math.sin(time * 0.3 + i * 2.1) * 40;
    const bob = Math.sin(time * 1.5 + i * 1.8) * 15;
    const wingFlap = Math.abs(Math.sin(time * 5 + i * 3)) * 4;
    const x = bx + drift;
    const y = by + bob;
    const colors = ["rgba(255,180,200,0.2)", "rgba(200,180,255,0.2)", "rgba(255,220,150,0.2)"];

    elements.push(
      <Group key={`bf${i}`}>
        <Oval
          rect={rect(x - wingFlap - 4, y - 3, wingFlap + 4, 6)}
          color={colors[i % colors.length]}
        />
        <Oval
          rect={rect(x, y - 3, wingFlap + 4, 6)}
          color={colors[i % colors.length]}
        />
        <Circle cx={x} cy={y} r={1} color="rgba(80,60,40,0.15)" />
      </Group>
    );
  }

  return <Group>{elements}</Group>;
}
