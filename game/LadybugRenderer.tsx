import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, View, StyleSheet } from "react-native";
import { Canvas, Path, Shadow, Group, Circle, Skia, Oval, rect } from "@shopify/react-native-skia";
import { GameHUD } from "./GameHUD";
import { HitEffectLayer } from "./HitEffect";
import { ScorePopLayer } from "./ScorePopLayer";
import { useGameSession } from "./useGameSession";
import { LadybugBackground } from "./backgrounds/LadybugBackground";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const BODY_SIZE = 65;
const HEAD_SIZE = BODY_SIZE * 0.35;
const LADYBUG_COUNT = 2;
const MARGIN = BODY_SIZE;

type LadybugMode = "waddle" | "pause" | "hop" | "flee" | "fly";

interface LadybugState {
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  speed: number;
  mode: LadybugMode;
  modeTimer: number;
  waddlePhase: number;
  hopOffsetY: number;
  antennaPhase: number;
  wingSpread: number; // 0..1 for fly animation
  flyAltitude: number; // shadow offset for flying
  shadowScale: number; // shadow grows when flying
}

function createLadybug(): LadybugState {
  return {
    x: Math.random() * (SCREEN_W - MARGIN * 2) + MARGIN,
    y: Math.random() * (SCREEN_H - MARGIN * 2) + MARGIN,
    angle: Math.random() * Math.PI * 2,
    targetAngle: Math.random() * Math.PI * 2,
    speed: 200,
    mode: "waddle",
    modeTimer: 2 + Math.random() * 3,
    waddlePhase: Math.random() * Math.PI * 2,
    hopOffsetY: 0,
    antennaPhase: Math.random() * Math.PI * 2,
    wingSpread: 0,
    flyAltitude: 0,
    shadowScale: 1,
  };
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function clampToScreen(x: number, y: number): { x: number; y: number; bounced: boolean; bAngle: number } {
  let bounced = false;
  let bAngle = 0;
  if (x < MARGIN) { x = MARGIN; bounced = true; bAngle = 0; }
  if (x > SCREEN_W - MARGIN) { x = SCREEN_W - MARGIN; bounced = true; bAngle = Math.PI; }
  if (y < MARGIN) { y = MARGIN; bounced = true; bAngle = Math.PI / 2; }
  if (y > SCREEN_H - MARGIN) { y = SCREEN_H - MARGIN; bounced = true; bAngle = -Math.PI / 2; }
  return { x, y, bounced, bAngle };
}

function tickLadybug(s: LadybugState, dt: number): LadybugState {
  const lb = { ...s };

  lb.modeTimer -= dt;
  lb.antennaPhase += dt * 4;
  lb.waddlePhase += dt * 6;

  if (lb.modeTimer <= 0) {
    if (lb.mode === "flee") {
      lb.mode = "waddle";
      lb.speed = 200;
      lb.modeTimer = 2 + Math.random() * 3;
      lb.targetAngle = lb.angle + (Math.random() - 0.5) * Math.PI;
    } else if (lb.mode === "fly") {
      // Landing
      lb.mode = "waddle";
      lb.speed = 180;
      lb.modeTimer = 2 + Math.random() * 2;
      lb.targetAngle = lb.angle + (Math.random() - 0.5) * Math.PI;
    } else {
      const roll = Math.random();
      if (roll < 0.35) {
        lb.mode = "waddle";
        lb.modeTimer = 2 + Math.random() * 3;
        lb.targetAngle = lb.angle + (Math.random() - 0.5) * Math.PI * 0.8;
        lb.speed = 180 + Math.random() * 40;
      } else if (roll < 0.55) {
        lb.mode = "pause";
        lb.modeTimer = 1 + Math.random() * 2;
        lb.speed = 0;
      } else if (roll < 0.75) {
        lb.mode = "hop";
        lb.modeTimer = 0.3 + Math.random() * 0.2;
        lb.speed = 150;
        lb.targetAngle = lb.angle + (Math.random() - 0.5) * 0.5;
      } else {
        // Take flight!
        lb.mode = "fly";
        lb.modeTimer = 1.5 + Math.random() * 2;
        lb.speed = 300 + Math.random() * 100;
        lb.targetAngle = Math.random() * Math.PI * 2;
      }
    }
  }

  // Wing spread animation
  const targetWing = lb.mode === "fly" ? 1 : 0;
  lb.wingSpread += (targetWing - lb.wingSpread) * Math.min(dt * 6, 1);

  // Fly altitude (visual lift)
  const targetAlt = lb.mode === "fly" ? -20 - Math.sin(lb.waddlePhase * 0.8) * 8 : 0;
  lb.flyAltitude += (targetAlt - lb.flyAltitude) * Math.min(dt * 5, 1);

  // Shadow scale when flying
  const targetShadow = lb.mode === "fly" ? 1.4 : 1;
  lb.shadowScale += (targetShadow - lb.shadowScale) * Math.min(dt * 4, 1);

  // Hop y-offset
  if (lb.mode === "hop") {
    const hopProgress = lb.modeTimer / 0.4;
    lb.hopOffsetY = -Math.sin(hopProgress * Math.PI) * 25;
  } else if (lb.mode !== "fly") {
    lb.hopOffsetY *= 0.85;
  }

  // Turn toward target
  const diff = normalizeAngle(lb.targetAngle - lb.angle);
  const turnSpeed = lb.mode === "flee" ? 8 : lb.mode === "fly" ? 4 : 2.5;
  const maxTurn = turnSpeed * dt;
  if (Math.abs(diff) < maxTurn) {
    lb.angle = lb.targetAngle;
  } else {
    lb.angle += Math.sign(diff) * maxTurn;
  }

  // Side-to-side waddle
  let sway = 0;
  if (lb.mode === "waddle") {
    sway = Math.sin(lb.waddlePhase) * 0.15;
  }

  // Move
  const moveAngle = lb.angle + sway;
  lb.x += Math.cos(moveAngle) * lb.speed * dt;
  lb.y += Math.sin(moveAngle) * lb.speed * dt;

  // Bounce off screen edges instead of wrapping
  const clamped = clampToScreen(lb.x, lb.y);
  if (clamped.bounced) {
    lb.x = clamped.x;
    lb.y = clamped.y;
    // Reflect angle toward inside
    lb.targetAngle = clamped.bAngle + (Math.random() - 0.5) * Math.PI * 0.6;
    lb.angle = lb.targetAngle;
  } else {
    lb.x = clamped.x;
    lb.y = clamped.y;
  }

  return lb;
}

function LadybugSprite({ x, y, angle, hopOffsetY, antennaPhase, isFleeing, wingSpread, flyAltitude, shadowScale }: {
  x: number; y: number; angle: number; hopOffsetY: number; antennaPhase: number;
  isFleeing: boolean; wingSpread: number; flyAltitude: number; shadowScale: number;
}) {
  const bodyR = BODY_SIZE / 2;

  // Body: oval-ish (wider than tall)
  const bodyPath = Skia.Path.MakeFromSVGString(
    `M ${-bodyR} 0
     Q ${-bodyR} ${-bodyR * 0.85} 0 ${-bodyR * 0.9}
     Q ${bodyR} ${-bodyR * 0.85} ${bodyR} 0
     Q ${bodyR} ${bodyR * 0.85} 0 ${bodyR * 0.9}
     Q ${-bodyR} ${bodyR * 0.85} ${-bodyR} 0 Z`
  );

  // Head
  const headPath = Skia.Path.MakeFromSVGString(
    `M ${bodyR * 0.6} ${-HEAD_SIZE * 0.5}
     Q ${bodyR + HEAD_SIZE * 0.7} ${-HEAD_SIZE * 0.6} ${bodyR + HEAD_SIZE * 0.7} 0
     Q ${bodyR + HEAD_SIZE * 0.7} ${HEAD_SIZE * 0.6} ${bodyR * 0.6} ${HEAD_SIZE * 0.5} Z`
  );

  // Wing line (center divider)
  const wingLine = Skia.Path.MakeFromSVGString(
    `M ${bodyR * 0.6} 0 L ${-bodyR * 0.8} 0`
  );

  // Antennae
  const aw = Math.sin(antennaPhase) * 5;
  const antennaePath = Skia.Path.MakeFromSVGString(
    `M ${bodyR + HEAD_SIZE * 0.4} ${-HEAD_SIZE * 0.3}
     Q ${bodyR + HEAD_SIZE * 1.0} ${-HEAD_SIZE * 0.8 + aw} ${bodyR + HEAD_SIZE * 1.2} ${-HEAD_SIZE * 1.0 + aw}
     M ${bodyR + HEAD_SIZE * 0.4} ${HEAD_SIZE * 0.3}
     Q ${bodyR + HEAD_SIZE * 1.0} ${HEAD_SIZE * 0.8 - aw} ${bodyR + HEAD_SIZE * 1.2} ${HEAD_SIZE * 1.0 - aw}`
  );

  // Spots positions on the body
  const spots = [
    { cx: -bodyR * 0.3, cy: -bodyR * 0.35, r: bodyR * 0.18 },
    { cx: -bodyR * 0.3, cy: bodyR * 0.35, r: bodyR * 0.18 },
    { cx: bodyR * 0.05, cy: -bodyR * 0.25, r: bodyR * 0.15 },
    { cx: bodyR * 0.05, cy: bodyR * 0.25, r: bodyR * 0.15 },
    { cx: -bodyR * 0.6, cy: 0, r: bodyR * 0.14 },
    { cx: bodyR * 0.3, cy: 0, r: bodyR * 0.12 },
  ];

  const bodyColor = isFleeing ? "#CC2200" : "#E03020";

  if (!bodyPath || !headPath || !wingLine || !antennaePath) return null;

  // Spread wings (transparent wing shapes on each side)
  const wingW = bodyR * 1.1 * wingSpread;
  const wingH = bodyR * 0.7;

  return (
    <>
      {/* Ground shadow (separate from body, stays at ground level) */}
      <Group transform={[{ translateX: x }, { translateY: y }, { rotate: angle }]}>
        <Group transform={[{ scaleX: shadowScale }, { scaleY: shadowScale * 0.5 }]}>
          <Oval rect={rect(-bodyR * 0.8, -bodyR * 0.4, bodyR * 1.6, bodyR * 0.8)} color="rgba(0,0,0,0.15)" />
        </Group>
      </Group>

      {/* Ladybug body lifted by flyAltitude */}
      <Group transform={[{ translateX: x }, { translateY: y + hopOffsetY + flyAltitude }, { rotate: angle }]}>
        {/* Spread wings (under body) */}
        {wingSpread > 0.05 && (
          <>
            <Oval
              rect={rect(-bodyR * 0.3, -bodyR * 0.5 - wingW, bodyR * 1.2, wingH + wingW * 0.5)}
              color="rgba(220, 180, 160, 0.6)"
            />
            <Oval
              rect={rect(-bodyR * 0.3, bodyR * 0.0, bodyR * 1.2, wingH + wingW * 0.5)}
              color="rgba(220, 180, 160, 0.6)"
            />
          </>
        )}

        {/* Body */}
        <Path path={bodyPath} color={bodyColor} style="fill">
          <Shadow dx={0} dy={2} blur={6} color="rgba(0,0,0,0.25)" />
        </Path>

        {/* Spots */}
        {spots.map((spot, i) => (
          <Circle key={i} cx={spot.cx} cy={spot.cy} r={spot.r} color="#1A1A1A" />
        ))}

        {/* Wing dividing line */}
        <Path path={wingLine} color="rgba(0,0,0,0.3)" style="stroke" strokeWidth={1.5} />

        {/* Head */}
        <Path path={headPath} color="#1A1A1A" style="fill">
          <Shadow dx={0} dy={1} blur={3} color="rgba(0,0,0,0.2)" />
        </Path>

        {/* Antennae */}
        <Path path={antennaePath} color="#1A1A1A" style="stroke" strokeWidth={2} strokeCap="round" />
        {/* Antenna tips */}
        <Circle
          cx={bodyR + HEAD_SIZE * 1.2}
          cy={-HEAD_SIZE * 1.0 + Math.sin(antennaPhase) * 5}
          r={2}
          color="#1A1A1A"
        />
        <Circle
          cx={bodyR + HEAD_SIZE * 1.2}
          cy={HEAD_SIZE * 1.0 - Math.sin(antennaPhase) * 5}
          r={2}
          color="#1A1A1A"
        />

        {/* Tiny legs (hidden when flying) */}
        {wingSpread < 0.3 && [0, 1, 2].map((i) => {
          const lx = -bodyR * 0.4 + i * bodyR * 0.4;
          const legLen = bodyR * 0.35;
          return (
            <Group key={`leg${i}`}>
              <Path
                path={Skia.Path.MakeFromSVGString(
                  `M ${lx} ${-bodyR * 0.7} L ${lx - 3} ${-bodyR * 0.7 - legLen}
                   M ${lx} ${bodyR * 0.7} L ${lx - 3} ${bodyR * 0.7 + legLen}`
                )!}
                color="#1A1A1A"
                style="stroke"
                strokeWidth={2}
                strokeCap="round"
              />
            </Group>
          );
        })}
      </Group>
    </>
  );
}

interface Props {
  onBack?: (hits: number, maxCombo: number) => void;
}

export function LadybugRenderer({ onBack }: Props) {
  const statesRef = useRef(Array.from({ length: LADYBUG_COUNT }, () => createLadybug()));
  const lastTimeRef = useRef(Date.now());
  const session = useGameSession();
  const [time, setTime] = useState(0);

  const [ladybugs, setLadybugs] = useState(() =>
    statesRef.current.map((lb) => ({
      x: lb.x,
      y: lb.y,
      angle: lb.angle,
      hopOffsetY: lb.hopOffsetY,
      antennaPhase: lb.antennaPhase,
      isFleeing: lb.mode === "flee",
      wingSpread: lb.wingSpread,
      flyAltitude: lb.flyAltitude,
      shadowScale: lb.shadowScale,
    }))
  );

  useEffect(() => {
    let id: number;
    const tick = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      const next = [];
      for (let i = 0; i < LADYBUG_COUNT; i++) {
        statesRef.current[i] = tickLadybug(statesRef.current[i], dt);
        const lb = statesRef.current[i];
        next.push({
          x: lb.x,
          y: lb.y,
          angle: lb.angle,
          hopOffsetY: lb.hopOffsetY,
          antennaPhase: lb.antennaPhase,
          isFleeing: lb.mode === "flee",
          wingSpread: lb.wingSpread,
          flyAltitude: lb.flyAltitude,
          shadowScale: lb.shadowScale,
        });
      }
      session.tickEffects(dt);
      setTime((t) => t + dt);
      setLadybugs(next);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const handleTap = useCallback((e: any) => {
    const tx = e.nativeEvent.locationX;
    const ty = e.nativeEvent.locationY;
    let hit = false;
    for (let i = 0; i < LADYBUG_COUNT; i++) {
      const lb = statesRef.current[i];
      const dx = lb.x - tx;
      const dy = (lb.y + lb.hopOffsetY + lb.flyAltitude) - ty;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        statesRef.current[i] = {
          ...statesRef.current[i],
          mode: "flee",
          speed: 500,
          modeTimer: 0.8 + Math.random() * 0.3,
          targetAngle: Math.atan2(dy, dx),
          angle: Math.atan2(dy, dx),
        };
        if (!hit) session.registerHit(lb.x, lb.y, "#E74C3C");
        hit = true;
      }
    }
    if (!hit) session.registerMiss();
  }, []);

  return (
    <View style={styles.container} onTouchStart={handleTap}>
      <Canvas style={styles.canvas}>
        <LadybugBackground width={SCREEN_W} height={SCREEN_H} time={time} />
        {ladybugs.map((lb, i) => (
          <LadybugSprite key={i} {...lb} />
        ))}
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
  container: { flex: 1, backgroundColor: "#F0E8D8" },
  canvas: { flex: 1 },
});
