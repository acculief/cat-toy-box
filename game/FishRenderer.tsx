import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, View, StyleSheet } from "react-native";
import {
  Canvas,
  Path,
  Shadow,
  Group,
  Circle,
  Skia,
} from "@shopify/react-native-skia";
import { GameHUD } from "./GameHUD";
import { HitEffectLayer } from "./HitEffect";
import { ScorePopLayer } from "./ScorePopLayer";
import { useGameSession } from "./useGameSession";
import { FishBackground } from "./backgrounds/FishBackground";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type FishMode = "swim" | "dart" | "float" | "flee";

interface FishVariant {
  bodyColor: string;
  fleeColor: string;
  accentColor: string;
  fleeAccent: string;
  length: number;
  baseSpeed: number;
  hitColor: string;
}

const FISH_VARIANTS: FishVariant[] = [
  {
    // Orange koi - the original
    bodyColor: "#F4A460",
    fleeColor: "#E8832A",
    accentColor: "#E8832A",
    fleeAccent: "#CC5500",
    length: 110,
    baseSpeed: 90,
    hitColor: "#2980B9",
  },
  {
    // Blue tropical
    bodyColor: "#5DADE2",
    fleeColor: "#2E86C1",
    accentColor: "#3498DB",
    fleeAccent: "#1A5276",
    length: 80,
    baseSpeed: 120,
    hitColor: "#3498DB",
  },
  {
    // Pink/red goldfish
    bodyColor: "#F1948A",
    fleeColor: "#E74C3C",
    accentColor: "#E74C3C",
    fleeAccent: "#B03A2E",
    length: 95,
    baseSpeed: 100,
    hitColor: "#E74C3C",
  },
];

interface FishState {
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  speed: number;
  mode: FishMode;
  modeTimer: number;
  tailPhase: number;
  variant: number;
  bubbles: { x: number; y: number; r: number; opacity: number; vy: number }[];
}

function createFish(variant: number): FishState {
  const v = FISH_VARIANTS[variant];
  return {
    x: SCREEN_W * 0.2 + Math.random() * SCREEN_W * 0.6,
    y: SCREEN_H * 0.2 + Math.random() * SCREEN_H * 0.6,
    angle: Math.random() * Math.PI * 2,
    targetAngle: 0,
    speed: v.baseSpeed,
    mode: "swim",
    modeTimer: 2 + Math.random() * 2,
    tailPhase: Math.random() * Math.PI * 2,
    variant,
    bubbles: [],
  };
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function tickFish(s: FishState, dt: number): FishState {
  const v = FISH_VARIANTS[s.variant];
  const f = { ...s, bubbles: s.bubbles.map((b) => ({ ...b })) };

  f.modeTimer -= dt;
  if (f.modeTimer <= 0) {
    const modes: FishMode[] = ["swim", "swim", "dart", "float"];
    f.mode = modes[Math.floor(Math.random() * modes.length)];
    switch (f.mode) {
      case "swim":
        f.modeTimer = 2 + Math.random() * 3;
        f.targetAngle = f.angle + (Math.random() - 0.5) * Math.PI;
        f.speed = v.baseSpeed * (0.8 + Math.random() * 0.5);
        break;
      case "dart":
        f.modeTimer = 0.4 + Math.random() * 0.3;
        f.targetAngle = Math.random() * Math.PI * 2;
        f.speed = 400;
        break;
      case "float":
        f.modeTimer = 1 + Math.random() * 2;
        f.speed = 15;
        break;
    }
  }

  const diff = normalizeAngle(f.targetAngle - f.angle);
  const turnSpeed = f.mode === "dart" ? 12 : 3;
  const maxTurn = turnSpeed * dt;
  if (Math.abs(diff) < maxTurn) {
    f.angle = f.targetAngle;
  } else {
    f.angle += Math.sign(diff) * maxTurn;
  }

  if (f.mode === "swim") {
    f.targetAngle += Math.sin(f.tailPhase * 0.5) * dt * 0.3;
  }

  f.x += Math.cos(f.angle) * f.speed * dt;
  f.y += Math.sin(f.angle) * f.speed * dt;

  // Bounce off screen edges
  const margin = v.length * 0.6;
  let bounced = false;
  if (f.x < margin) { f.x = margin; bounced = true; }
  if (f.x > SCREEN_W - margin) { f.x = SCREEN_W - margin; bounced = true; }
  if (f.y < margin) { f.y = margin; bounced = true; }
  if (f.y > SCREEN_H - margin) { f.y = SCREEN_H - margin; bounced = true; }
  if (bounced) {
    f.targetAngle = Math.atan2(SCREEN_H / 2 - f.y, SCREEN_W / 2 - f.x) + (Math.random() - 0.5) * Math.PI * 0.5;
    f.angle = f.targetAngle;
  }

  const tailSpeed = f.mode === "dart" || f.mode === "flee" ? 25 : f.mode === "float" ? 3 : 8;
  f.tailPhase += dt * tailSpeed;

  if (Math.random() < dt * 1.5) {
    f.bubbles.push({
      x: f.x - Math.cos(f.angle) * v.length * 0.3,
      y: f.y - Math.sin(f.angle) * v.length * 0.3,
      r: 4 + Math.random() * 6,
      opacity: 0.5,
      vy: -25 - Math.random() * 35,
    });
  }
  for (let i = f.bubbles.length - 1; i >= 0; i--) {
    f.bubbles[i].y += f.bubbles[i].vy * dt;
    f.bubbles[i].opacity -= dt * 0.5;
    f.bubbles[i].r += dt * 2;
    if (f.bubbles[i].opacity <= 0) f.bubbles.splice(i, 1);
  }

  return f;
}

function buildFishBody(len: number, tailPhase: number): string {
  const tailSwing = Math.sin(tailPhase) * len * 0.18;
  return `M ${len * 0.5} 0
    Q ${len * 0.3} ${-len * 0.25} 0 ${-len * 0.15}
    Q ${-len * 0.3} ${-len * 0.08} ${-len * 0.4} 0
    Q ${-len * 0.3} ${len * 0.08} 0 ${len * 0.15}
    Q ${len * 0.3} ${len * 0.25} ${len * 0.5} 0 Z
    M ${-len * 0.35} 0
    L ${-len * 0.55} ${-len * 0.2 + tailSwing}
    L ${-len * 0.55} ${len * 0.2 + tailSwing}
    Z`;
}

function buildFin(len: number, tailPhase: number): string {
  const finSwing = Math.sin(tailPhase * 1.3) * len * 0.1;
  return `M ${len * 0.1} ${-len * 0.12}
    Q ${len * 0.05} ${-len * 0.3 + finSwing} ${-len * 0.1} ${-len * 0.15}`;
}

function FishSprite({ fish }: { fish: FishState }) {
  const v = FISH_VARIANTS[fish.variant];
  const len = v.length;
  const bodyPath = Skia.Path.MakeFromSVGString(buildFishBody(len, fish.tailPhase));
  const finPath = Skia.Path.MakeFromSVGString(buildFin(len, fish.tailPhase));
  const isFlee = fish.mode === "flee" || fish.mode === "dart";
  const bodyColor = isFlee ? v.fleeColor : v.bodyColor;
  const accentColor = isFlee ? v.fleeAccent : v.accentColor;

  if (!bodyPath || !finPath) return null;

  const eyeR = len * 0.08;
  const pupilR = len * 0.035;

  return (
    <Group transform={[{ translateX: fish.x }, { translateY: fish.y }, { rotate: fish.angle }]}>
      <Group transform={[{ translateX: 5 }, { translateY: 6 }]}>
        <Path path={bodyPath} color="rgba(0,0,0,0.12)" style="fill" />
      </Group>
      <Path path={bodyPath} color={bodyColor} style="fill">
        <Shadow dx={0} dy={3} blur={7} color="rgba(0,0,0,0.18)" />
      </Path>
      <Path path={finPath} color={accentColor} style="stroke" strokeWidth={len * 0.05} strokeCap="round" />
      {/* Eye */}
      <Circle cx={len * 0.3} cy={-len * 0.06} r={eyeR} color="#333" />
      <Circle cx={len * 0.32} cy={-len * 0.08} r={pupilR} color="#fff" />
      {/* Scales hint */}
      <Path
        path={Skia.Path.MakeFromSVGString(
          `M ${len * 0.15} ${-len * 0.05}
           Q ${len * 0.1} 0 ${len * 0.15} ${len * 0.05}
           M 0 ${-len * 0.04}
           Q ${-len * 0.05} 0 0 ${len * 0.04}`
        )!}
        color="rgba(0,0,0,0.08)"
        style="stroke"
        strokeWidth={1.2}
      />
    </Group>
  );
}

const FISH_COUNT = 3;

interface Props {
  onBack?: (hits: number, maxCombo: number) => void;
}

export function FishRenderer({ onBack }: Props) {
  const fishRef = useRef(FISH_VARIANTS.map((_, i) => createFish(i)));
  const lastTimeRef = useRef(Date.now());
  const session = useGameSession();
  const [time, setTime] = useState(0);
  const [render, setRender] = useState(() =>
    fishRef.current.map((f) => ({ ...f, bubbles: [...f.bubbles] }))
  );

  useEffect(() => {
    let id: number;
    const tick = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      for (let i = 0; i < FISH_COUNT; i++) {
        fishRef.current[i] = tickFish(fishRef.current[i], dt);
      }
      session.tickEffects(dt);
      setTime((t) => t + dt);
      setRender(fishRef.current.map((f) => ({ ...f, bubbles: [...f.bubbles] })));
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const handleTap = useCallback((e: any) => {
    const tx = e.nativeEvent.locationX;
    const ty = e.nativeEvent.locationY;
    let hit = false;
    for (let i = 0; i < FISH_COUNT; i++) {
      const f = fishRef.current[i];
      const v = FISH_VARIANTS[f.variant];
      const dx = f.x - tx;
      const dy = f.y - ty;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < v.length * 1.2) {
        if (!hit) session.registerHit(f.x, f.y, v.hitColor);
        hit = true;
        fishRef.current[i] = {
          ...f,
          bubbles: [...f.bubbles],
          mode: "flee" as FishMode,
          targetAngle: Math.atan2(dy, dx),
          angle: Math.atan2(dy, dx),
          speed: 500,
          modeTimer: 0.6,
        };
      }
    }
    if (!hit) session.registerMiss();
  }, []);

  return (
    <View style={styles.container} onTouchStart={handleTap}>
      <Canvas style={styles.canvas}>
        <FishBackground width={SCREEN_W} height={SCREEN_H} time={time} />
        {/* All bubbles */}
        {render.flatMap((f, fi) =>
          f.bubbles.map((b, bi) => (
            <Circle
              key={`${fi}-${bi}`}
              cx={b.x}
              cy={b.y}
              r={b.r}
              color={`rgba(180, 220, 255, ${b.opacity})`}
              style="stroke"
              strokeWidth={1}
            />
          ))
        )}
        {/* All fish */}
        {render.map((f, i) => (
          <FishSprite key={i} fish={f} />
        ))}
        <HitEffectLayer particles={session.particles} />
      </Canvas>
      <ScorePopLayer pops={session.scorePops} />
      {onBack && (
        <GameHUD
          onBack={() => onBack(session.tapCount, session.maxCombo)}
          tapCount={session.tapCount}
          combo={session.combo}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A3A5C" },
  canvas: { flex: 1 },
});
