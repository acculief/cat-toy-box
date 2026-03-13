import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, View, StyleSheet } from "react-native";
import {
  Canvas,
  Circle,
  Path,
  Shadow,
  Group,
  Skia,
  RadialGradient,
  vec,
} from "@shopify/react-native-skia";
import { GameHUD } from "./GameHUD";
import { HitEffectLayer } from "./HitEffect";
import { ScorePopLayer } from "./ScorePopLayer";
import { useGameSession } from "./useGameSession";
import { SparkleBackground } from "./backgrounds/SparkleBackground";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const MAX_SPARKLES = 8;

interface Sparkle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
  phase: number;
  speed: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
}

const COLORS = [
  "#FFD700", "#FF69B4", "#00BFFF", "#7CFC00",
  "#FF6347", "#DA70D6", "#FFA500", "#00CED1",
];

function randomSparkle(): Sparkle {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    x: 40 + Math.random() * (SCREEN_W - 80),
    y: 80 + Math.random() * (SCREEN_H - 160),
    targetX: 40 + Math.random() * (SCREEN_W - 80),
    targetY: 80 + Math.random() * (SCREEN_H - 160),
    size: 22 + Math.random() * 22,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: 1 + Math.random() * 3,
    opacity: 0,
    phase: Math.random() * Math.PI * 2,
    speed: 30 + Math.random() * 60,
    color,
    lifetime: 0,
    maxLifetime: 3 + Math.random() * 4,
  };
}

function buildStarPath(size: number): string {
  const points: string[] = [];
  const spikes = 4;
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const r = i % 2 === 0 ? size : size * 0.35;
    points.push(
      i === 0
        ? `M ${Math.cos(angle) * r} ${Math.sin(angle) * r}`
        : `L ${Math.cos(angle) * r} ${Math.sin(angle) * r}`
    );
  }
  return points.join(" ") + " Z";
}

interface SparkleWorldState {
  sparkles: Sparkle[];
  spawnTimer: number;
}

function createWorld(): SparkleWorldState {
  const sparkles: Sparkle[] = [];
  for (let i = 0; i < 4; i++) sparkles.push(randomSparkle());
  return { sparkles, spawnTimer: 0.5 };
}

function tickWorld(state: SparkleWorldState, dt: number): SparkleWorldState {
  const w = {
    sparkles: state.sparkles.map((s) => ({ ...s })),
    spawnTimer: state.spawnTimer - dt,
  };

  if (w.spawnTimer <= 0 && w.sparkles.length < MAX_SPARKLES) {
    w.sparkles.push(randomSparkle());
    w.spawnTimer = 0.8 + Math.random() * 1.5;
  }

  for (let i = w.sparkles.length - 1; i >= 0; i--) {
    const s = w.sparkles[i];
    s.lifetime += dt;

    const fadeIn = 0.5;
    const fadeOut = 0.8;
    if (s.lifetime < fadeIn) {
      s.opacity = s.lifetime / fadeIn;
    } else if (s.lifetime > s.maxLifetime - fadeOut) {
      s.opacity = Math.max(0, (s.maxLifetime - s.lifetime) / fadeOut);
    } else {
      s.opacity = 0.7 + Math.sin(s.phase + s.lifetime * 3) * 0.3;
    }

    s.rotation += s.rotSpeed * dt;

    const dx = s.targetX - s.x;
    const dy = s.targetY - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 5) {
      s.x += (dx / dist) * s.speed * dt;
      s.y += (dy / dist) * s.speed * dt;
    } else {
      s.targetX = 40 + Math.random() * (SCREEN_W - 80);
      s.targetY = 80 + Math.random() * (SCREEN_H - 160);
    }

    s.size += Math.sin(s.lifetime * 4) * dt * 3;

    if (s.lifetime >= s.maxLifetime) w.sparkles.splice(i, 1);
  }

  return w;
}

interface Props {
  onBack?: (hits: number, maxCombo: number) => void;
}

export function SparkleRenderer({ onBack }: Props) {
  const stateRef = useRef(createWorld());
  const lastTimeRef = useRef(Date.now());
  const session = useGameSession();
  const [time, setTime] = useState(0);
  const [render, setRender] = useState<Sparkle[]>([...stateRef.current.sparkles]);

  useEffect(() => {
    let id: number;
    const tick = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      stateRef.current = tickWorld(stateRef.current, dt);
      session.tickEffects(dt);
      setTime((t) => t + dt);
      setRender(stateRef.current.sparkles.map((s) => ({ ...s })));
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const handleTap = useCallback((e: any) => {
    const tx = e.nativeEvent.locationX;
    const ty = e.nativeEvent.locationY;
    session.registerHit(tx, ty, "#DA70D6");

    for (const s of stateRef.current.sparkles) {
      const dx = s.x - tx;
      const dy = s.y - ty;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const angle = Math.atan2(dy, dx);
        s.targetX = Math.max(20, Math.min(SCREEN_W - 20, s.x + Math.cos(angle) * 150));
        s.targetY = Math.max(60, Math.min(SCREEN_H - 60, s.y + Math.sin(angle) * 150));
        s.speed = 250;
        s.rotSpeed = 8;
      }
    }
    for (let i = 0; i < 3; i++) {
      if (stateRef.current.sparkles.length < MAX_SPARKLES + 4) {
        const sp = randomSparkle();
        sp.x = tx + (Math.random() - 0.5) * 30;
        sp.y = ty + (Math.random() - 0.5) * 30;
        sp.maxLifetime = 1.5 + Math.random();
        sp.size = 14 + Math.random() * 16;
        stateRef.current.sparkles.push(sp);
      }
    }
  }, []);

  return (
    <View style={styles.container} onTouchStart={handleTap}>
      <Canvas style={styles.canvas}>
        <SparkleBackground width={SCREEN_W} height={SCREEN_H} time={time} />
        {render.map((s, i) => {
          const starPath = Skia.Path.MakeFromSVGString(buildStarPath(s.size));
          if (!starPath) return null;
          return (
            <Group key={i}>
              <Circle cx={s.x} cy={s.y} r={s.size * 1.8}>
                <RadialGradient
                  c={vec(s.x, s.y)}
                  r={s.size * 1.8}
                  colors={[
                    s.color + Math.round(s.opacity * 60).toString(16).padStart(2, "0"),
                    "transparent",
                  ]}
                />
              </Circle>
              <Group
                transform={[{ translateX: s.x }, { translateY: s.y }, { rotate: s.rotation }]}
                opacity={s.opacity}
              >
                <Path path={starPath} color={s.color} style="fill">
                  <Shadow dx={0} dy={0} blur={8} color={s.color} />
                </Path>
                <Path
                  path={Skia.Path.MakeFromSVGString(buildStarPath(s.size * 0.5))!}
                  color="rgba(255,255,255,0.5)"
                  style="fill"
                />
              </Group>
            </Group>
          );
        })}
        <HitEffectLayer particles={session.particles} />
      </Canvas>
      <ScorePopLayer pops={session.scorePops} />
      {onBack && <GameHUD onBack={() => onBack(session.tapCount, session.maxCombo)} tapCount={session.tapCount} combo={session.combo} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D1A" },
  canvas: { flex: 1 },
});
