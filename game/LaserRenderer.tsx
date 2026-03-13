import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, View, StyleSheet } from "react-native";
import { Canvas, Circle, Shadow, RadialGradient, vec } from "@shopify/react-native-skia";
import { GameHUD } from "./GameHUD";
import { HitEffectLayer } from "./HitEffect";
import { ScorePopLayer } from "./ScorePopLayer";
import { useGameSession } from "./useGameSession";
import { LaserBackground } from "./backgrounds/LaserBackground";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const DOT_RADIUS = 28;
const GLOW_RADIUS = 80;
const TRAIL_LENGTH = 14;

interface LaserState {
  x: number; y: number; targetX: number; targetY: number;
  trail: { x: number; y: number }[];
  mode: "drift" | "dash" | "circle" | "pause";
  modeTimer: number; circleAngle: number;
  circleCenterX: number; circleCenterY: number;
}

function randomTarget() {
  return { x: 60 + Math.random() * (SCREEN_W - 120), y: 100 + Math.random() * (SCREEN_H - 200) };
}

function createLaserState(): LaserState {
  const s = randomTarget();
  return { x: s.x, y: s.y, targetX: s.x, targetY: s.y, trail: [], mode: "drift", modeTimer: 2, circleAngle: 0, circleCenterX: SCREEN_W / 2, circleCenterY: SCREEN_H / 2 };
}

function tickLaser(state: LaserState, dt: number): LaserState {
  const s = { ...state, trail: [...state.trail] };
  s.modeTimer -= dt;
  if (s.modeTimer <= 0) {
    const modes: LaserState["mode"][] = ["drift", "dash", "circle", "pause"];
    const next = modes[Math.floor(Math.random() * modes.length)];
    s.mode = next;
    switch (next) {
      case "drift": s.modeTimer = 2 + Math.random() * 3; break;
      case "dash": { s.modeTimer = 0.3 + Math.random() * 0.5; const t = randomTarget(); s.targetX = t.x; s.targetY = t.y; break; }
      case "circle": s.modeTimer = 1.5 + Math.random() * 2; s.circleCenterX = s.x; s.circleCenterY = s.y; s.circleAngle = 0; break;
      case "pause": s.modeTimer = 0.5 + Math.random() * 1.5; break;
    }
  }
  let speed = 0;
  switch (s.mode) {
    case "drift": speed = 120; if (Math.abs(s.x - s.targetX) < 20 && Math.abs(s.y - s.targetY) < 20) { const t = randomTarget(); s.targetX = t.x; s.targetY = t.y; } break;
    case "dash": speed = 800; break;
    case "circle": { const r = 40; s.circleAngle += dt * 4; s.targetX = s.circleCenterX + Math.cos(s.circleAngle) * r; s.targetY = s.circleCenterY + Math.sin(s.circleAngle) * r; speed = 300; break; }
    case "pause": speed = 5; break;
  }
  const dx = s.targetX - s.x, dy = s.targetY - s.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 1) { const mv = Math.min(speed * dt, dist); s.x += (dx / dist) * mv; s.y += (dy / dist) * mv; }
  s.x = Math.max(DOT_RADIUS, Math.min(SCREEN_W - DOT_RADIUS, s.x));
  s.y = Math.max(DOT_RADIUS, Math.min(SCREEN_H - DOT_RADIUS, s.y));
  s.trail.push({ x: s.x, y: s.y });
  if (s.trail.length > TRAIL_LENGTH) s.trail = s.trail.slice(-TRAIL_LENGTH);
  return s;
}

interface Props { onBack?: (hits: number, maxCombo: number) => void; }

export function LaserRenderer({ onBack }: Props) {
  const stateRef = useRef(createLaserState());
  const lastTimeRef = useRef(Date.now());
  const session = useGameSession();
  const [time, setTime] = useState(0);
  const [render, setRender] = useState({ x: stateRef.current.x, y: stateRef.current.y, trail: stateRef.current.trail });

  useEffect(() => {
    let id: number;
    const tick = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      stateRef.current = tickLaser(stateRef.current, dt);
      session.tickEffects(dt);
      setTime((t) => t + dt);
      setRender({ x: stateRef.current.x, y: stateRef.current.y, trail: [...stateRef.current.trail] });
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const handleTap = useCallback((e: any) => {
    const tx = e.nativeEvent.locationX, ty = e.nativeEvent.locationY;
    const dx = stateRef.current.x - tx, dy = stateRef.current.y - ty;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 110) {
      session.registerHit(stateRef.current.x, stateRef.current.y, "#FF4444");
    } else {
      session.registerMiss();
    }
    // Flee away from tap
    const fleeAngle = Math.atan2(dy, dx);
    const fleeDist = 150 + Math.random() * 100;
    stateRef.current.targetX = Math.max(DOT_RADIUS, Math.min(SCREEN_W - DOT_RADIUS, stateRef.current.x + Math.cos(fleeAngle) * fleeDist));
    stateRef.current.targetY = Math.max(DOT_RADIUS, Math.min(SCREEN_H - DOT_RADIUS, stateRef.current.y + Math.sin(fleeAngle) * fleeDist));
    stateRef.current.mode = "dash";
    stateRef.current.modeTimer = 0.3 + Math.random() * 0.2;
  }, []);

  return (
    <View style={styles.container} onTouchStart={handleTap}>
      <Canvas style={styles.canvas}>
        <LaserBackground width={SCREEN_W} height={SCREEN_H} time={time} />
        {render.trail.map((p, i) => {
          const opacity = ((i + 1) / render.trail.length) * 0.3;
          const r = (DOT_RADIUS * (i + 1)) / render.trail.length;
          return <Circle key={i} cx={p.x} cy={p.y} r={r} color={`rgba(255, 30, 30, ${opacity})`} />;
        })}
        <Circle cx={render.x} cy={render.y} r={GLOW_RADIUS}>
          <RadialGradient c={vec(render.x, render.y)} r={GLOW_RADIUS} colors={["rgba(255,50,50,0.4)", "rgba(255,0,0,0)"]} />
        </Circle>
        <Circle cx={render.x} cy={render.y} r={DOT_RADIUS} color="#FF1A1A">
          <Shadow dx={0} dy={0} blur={20} color="rgba(255,0,0,0.8)" />
        </Circle>
        <Circle cx={render.x - 6} cy={render.y - 6} r={9} color="rgba(255,200,200,0.7)" />
        <HitEffectLayer particles={session.particles} />
      </Canvas>
      <ScorePopLayer pops={session.scorePops} />
      {onBack && <GameHUD onBack={() => onBack(session.tapCount, session.maxCombo)} tapCount={session.tapCount} combo={session.combo} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A2E" },
  canvas: { flex: 1 },
});
