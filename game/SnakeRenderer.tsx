import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, View, StyleSheet } from "react-native";
import {
  Canvas,
  Circle,
  Group,
  Line,
  Path,
  Shadow,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { GameHUD } from "./GameHUD";
import { HitEffectLayer } from "./HitEffect";
import { ScorePopLayer } from "./ScorePopLayer";
import { useGameSession } from "./useGameSession";
import { SnakeBackground } from "./backgrounds/SnakeBackground";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const SNAKE_SEGMENT_COUNT = 20;
const SEGMENT_SPACING = 14;
const SNAKE_COUNT = 2;

type SnakeMode = "slither" | "coil" | "dart" | "flee";

interface Segment {
  x: number;
  y: number;
}

interface SnakeVariant {
  headColor: string;
  tailColor: string;
  fleeHead: string;
  fleeTail: string;
  headRadius: number;
}

const SNAKE_VARIANTS: SnakeVariant[] = [
  {
    // Green snake
    headColor: "#2E7D32",
    tailColor: "#66BB6A",
    fleeHead: "#E65100",
    fleeTail: "#FFA726",
    headRadius: 24,
  },
  {
    // Purple snake (slightly smaller)
    headColor: "#5E35B1",
    tailColor: "#B39DDB",
    fleeHead: "#C62828",
    fleeTail: "#EF9A9A",
    headRadius: 20,
  },
];

interface SnakeState {
  headX: number;
  headY: number;
  angle: number;
  targetAngle: number;
  speed: number;
  mode: SnakeMode;
  modeTimer: number;
  slitherPhase: number;
  tongueVisible: boolean;
  tongueTimer: number;
  segments: Segment[];
  coilProgress: number;
  variant: number;
}

function createSnake(variant: number): SnakeState {
  const x = SCREEN_W * 0.3 + Math.random() * SCREEN_W * 0.4;
  const y = SCREEN_H * 0.3 + Math.random() * SCREEN_H * 0.4;
  const angle = Math.random() * Math.PI * 2;
  const segments: Segment[] = [];
  for (let i = 0; i < SNAKE_SEGMENT_COUNT; i++) {
    segments.push({
      x: x - Math.cos(angle) * i * SEGMENT_SPACING,
      y: y - Math.sin(angle) * i * SEGMENT_SPACING,
    });
  }
  return {
    headX: x,
    headY: y,
    angle,
    targetAngle: angle,
    speed: 150,
    mode: "slither",
    modeTimer: 3 + Math.random() * 2,
    slitherPhase: Math.random() * Math.PI * 2,
    tongueVisible: false,
    tongueTimer: 0,
    segments,
    coilProgress: 0,
    variant,
  };
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function tickSnake(s: SnakeState, dt: number): SnakeState {
  const f: SnakeState = {
    ...s,
    segments: s.segments.map((seg) => ({ ...seg })),
  };

  f.modeTimer -= dt;
  if (f.modeTimer <= 0 && f.mode !== "flee") {
    const modes: SnakeMode[] = ["slither", "slither", "slither", "coil", "dart"];
    f.mode = modes[Math.floor(Math.random() * modes.length)];
    f.coilProgress = 0;
    switch (f.mode) {
      case "slither":
        f.modeTimer = 3 + Math.random() * 3;
        f.targetAngle = f.angle + (Math.random() - 0.5) * Math.PI;
        f.speed = 150;
        break;
      case "coil":
        f.modeTimer = 1.5 + Math.random() * 1.5;
        f.speed = 0;
        break;
      case "dart":
        f.modeTimer = 0.5 + Math.random() * 0.4;
        f.targetAngle = Math.random() * Math.PI * 2;
        f.speed = 450;
        break;
    }
  }

  // Tongue flicker
  f.tongueTimer -= dt;
  if (f.tongueTimer <= 0) {
    f.tongueVisible = !f.tongueVisible;
    f.tongueTimer = f.tongueVisible ? 0.1 + Math.random() * 0.1 : 0.3 + Math.random() * 0.6;
  }

  // Turn towards target angle
  const diff = normalizeAngle(f.targetAngle - f.angle);
  const turnSpeed = f.mode === "dart" || f.mode === "flee" ? 10 : 2.5;
  const maxTurn = turnSpeed * dt;
  if (Math.abs(diff) < maxTurn) {
    f.angle = f.targetAngle;
  } else {
    f.angle += Math.sign(diff) * maxTurn;
  }

  // Strong sinusoidal slither on heading — much more waviness
  if (f.mode === "slither") {
    f.targetAngle += Math.sin(f.slitherPhase * 1.2) * dt * 1.8;
  }

  // Move head
  if (f.mode !== "coil") {
    f.headX += Math.cos(f.angle) * f.speed * dt;
    f.headY += Math.sin(f.angle) * f.speed * dt;
  }

  // Bounce off screen edges
  const margin = 30;
  let bounced = false;
  if (f.headX < margin) { f.headX = margin; bounced = true; }
  if (f.headX > SCREEN_W - margin) { f.headX = SCREEN_W - margin; bounced = true; }
  if (f.headY < margin) { f.headY = margin; bounced = true; }
  if (f.headY > SCREEN_H - margin) { f.headY = SCREEN_H - margin; bounced = true; }
  if (bounced) {
    f.targetAngle = Math.atan2(SCREEN_H / 2 - f.headY, SCREEN_W / 2 - f.headX) + (Math.random() - 0.5) * Math.PI * 0.5;
    f.angle = f.targetAngle;
  }

  // Slither phase — faster for more visible undulation
  const phaseSpeed =
    f.mode === "dart" || f.mode === "flee" ? 22 : f.mode === "coil" ? 2 : 12;
  f.slitherPhase += dt * phaseSpeed;

  // Update segments - head is segment 0
  f.segments[0].x = f.headX;
  f.segments[0].y = f.headY;

  if (f.mode === "coil") {
    f.coilProgress = Math.min(f.coilProgress + dt * 2, 1);
    const cp = f.coilProgress;
    for (let i = 1; i < SNAKE_SEGMENT_COUNT; i++) {
      const coilAngle = f.angle + Math.PI + (i / SNAKE_SEGMENT_COUNT) * Math.PI * 3 * cp;
      const coilRadius = (i * SEGMENT_SPACING * 0.4) * cp + SEGMENT_SPACING * (1 - cp);
      const targetX = f.headX + Math.cos(coilAngle) * coilRadius;
      const targetY = f.headY + Math.sin(coilAngle) * coilRadius;
      f.segments[i].x += (targetX - f.segments[i].x) * Math.min(dt * 5, 1);
      f.segments[i].y += (targetY - f.segments[i].y) * Math.min(dt * 5, 1);
    }
  } else {
    // Normal follow with strong wave
    for (let i = 1; i < SNAKE_SEGMENT_COUNT; i++) {
      const prev = f.segments[i - 1];
      const curr = f.segments[i];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > SEGMENT_SPACING) {
        const ratio = SEGMENT_SPACING / dist;
        curr.x = prev.x + dx * ratio;
        curr.y = prev.y + dy * ratio;
      }

      // Stronger perpendicular wave for visible undulation
      if (f.mode === "slither" || f.mode === "flee") {
        const segAngle = Math.atan2(dy, dx);
        const perpX = -Math.sin(segAngle);
        const perpY = Math.cos(segAngle);
        // Much larger amplitude, scaled by position (bigger toward middle)
        const posScale = Math.sin((i / SNAKE_SEGMENT_COUNT) * Math.PI);
        const waveAmp = 14 * posScale * Math.sin(f.slitherPhase + i * 0.5);
        curr.x += perpX * waveAmp * dt * 5;
        curr.y += perpY * waveAmp * dt * 5;
      }
    }
  }

  // Flee mode timeout to slither
  if (f.mode === "flee" && f.modeTimer <= 0) {
    f.mode = "slither";
    f.modeTimer = 2 + Math.random() * 2;
    f.speed = 150;
    f.targetAngle = f.angle + (Math.random() - 0.5) * Math.PI;
  }

  return f;
}

interface RenderSnake {
  segments: Segment[];
  angle: number;
  mode: SnakeMode;
  tongueVisible: boolean;
  variant: number;
}

interface Props {
  onBack?: (hits: number, maxCombo: number) => void;
}

export function SnakeRenderer({ onBack }: Props) {
  const statesRef = useRef(SNAKE_VARIANTS.map((_, i) => createSnake(i)));
  const lastTimeRef = useRef(Date.now());
  const session = useGameSession();
  const [time, setTime] = useState(0);
  const [render, setRender] = useState<RenderSnake[]>(() =>
    statesRef.current.map((s) => ({
      segments: s.segments.map((seg) => ({ ...seg })),
      angle: s.angle,
      mode: s.mode,
      tongueVisible: s.tongueVisible,
      variant: s.variant,
    }))
  );

  useEffect(() => {
    let id: number;
    const tick = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      for (let i = 0; i < SNAKE_COUNT; i++) {
        statesRef.current[i] = tickSnake(statesRef.current[i], dt);
      }
      session.tickEffects(dt);
      setTime((t) => t + dt);
      setRender(
        statesRef.current.map((s) => ({
          segments: s.segments.map((seg) => ({ ...seg })),
          angle: s.angle,
          mode: s.mode,
          tongueVisible: s.tongueVisible,
          variant: s.variant,
        }))
      );
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const handleTap = useCallback((e: any) => {
    const tx = e.nativeEvent.locationX;
    const ty = e.nativeEvent.locationY;

    let hit = false;
    for (let si = 0; si < SNAKE_COUNT; si++) {
      const snake = statesRef.current[si];
      let minDist = Infinity;
      let hitX = 0;
      let hitY = 0;
      for (const seg of snake.segments) {
        const dx = seg.x - tx;
        const dy = seg.y - ty;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          hitX = seg.x;
          hitY = seg.y;
        }
      }

      if (minDist < 80) {
        if (!hit) session.registerHit(hitX, hitY, "#4CAF50");
        hit = true;
        statesRef.current[si] = {
          ...statesRef.current[si],
          segments: statesRef.current[si].segments.map((seg) => ({ ...seg })),
          mode: "flee" as SnakeMode,
          targetAngle: Math.atan2(statesRef.current[si].headY - ty, statesRef.current[si].headX - tx),
          angle: Math.atan2(statesRef.current[si].headY - ty, statesRef.current[si].headX - tx),
          speed: 500,
          modeTimer: 0.7,
        };
      }
    }
    if (!hit) session.registerMiss();
  }, []);

  return (
    <View style={styles.container} onTouchStart={handleTap}>
      <Canvas style={styles.canvas}>
        <SnakeBackground width={SCREEN_W} height={SCREEN_H} time={time} />

        {render.map((snake, si) => {
          const v = SNAKE_VARIANTS[snake.variant];
          const isFlee = snake.mode === "flee";
          const isDart = snake.mode === "dart";
          const headAngle =
            snake.segments.length >= 2
              ? Math.atan2(
                  snake.segments[0].y - snake.segments[1].y,
                  snake.segments[0].x - snake.segments[1].x
                )
              : snake.angle;

          return (
            <Group key={si}>
              {/* Snake body segments - tail to head */}
              {snake.segments
                .slice()
                .reverse()
                .map((seg, reverseIdx) => {
                  const i = SNAKE_SEGMENT_COUNT - 1 - reverseIdx;
                  const t = i / (SNAKE_SEGMENT_COUNT - 1); // 0 = head, 1 = tail
                  const radius = v.headRadius - t * (v.headRadius - 8);

                  // Parse hex colors for interpolation
                  const hc = isFlee ? v.fleeHead : v.headColor;
                  const tc = isFlee ? v.fleeTail : v.tailColor;
                  const hr = parseInt(hc.slice(1, 3), 16);
                  const hg = parseInt(hc.slice(3, 5), 16);
                  const hb = parseInt(hc.slice(5, 7), 16);
                  const tr = parseInt(tc.slice(1, 3), 16);
                  const tg = parseInt(tc.slice(3, 5), 16);
                  const tb = parseInt(tc.slice(5, 7), 16);

                  const r = Math.round(hr + t * (tr - hr));
                  const g = Math.round(hg + t * (tg - hg));
                  const b = Math.round(hb + t * (tb - hb));
                  const color = `rgb(${r}, ${g}, ${b})`;

                  return (
                    <Group key={`${si}-${i}`}>
                      <Circle
                        cx={seg.x + 3}
                        cy={seg.y + 4}
                        r={radius}
                        color="rgba(0,0,0,0.12)"
                      />
                      <Circle cx={seg.x} cy={seg.y} r={radius} color={color}>
                        {i === 0 && (
                          <Shadow dx={0} dy={2} blur={6} color="rgba(0,0,0,0.2)" />
                        )}
                      </Circle>
                      <Circle
                        cx={seg.x - radius * 0.15}
                        cy={seg.y - radius * 0.2}
                        r={radius * 0.5}
                        color="rgba(255,255,255,0.08)"
                      />
                    </Group>
                  );
                })}

              {/* Head details */}
              <Group
                transform={[
                  { translateX: snake.segments[0].x },
                  { translateY: snake.segments[0].y },
                  { rotate: headAngle },
                ]}
              >
                <Circle cx={16} cy={-8} r={5} color="white" />
                <Circle cx={17.5} cy={-8} r={2.5} color="#111" />
                <Circle cx={16} cy={8} r={5} color="white" />
                <Circle cx={17.5} cy={8} r={2.5} color="#111" />

                {snake.tongueVisible && (
                  <Group>
                    <Line
                      p1={vec(24, 0)}
                      p2={vec(34, 0)}
                      color="#C62828"
                      style="stroke"
                      strokeWidth={1.5}
                      strokeCap="round"
                    />
                    <Line
                      p1={vec(34, 0)}
                      p2={vec(38, -4)}
                      color="#C62828"
                      style="stroke"
                      strokeWidth={1.2}
                      strokeCap="round"
                    />
                    <Line
                      p1={vec(34, 0)}
                      p2={vec(38, 4)}
                      color="#C62828"
                      style="stroke"
                      strokeWidth={1.2}
                      strokeCap="round"
                    />
                  </Group>
                )}
              </Group>
            </Group>
          );
        })}

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
  container: { flex: 1, backgroundColor: "#1A2F1A" },
  canvas: { flex: 1 },
});
