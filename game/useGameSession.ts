import { useCallback, useRef, useState } from "react";
import {
  HitParticle,
  ScorePop,
  spawnHitParticles,
  spawnScorePop,
  tickHitParticles,
  tickScorePops,
} from "./HitEffect";
import { hitHaptic, panicHaptic } from "./haptics";

const COMBO_WINDOW_MS = 4000;

export interface GameSession {
  tapCount: number;
  combo: number;
  maxCombo: number;
  particles: HitParticle[];
  scorePops: ScorePop[];
  registerHit: (x: number, y: number, color: string) => void;
  registerMiss: () => void;
  tickEffects: (dt: number) => void;
  getEndStats: () => { hits: number; maxCombo: number };
}

export function useGameSession(): GameSession {
  const [tapCount, setTapCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const lastHitRef = useRef(0);
  const particlesRef = useRef<HitParticle[]>([]);
  const scorePopsRef = useRef<ScorePop[]>([]);
  const [, forceUpdate] = useState(0);

  const registerHit = useCallback((x: number, y: number, color: string) => {
    const now = Date.now();
    const timeSinceLast = now - lastHitRef.current;
    lastHitRef.current = now;

    panicHaptic();

    setTapCount((c) => c + 1);

    // Compute new combo synchronously
    const nextCombo = timeSinceLast < COMBO_WINDOW_MS ? comboRef.current + 1 : 1;
    comboRef.current = nextCombo;
    if (nextCombo > maxComboRef.current) maxComboRef.current = nextCombo;
    setCombo(nextCombo);

    particlesRef.current = [
      ...particlesRef.current,
      ...spawnHitParticles(x, y, color),
    ];

    scorePopsRef.current = [
      ...scorePopsRef.current,
      spawnScorePop(x, y, nextCombo),
    ];
  }, []);

  const registerMiss = useCallback(() => {
    hitHaptic();
    if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
    comboRef.current = 0;
    setCombo(0);
  }, []);

  const tickEffects = useCallback((dt: number) => {
    particlesRef.current = tickHitParticles(particlesRef.current, dt);
    scorePopsRef.current = tickScorePops(scorePopsRef.current, dt);

    // Check combo timeout
    if (
      Date.now() - lastHitRef.current > COMBO_WINDOW_MS &&
      lastHitRef.current > 0 &&
      comboRef.current > 0
    ) {
      if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
      comboRef.current = 0;
      setCombo(0);
    }

    forceUpdate((n) => n + 1);
  }, []);

  const getEndStats = useCallback(() => {
    return { hits: tapCount, maxCombo: maxComboRef.current };
  }, [tapCount]);

  return {
    tapCount,
    combo,
    maxCombo: maxComboRef.current,
    particles: particlesRef.current,
    scorePops: scorePopsRef.current,
    registerHit,
    registerMiss,
    tickEffects,
    getEndStats,
  };
}
