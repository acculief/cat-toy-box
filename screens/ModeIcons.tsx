import React from "react";
import {
  Canvas,
  Circle,
  Path,
  Skia,
  Shadow,
  Group,
  RadialGradient,
  vec,
  LinearGradient,
} from "@shopify/react-native-skia";

interface IconProps {
  size: number;
}

export function BugIcon({ size }: IconProps) {
  const cx = size / 2;
  const cy = size / 2;
  const bodyW = size * 0.22;
  const bodyH = size * 0.32;

  const bodyPath = Skia.Path.MakeFromSVGString(
    `M ${cx} ${cy - bodyH / 2}
     Q ${cx + bodyW} ${cy - bodyH * 0.3} ${cx + bodyW * 0.9} ${cy + bodyH * 0.1}
     Q ${cx + bodyW * 0.7} ${cy + bodyH / 2} ${cx} ${cy + bodyH / 2}
     Q ${cx - bodyW * 0.7} ${cy + bodyH / 2} ${cx - bodyW * 0.9} ${cy + bodyH * 0.1}
     Q ${cx - bodyW} ${cy - bodyH * 0.3} ${cx} ${cy - bodyH / 2} Z`
  );

  const legs: string[] = [];
  for (let i = 0; i < 3; i++) {
    const y = cy - bodyH * 0.15 + i * bodyH * 0.25;
    const spread = bodyW * 0.8 + i * 2;
    legs.push(`M ${cx + bodyW * 0.7} ${y} Q ${cx + spread + 8} ${y - 4} ${cx + spread + 12} ${y - 8 + i * 3}`);
    legs.push(`M ${cx - bodyW * 0.7} ${y} Q ${cx - spread - 8} ${y - 4} ${cx - spread - 12} ${y - 8 + i * 3}`);
  }
  const legPath = Skia.Path.MakeFromSVGString(legs.join(" "));

  const antL = `M ${cx - 4} ${cy - bodyH / 2} Q ${cx - 12} ${cy - bodyH * 0.7} ${cx - 16} ${cy - bodyH * 0.8}`;
  const antR = `M ${cx + 4} ${cy - bodyH / 2} Q ${cx + 12} ${cy - bodyH * 0.7} ${cx + 16} ${cy - bodyH * 0.8}`;
  const antPath = Skia.Path.MakeFromSVGString(antL + " " + antR);

  // Grass blades
  const grass: string[] = [];
  for (let i = 0; i < 8; i++) {
    const gx = size * 0.08 + i * size * 0.12;
    const gh = size * 0.12 + (i % 3) * size * 0.06;
    const sway = (i % 2 === 0 ? 3 : -2);
    grass.push(`M ${gx} ${size} Q ${gx + sway} ${size - gh} ${gx + sway * 1.5} ${size - gh - 4}`);
  }
  const grassPath = Skia.Path.MakeFromSVGString(grass.join(" "));

  return (
    <Canvas style={{ width: size, height: size }}>
      {/* Ground gradient */}
      <Circle cx={cx} cy={size + size * 0.3} r={size * 0.7} color="rgba(255,255,255,0.08)" />

      {/* Grass */}
      {grassPath && (
        <Path path={grassPath} color="rgba(255,255,255,0.2)" style="stroke" strokeWidth={1.5} strokeCap="round" />
      )}

      {/* Shadow */}
      <Circle cx={cx} cy={cy + bodyH / 2 + 4} r={bodyW * 0.8} color="rgba(0,0,0,0.1)" />

      {/* Legs */}
      {legPath && (
        <Path path={legPath} color="rgba(255,255,255,0.7)" style="stroke" strokeWidth={1.5} strokeCap="round" />
      )}

      {/* Antennae */}
      {antPath && (
        <Path path={antPath} color="rgba(255,255,255,0.7)" style="stroke" strokeWidth={1.2} strokeCap="round" />
      )}
      <Circle cx={cx - 16} cy={cy - bodyH * 0.8} r={1.5} color="rgba(255,255,255,0.6)" />
      <Circle cx={cx + 16} cy={cy - bodyH * 0.8} r={1.5} color="rgba(255,255,255,0.6)" />

      {/* Body */}
      {bodyPath && (
        <Path path={bodyPath} color="rgba(255,255,255,0.85)" style="fill">
          <Shadow dx={0} dy={2} blur={4} color="rgba(0,0,0,0.15)" />
        </Path>
      )}

      {/* Shell line */}
      <Path
        path={Skia.Path.MakeFromSVGString(`M ${cx} ${cy - bodyH * 0.35} L ${cx} ${cy + bodyH * 0.35}`)!}
        color="rgba(0,0,0,0.1)"
        style="stroke"
        strokeWidth={0.8}
      />

      {/* Eyes */}
      <Circle cx={cx - 5} cy={cy - bodyH * 0.15} r={2} color="rgba(0,0,0,0.4)" />
      <Circle cx={cx + 5} cy={cy - bodyH * 0.15} r={2} color="rgba(0,0,0,0.4)" />
    </Canvas>
  );
}

export function LaserIcon({ size }: IconProps) {
  const cx = size / 2;
  const cy = size / 2;
  const dotR = size * 0.09;
  const glowR = size * 0.3;

  return (
    <Canvas style={{ width: size, height: size }}>
      {/* Floor reflection */}
      <Circle cx={cx} cy={size * 0.85} r={size * 0.3} color="rgba(255,255,255,0.04)" />

      {/* Scattered light particles */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const px = cx + Math.cos(i * 1.05) * size * 0.3;
        const py = cy + Math.sin(i * 1.05) * size * 0.28;
        return <Circle key={i} cx={px} cy={py} r={1} color="rgba(255,200,200,0.3)" />;
      })}

      {/* Outer glow */}
      <Circle cx={cx} cy={cy} r={glowR}>
        <RadialGradient
          c={vec(cx, cy)}
          r={glowR}
          colors={["rgba(255,255,255,0.25)", "rgba(255,100,100,0)"]}
        />
      </Circle>

      {/* Mid glow */}
      <Circle cx={cx} cy={cy} r={glowR * 0.5}>
        <RadialGradient
          c={vec(cx, cy)}
          r={glowR * 0.5}
          colors={["rgba(255,255,255,0.4)", "rgba(255,200,200,0)"]}
        />
      </Circle>

      {/* Core dot */}
      <Circle cx={cx} cy={cy} r={dotR} color="#fff">
        <Shadow dx={0} dy={0} blur={8} color="rgba(255,180,180,0.8)" />
      </Circle>

      {/* Highlight */}
      <Circle cx={cx - 2} cy={cy - 2} r={dotR * 0.4} color="rgba(255,255,255,0.9)" />

      {/* Trail dots */}
      {[1, 2, 3, 4, 5].map((i) => (
        <Circle
          key={i}
          cx={cx - i * 5 - 3}
          cy={cy + i * 3 + 2}
          r={dotR * (1 - i * 0.15)}
          color={`rgba(255,255,255,${0.3 - i * 0.05})`}
        />
      ))}
    </Canvas>
  );
}

export function FishIcon({ size }: IconProps) {
  const cx = size / 2;
  const cy = size / 2;
  const fishLen = size * 0.4;

  const bodyPath = Skia.Path.MakeFromSVGString(
    `M ${cx + fishLen * 0.45} ${cy}
     Q ${cx + fishLen * 0.3} ${cy - fishLen * 0.25} ${cx - fishLen * 0.05} ${cy - fishLen * 0.2}
     Q ${cx - fishLen * 0.35} ${cy - fishLen * 0.12} ${cx - fishLen * 0.4} ${cy}
     Q ${cx - fishLen * 0.35} ${cy + fishLen * 0.12} ${cx - fishLen * 0.05} ${cy + fishLen * 0.2}
     Q ${cx + fishLen * 0.3} ${cy + fishLen * 0.25} ${cx + fishLen * 0.45} ${cy} Z`
  );

  const tailPath = Skia.Path.MakeFromSVGString(
    `M ${cx - fishLen * 0.35} ${cy}
     L ${cx - fishLen * 0.55} ${cy - fishLen * 0.2}
     L ${cx - fishLen * 0.55} ${cy + fishLen * 0.2} Z`
  );

  // Bubbles
  const bubbles = [
    { x: cx + fishLen * 0.5, y: cy - 8, r: 2.5 },
    { x: cx + fishLen * 0.55, y: cy - 16, r: 2 },
    { x: cx + fishLen * 0.48, y: cy - 22, r: 1.5 },
  ];

  // Light rays from top
  const rays: string[] = [];
  for (let i = 0; i < 3; i++) {
    const rx = size * 0.2 + i * size * 0.3;
    const topW = 4;
    const botW = 12 + i * 4;
    rays.push(`M ${rx - topW / 2} 0 L ${rx - botW / 2} ${size} L ${rx + botW / 2} ${size} L ${rx + topW / 2} 0 Z`);
  }
  const rayPath = Skia.Path.MakeFromSVGString(rays.join(" "));

  return (
    <Canvas style={{ width: size, height: size }}>
      {/* Light rays */}
      {rayPath && <Path path={rayPath} color="rgba(255,255,255,0.04)" style="fill" />}

      {/* Caustic circles */}
      <Circle cx={size * 0.2} cy={size * 0.8} r={6} color="rgba(255,255,255,0.06)" />
      <Circle cx={size * 0.7} cy={size * 0.75} r={8} color="rgba(255,255,255,0.05)" />
      <Circle cx={size * 0.5} cy={size * 0.9} r={5} color="rgba(255,255,255,0.04)" />

      {/* Shadow */}
      <Circle cx={cx + 2} cy={cy + 4} r={fishLen * 0.28} color="rgba(0,0,0,0.08)" />

      {/* Tail */}
      {tailPath && (
        <Path path={tailPath} color="rgba(255,255,255,0.6)" style="fill" />
      )}

      {/* Body */}
      {bodyPath && (
        <Path path={bodyPath} color="rgba(255,255,255,0.85)" style="fill">
          <Shadow dx={0} dy={2} blur={5} color="rgba(0,0,0,0.1)" />
        </Path>
      )}

      {/* Fin */}
      <Path
        path={Skia.Path.MakeFromSVGString(
          `M ${cx + fishLen * 0.05} ${cy - fishLen * 0.15}
           Q ${cx} ${cy - fishLen * 0.38} ${cx - fishLen * 0.12} ${cy - fishLen * 0.2}`
        )!}
        color="rgba(255,255,255,0.5)"
        style="stroke"
        strokeWidth={2}
        strokeCap="round"
      />

      {/* Eye */}
      <Circle cx={cx + fishLen * 0.2} cy={cy - fishLen * 0.05} r={3} color="rgba(0,0,0,0.4)" />
      <Circle cx={cx + fishLen * 0.21} cy={cy - fishLen * 0.07} r={1.2} color="rgba(255,255,255,0.6)" />

      {/* Bubbles */}
      {bubbles.map((b, i) => (
        <Circle key={i} cx={b.x} cy={b.y} r={b.r} color="rgba(255,255,255,0.25)" style="stroke" strokeWidth={0.8} />
      ))}
    </Canvas>
  );
}

export function LadybugIcon({ size }: IconProps) {
  const cx = size / 2;
  const cy = size / 2;
  const bodyR = size * 0.2;
  const headR = bodyR * 0.4;

  // Body (round)
  const bodyPath = Skia.Path.MakeFromSVGString(
    `M ${cx - bodyR} ${cy}
     Q ${cx - bodyR} ${cy - bodyR * 0.9} ${cx} ${cy - bodyR}
     Q ${cx + bodyR} ${cy - bodyR * 0.9} ${cx + bodyR} ${cy}
     Q ${cx + bodyR} ${cy + bodyR * 0.9} ${cx} ${cy + bodyR}
     Q ${cx - bodyR} ${cy + bodyR * 0.9} ${cx - bodyR} ${cy} Z`
  );

  // Head
  const headPath = Skia.Path.MakeFromSVGString(
    `M ${cx + bodyR * 0.7} ${cy - headR * 0.7}
     Q ${cx + bodyR + headR * 0.8} ${cy - headR * 0.8} ${cx + bodyR + headR * 0.8} ${cy}
     Q ${cx + bodyR + headR * 0.8} ${cy + headR * 0.8} ${cx + bodyR * 0.7} ${cy + headR * 0.7} Z`
  );

  // Wing line
  const wingLine = Skia.Path.MakeFromSVGString(
    `M ${cx + bodyR * 0.5} ${cy} L ${cx - bodyR * 0.8} ${cy}`
  );

  // Antennae
  const antPath = Skia.Path.MakeFromSVGString(
    `M ${cx + bodyR + headR * 0.3} ${cy - headR * 0.4}
     Q ${cx + bodyR + headR * 1.2} ${cy - headR * 1.5} ${cx + bodyR + headR * 1.5} ${cy - headR * 1.8}
     M ${cx + bodyR + headR * 0.3} ${cy + headR * 0.4}
     Q ${cx + bodyR + headR * 1.2} ${cy + headR * 1.5} ${cx + bodyR + headR * 1.5} ${cy + headR * 1.8}`
  );

  // Spots on body
  const spots = [
    { sx: cx - bodyR * 0.35, sy: cy - bodyR * 0.35, sr: bodyR * 0.16 },
    { sx: cx - bodyR * 0.35, sy: cy + bodyR * 0.35, sr: bodyR * 0.16 },
    { sx: cx + bodyR * 0.1, sy: cy - bodyR * 0.2, sr: bodyR * 0.13 },
    { sx: cx + bodyR * 0.1, sy: cy + bodyR * 0.2, sr: bodyR * 0.13 },
  ];

  // Small flower in background
  const flowerCx = cx - size * 0.28;
  const flowerCy = cy + size * 0.28;
  const flowerR = size * 0.04;

  // Leaf in background
  const leafSvg = `M ${cx + size * 0.25} ${cy + size * 0.35}
    Q ${cx + size * 0.35} ${cy + size * 0.25} ${cx + size * 0.38} ${cy + size * 0.33}
    Q ${cx + size * 0.3} ${cy + size * 0.42} ${cx + size * 0.25} ${cy + size * 0.35} Z`;
  const leafPath = Skia.Path.MakeFromSVGString(leafSvg);

  return (
    <Canvas style={{ width: size, height: size }}>
      {/* Leaf background */}
      {leafPath && (
        <Path path={leafPath} color="rgba(255,255,255,0.12)" style="fill" />
      )}

      {/* Small flower */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2;
        const px = flowerCx + Math.cos(a) * flowerR * 1.2;
        const py = flowerCy + Math.sin(a) * flowerR * 1.2;
        return <Circle key={`fp${i}`} cx={px} cy={py} r={flowerR} color="rgba(255,255,255,0.15)" />;
      })}
      <Circle cx={flowerCx} cy={flowerCy} r={flowerR * 0.6} color="rgba(255,230,150,0.2)" />

      {/* Shadow */}
      <Circle cx={cx + 2} cy={cy + 4} r={bodyR * 0.9} color="rgba(0,0,0,0.1)" />

      {/* Body */}
      {bodyPath && (
        <Path path={bodyPath} color="rgba(255,255,255,0.85)" style="fill">
          <Shadow dx={0} dy={2} blur={4} color="rgba(0,0,0,0.15)" />
        </Path>
      )}

      {/* Spots */}
      {spots.map((s, i) => (
        <Circle key={`sp${i}`} cx={s.sx} cy={s.sy} r={s.sr} color="rgba(0,0,0,0.35)" />
      ))}

      {/* Wing line */}
      {wingLine && (
        <Path path={wingLine} color="rgba(0,0,0,0.15)" style="stroke" strokeWidth={0.8} />
      )}

      {/* Head */}
      {headPath && (
        <Path path={headPath} color="rgba(0,0,0,0.5)" style="fill" />
      )}

      {/* Antennae */}
      {antPath && (
        <Path path={antPath} color="rgba(0,0,0,0.4)" style="stroke" strokeWidth={1} strokeCap="round" />
      )}
      <Circle cx={cx + bodyR + headR * 1.5} cy={cy - headR * 1.8} r={1.2} color="rgba(0,0,0,0.35)" />
      <Circle cx={cx + bodyR + headR * 1.5} cy={cy + headR * 1.8} r={1.2} color="rgba(0,0,0,0.35)" />
    </Canvas>
  );
}

export function SnakeIcon({ size }: IconProps) {
  const cx = size / 2;
  const cy = size / 2;

  // S-curve snake body path
  const bodyPath = Skia.Path.MakeFromSVGString(
    `M ${cx + size * 0.3} ${cy - size * 0.15}
     C ${cx + size * 0.2} ${cy - size * 0.35} ${cx - size * 0.1} ${cy - size * 0.35} ${cx - size * 0.05} ${cy - size * 0.1}
     C ${cx} ${cy + size * 0.1} ${cx + size * 0.15} ${cy + size * 0.15} ${cx + size * 0.05} ${cy + size * 0.3}
     C ${cx - size * 0.05} ${cy + size * 0.42} ${cx - size * 0.25} ${cy + size * 0.35} ${cx - size * 0.3} ${cy + size * 0.2}`
  );

  // Leaf shapes in background
  const leaf1 = Skia.Path.MakeFromSVGString(
    `M ${cx - size * 0.32} ${cy + size * 0.35}
     Q ${cx - size * 0.38} ${cy + size * 0.28} ${cx - size * 0.28} ${cy + size * 0.25}
     Q ${cx - size * 0.22} ${cy + size * 0.32} ${cx - size * 0.32} ${cy + size * 0.35} Z`
  );
  const leaf2 = Skia.Path.MakeFromSVGString(
    `M ${cx + size * 0.25} ${cy + size * 0.32}
     Q ${cx + size * 0.32} ${cy + size * 0.26} ${cx + size * 0.2} ${cy + size * 0.22}
     Q ${cx + size * 0.15} ${cy + size * 0.3} ${cx + size * 0.25} ${cy + size * 0.32} Z`
  );

  // Head position (start of the path)
  const headX = cx + size * 0.3;
  const headY = cy - size * 0.15;

  // Tongue from head
  const tonguePath = Skia.Path.MakeFromSVGString(
    `M ${headX + 3} ${headY}
     L ${headX + 8} ${headY - 1}
     M ${headX + 3} ${headY}
     L ${headX + 8} ${headY + 2}`
  );

  return (
    <Canvas style={{ width: size, height: size }}>
      {/* Background leaves */}
      {leaf1 && <Path path={leaf1} color="rgba(255,255,255,0.08)" style="fill" />}
      {leaf2 && <Path path={leaf2} color="rgba(255,255,255,0.06)" style="fill" />}

      {/* Subtle ground circle */}
      <Circle cx={cx} cy={size * 0.85} r={size * 0.35} color="rgba(255,255,255,0.04)" />

      {/* Shadow */}
      {bodyPath && (
        <Group transform={[{ translateX: 2 }, { translateY: 3 }]}>
          <Path path={bodyPath} color="rgba(0,0,0,0.1)" style="stroke" strokeWidth={6} strokeCap="round" />
        </Group>
      )}

      {/* Snake body */}
      {bodyPath && (
        <Path path={bodyPath} color="rgba(255,255,255,0.75)" style="stroke" strokeWidth={5} strokeCap="round">
          <Shadow dx={0} dy={1} blur={4} color="rgba(0,0,0,0.15)" />
        </Path>
      )}

      {/* Head - slightly larger circle */}
      <Circle cx={headX} cy={headY} r={4.5} color="rgba(255,255,255,0.85)">
        <Shadow dx={0} dy={1} blur={3} color="rgba(0,0,0,0.1)" />
      </Circle>

      {/* Eyes */}
      <Circle cx={headX + 1.5} cy={headY - 2.5} r={1.3} color="rgba(0,0,0,0.5)" />
      <Circle cx={headX + 1.5} cy={headY + 2.5} r={1.3} color="rgba(0,0,0,0.5)" />

      {/* Tongue */}
      {tonguePath && (
        <Path path={tonguePath} color="rgba(255,150,150,0.6)" style="stroke" strokeWidth={0.8} strokeCap="round" />
      )}

      {/* Tail tip thins out naturally via stroke end */}
    </Canvas>
  );
}

export function SparkleIcon({ size }: IconProps) {
  const cx = size / 2;
  const cy = size / 2;

  function starPath(sx: number, sy: number, r: number, spikes: number = 4): string {
    const pts: string[] = [];
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.35;
      const px = sx + Math.cos(angle) * rad;
      const py = sy + Math.sin(angle) * rad;
      pts.push(i === 0 ? `M ${px} ${py}` : `L ${px} ${py}`);
    }
    return pts.join(" ") + " Z";
  }

  const stars = [
    { x: cx, y: cy, r: size * 0.18, color: "rgba(255,255,255,0.9)" },
    { x: cx - size * 0.25, y: cy - size * 0.18, r: size * 0.1, color: "rgba(255,255,255,0.5)" },
    { x: cx + size * 0.22, y: cy + size * 0.2, r: size * 0.08, color: "rgba(255,255,255,0.4)" },
    { x: cx + size * 0.28, y: cy - size * 0.25, r: size * 0.06, color: "rgba(255,255,255,0.35)" },
    { x: cx - size * 0.18, y: cy + size * 0.28, r: size * 0.07, color: "rgba(255,255,255,0.3)" },
  ];

  return (
    <Canvas style={{ width: size, height: size }}>
      {/* Nebula blobs */}
      <Circle cx={cx - size * 0.15} cy={cy + size * 0.1} r={size * 0.2} color="rgba(255,255,255,0.03)" />
      <Circle cx={cx + size * 0.2} cy={cy - size * 0.1} r={size * 0.15} color="rgba(255,255,255,0.04)" />

      {/* Stars with glow */}
      {stars.map((s, i) => {
        const p = Skia.Path.MakeFromSVGString(starPath(s.x, s.y, s.r));
        if (!p) return null;
        return (
          <Group key={i}>
            <Circle cx={s.x} cy={s.y} r={s.r * 1.8}>
              <RadialGradient
                c={vec(s.x, s.y)}
                r={s.r * 1.8}
                colors={[`rgba(255,255,255,${i === 0 ? 0.2 : 0.1})`, "rgba(255,255,255,0)"]}
              />
            </Circle>
            <Path path={p} color={s.color} style="fill">
              {i === 0 && <Shadow dx={0} dy={0} blur={6} color="rgba(255,255,255,0.4)" />}
            </Path>
          </Group>
        );
      })}

      {/* Tiny dots */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const dx = Math.cos(i * 0.9 + 0.5) * size * 0.38;
        const dy = Math.sin(i * 1.3 + 0.3) * size * 0.35;
        return <Circle key={`d${i}`} cx={cx + dx} cy={cy + dy} r={1} color="rgba(255,255,255,0.2)" />;
      })}
    </Canvas>
  );
}
