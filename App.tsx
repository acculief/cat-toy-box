import React, { useCallback, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ModeSelectScreen, GameMode } from "./screens/ModeSelectScreen";
import { SessionSummary, SessionData } from "./screens/SessionSummary";
import { BugRenderer } from "./game/Bug";
import { LaserRenderer } from "./game/LaserRenderer";
import { FishRenderer } from "./game/FishRenderer";
import { SparkleRenderer } from "./game/SparkleRenderer";
import { LadybugRenderer } from "./game/LadybugRenderer";
import { SnakeRenderer } from "./game/SnakeRenderer";
import { usePremium } from "./hooks/usePremium";
import { useAdInterstitial } from "./hooks/useAdInterstitial";

type Screen =
  | { type: "select" }
  | { type: "game"; mode: GameMode }
  | { type: "summary"; session: SessionData };

const FADE_DURATION = 200;

export default function App() {
  const [screen, setScreen] = useState<Screen>({ type: "select" });
  const [displayed, setDisplayed] = useState<Screen>({ type: "select" });
  const sessionStartRef = useRef(Date.now());
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isTransitioning = useRef(false);
  const premium = usePremium();
  const { showAd } = useAdInterstitial();

  const transitionTo = useCallback(
    (next: Screen) => {
      if (isTransitioning.current) return;
      isTransitioning.current = true;
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        setDisplayed(next);
        setScreen(next);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }).start(() => {
          isTransitioning.current = false;
        });
      });
    },
    [fadeAnim]
  );

  const startGame = useCallback(
    async (mode: GameMode) => {
      // Show interstitial ad for free users
      if (!premium.isPremium) {
        await showAd();
      }
      sessionStartRef.current = Date.now();
      transitionTo({ type: "game", mode });
    },
    [transitionTo, premium.isPremium, showAd]
  );

  const endGame = useCallback(
    (mode: GameMode, hits: number, maxCombo: number) => {
      const elapsed = Math.floor(
        (Date.now() - sessionStartRef.current) / 1000
      );
      transitionTo({
        type: "summary",
        session: { mode, hits, maxCombo, elapsed },
      });
    },
    [transitionTo]
  );

  const renderScreen = () => {
    if (displayed.type === "summary") {
      return (
        <>
          <StatusBar style="dark" />
          <SessionSummary
            session={displayed.session}
            onDone={() => transitionTo({ type: "select" })}
            isPremium={premium.isPremium}
            onUpgrade={premium.purchase}
          />
        </>
      );
    }

    if (displayed.type === "game") {
      const Renderer = {
        bug: BugRenderer,
        laser: LaserRenderer,
        fish: FishRenderer,
        sparkle: SparkleRenderer,
        ladybug: LadybugRenderer,
        snake: SnakeRenderer,
      }[displayed.mode];

      return (
        <>
          <StatusBar style="light" hidden />
          <Renderer
            onBack={(hits: number, maxCombo: number) =>
              endGame(displayed.mode, hits, maxCombo)
            }
          />
        </>
      );
    }

    return (
      <>
        <StatusBar style="dark" />
        <ModeSelectScreen
          onSelectMode={startGame}
          isPremium={premium.isPremium}
          onPurchase={premium.purchase}
          onRestore={premium.restore}
          onToggleDebugPremium={premium.toggle}
        />
      </>
    );
  };

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      {renderScreen()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
