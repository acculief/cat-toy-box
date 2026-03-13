import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, View, StyleSheet } from "react-native";
import { Canvas, Path, Shadow, Group, Skia } from "@shopify/react-native-skia";
import { BugAIState, createBugAI, tickBugAI, tapBugAI } from "./bugAI";
import { GameHUD } from "./GameHUD";
import { HitEffectLayer } from "./HitEffect";
import { ScorePopLayer } from "./ScorePopLayer";
import { useGameSession } from "./useGameSession";
import { BugBackground } from "./backgrounds/BugBackground";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const BUG_SIZE = 50;
const LEG_LENGTH = 28;
const ANTENNA_LENGTH = 32;
const BUG_COUNT = 3;

function buildBugBody(): string {
  return `M ${-BUG_SIZE * 0.5} 0
    Q ${-BUG_SIZE * 0.5} ${-BUG_SIZE * 0.35} ${-BUG_SIZE * 0.15} ${-BUG_SIZE * 0.4}
    Q ${BUG_SIZE * 0.15} ${-BUG_SIZE * 0.45} ${BUG_SIZE * 0.4} ${-BUG_SIZE * 0.2}
    Q ${BUG_SIZE * 0.55} 0 ${BUG_SIZE * 0.4} ${BUG_SIZE * 0.2}
    Q ${BUG_SIZE * 0.15} ${BUG_SIZE * 0.45} ${-BUG_SIZE * 0.15} ${BUG_SIZE * 0.4}
    Q ${-BUG_SIZE * 0.5} ${BUG_SIZE * 0.35} ${-BUG_SIZE * 0.5} 0 Z`;
}

function buildLegs(phase: number): string {
  const legs: string[] = [];
  for (let i = 0; i < 3; i++) {
    const xOff = -BUG_SIZE * 0.2 + i * BUG_SIZE * 0.25;
    const w = Math.sin(phase + i * 1.2) * 10;
    legs.push(`M ${xOff} ${-BUG_SIZE * 0.3} L ${xOff - 3 + w} ${-BUG_SIZE * 0.3 - LEG_LENGTH}`);
    legs.push(`M ${xOff} ${BUG_SIZE * 0.3} L ${xOff - 3 - w} ${BUG_SIZE * 0.3 + LEG_LENGTH}`);
  }
  return legs.join(" ");
}

function buildAntennae(phase: number): string {
  const w = Math.sin(phase * 1.5) * 7;
  const hx = BUG_SIZE * 0.4;
  return `M ${hx} ${-BUG_SIZE * 0.15} L ${hx + ANTENNA_LENGTH} ${-ANTENNA_LENGTH * 0.7 + w}
          M ${hx} ${BUG_SIZE * 0.15} L ${hx + ANTENNA_LENGTH} ${ANTENNA_LENGTH * 0.7 + w}`;
}

function BugSprite({ x, y, angle, phase, isPanic }: {
  x: number; y: number; angle: number; phase: number; isPanic: boolean;
}) {
  const bodyColor = isPanic ? "#8B0000" : "#2C1810";
  const legColor = isPanic ? "#A52A2A" : "#3D2B1F";
  const bodyPath = Skia.Path.MakeFromSVGString(buildBugBody());
  const legPath = Skia.Path.MakeFromSVGString(buildLegs(phase));
  const antPath = Skia.Path.MakeFromSVGString(buildAntennae(phase));
  if (!bodyPath || !legPath || !antPath) return null;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: angle }]}>
      <Group transform={[{ translateX: 6 }, { translateY: 6 }]}>
        <Path path={bodyPath} color="rgba(0,0,0,0.25)" style="fill" />
      </Group>
      <Path path={legPath} color={legColor} style="stroke" strokeWidth={3} strokeCap="round" />
      <Path path={antPath} color={legColor} style="stroke" strokeWidth={2.5} strokeCap="round" />
      <Path path={bodyPath} color={bodyColor} style="fill">
        <Shadow dx={0} dy={2} blur={5} color="rgba(0,0,0,0.3)" />
      </Path>
    </Group>
  );
}

interface Props {
  onBack?: (hits: number, maxCombo: number) => void;
}

export function BugRenderer({ onBack }: Props) {
  const aisRef = useRef(Array.from({ length: BUG_COUNT }, () => createBugAI(SCREEN_W, SCREEN_H)));
  const lastTimeRef = useRef(Date.now());
  const phasesRef = useRef(Array(BUG_COUNT).fill(0));
  const session = useGameSession();
  const [time, setTime] = useState(0);

  const [bugs, setBugs] = useState(() =>
    aisRef.current.map((ai) => ({
      x: ai.physics.position.x, y: ai.physics.position.y,
      angle: ai.physics.angle, phase: 0, isPanic: false,
    }))
  );

  useEffect(() => {
    let id: number;
    const tick = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      const next = [];
      for (let i = 0; i < BUG_COUNT; i++) {
        aisRef.current[i] = tickBugAI(aisRef.current[i], dt, SCREEN_W, SCREEN_H);
        const ai = aisRef.current[i];
        const spd = ai.machine.current === "panic" ? 700 : ai.machine.current === "pause" ? 0 : 300;
        phasesRef.current[i] += dt * spd * 0.03;
        next.push({
          x: ai.physics.position.x, y: ai.physics.position.y,
          angle: ai.physics.angle, phase: phasesRef.current[i],
          isPanic: ai.machine.current === "panic",
        });
      }
      session.tickEffects(dt);
      setTime((t) => t + dt);
      setBugs(next);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const handleTap = useCallback((e: any) => {
    const tx = e.nativeEvent.locationX;
    const ty = e.nativeEvent.locationY;
    let hit = false;
    for (let i = 0; i < BUG_COUNT; i++) {
      const { x, y } = aisRef.current[i].physics.position;
      if (Math.sqrt((tx - x) ** 2 + (ty - y) ** 2) < 100) {
        aisRef.current[i] = tapBugAI(aisRef.current[i]);
        if (!hit) session.registerHit(x, y, "#4A7C59");
        hit = true;
      }
    }
    if (!hit) session.registerMiss();
  }, []);

  return (
    <View style={styles.container} onTouchStart={handleTap}>
      <Canvas style={styles.canvas}>
        <BugBackground width={SCREEN_W} height={SCREEN_H} time={time} />
        {bugs.map((b, i) => <BugSprite key={i} {...b} />)}
        <HitEffectLayer particles={session.particles} />
      </Canvas>
      <ScorePopLayer pops={session.scorePops} />
      {onBack && (
        <GameHUD
          onBack={() => onBack(session.tapCount, session.maxCombo)}
          tapCount={session.tapCount}
          combo={session.combo}
          darkMode={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F0E8" },
  canvas: { flex: 1 },
});
