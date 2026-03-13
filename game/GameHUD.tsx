import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
} from "react-native";
import { useKeepAwake } from "expo-keep-awake";

const HOLD_DURATION_MS = 3000;

interface GameHUDProps {
  onBack: () => void;
  tapCount: number;
  combo: number;
  darkMode?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ComboIndicator({
  combo,
  darkMode,
}: {
  combo: number;
  darkMode: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const prevCombo = useRef(0);

  useEffect(() => {
    if (combo >= 2 && combo !== prevCombo.current) {
      scaleAnim.setValue(1.5);
      const wiggle = (combo % 2 === 0) ? 1 : -1;
      rotateAnim.setValue(wiggle * 0.08);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 18,
        }),
        Animated.spring(rotateAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 14,
        }),
      ]).start();
    } else if (combo < 2) {
      scaleAnim.setValue(0);
    }
    prevCombo.current = combo;
  }, [combo]);

  if (combo < 2) return null;

  const color =
    combo >= 10
      ? "#FF6B6B"
      : combo >= 5
      ? "#FECA57"
      : darkMode
      ? "#fff"
      : "#2C1810";

  const bgColor =
    combo >= 10
      ? "rgba(255,107,107,0.15)"
      : combo >= 5
      ? "rgba(254,202,87,0.15)"
      : darkMode
      ? "rgba(255,255,255,0.1)"
      : "rgba(44,24,16,0.08)";

  return (
    <Animated.View
      style={[
        styles.comboContainer,
        {
          transform: [{ scale: scaleAnim }, { rotate: rotateAnim.interpolate({
            inputRange: [-1, 1],
            outputRange: ['-12deg', '12deg'],
          }) }],
        },
      ]}
    >
      <View style={[styles.comboBubble, { backgroundColor: bgColor }]}>
        <Text style={[styles.comboCount, { color }]}>{combo}</Text>
        <Text style={[styles.comboLabel, { color, opacity: 0.7 }]}>combo</Text>
      </View>
    </Animated.View>
  );
}

/** Back button that requires 3-second long press */
function HoldBackButton({
  onBack,
  darkMode,
}: {
  onBack: () => void;
  darkMode: boolean;
}) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const firedRef = useRef(false);

  const bgColor = darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const textColor = darkMode ? "#fff" : "#2C1810";
  const ringColor = darkMode ? "rgba(255,255,255,0.5)" : "rgba(44,24,16,0.4)";

  const startHold = useCallback(() => {
    firedRef.current = false;
    progressAnim.setValue(0);
    animRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished && !firedRef.current) {
        firedRef.current = true;
        onBack();
      }
    });
  }, [onBack, progressAnim]);

  const cancelHold = useCallback(() => {
    animRef.current?.stop();
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => startHold(),
      onPanResponderRelease: () => cancelHold(),
      onPanResponderTerminate: () => cancelHold(),
    })
  ).current;

  // Progress ring as a border
  const borderWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });
  const borderColor = progressAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [ringColor, ringColor, darkMode ? "#FF6B6B" : "#C44536"],
  });
  const scale = progressAnim.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [1, 0.9, 0.85],
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.backButton,
        {
          backgroundColor: bgColor,
          borderWidth,
          borderColor,
          transform: [{ scale }],
        },
      ]}
    >
      <Text style={[styles.backText, { color: textColor }]}>x</Text>
    </Animated.View>
  );
}

export function GameHUD({
  onBack,
  tapCount,
  combo,
  darkMode = true,
}: GameHUDProps) {
  useKeepAwake();

  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const textColor = darkMode ? "#fff" : "#2C1810";
  const bgColor = darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  return (
    <View style={styles.container} pointerEvents="box-none">
      <HoldBackButton onBack={onBack} darkMode={darkMode} />

      {/* Combo */}
      <ComboIndicator combo={combo} darkMode={darkMode} />

      <View style={[styles.statsRow, { backgroundColor: bgColor }]}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: textColor }]}>
            {tapCount}
          </Text>
          <Text
            style={[styles.statLabel, { color: textColor, opacity: 0.6 }]}
          >
            HITS
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: textColor }]}>
            {formatTime(elapsed)}
          </Text>
          <Text
            style={[styles.statLabel, { color: textColor, opacity: 0.6 }]}
          >
            TIME
          </Text>
        </View>
      </View>
    </View>
  );
}

// Exported for session summary
export function useElapsedTime() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return elapsed;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  backText: {
    fontSize: 18,
    fontWeight: "600",
  },
  comboContainer: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  comboBubble: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 28,
  },
  comboCount: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1,
  },
  comboLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 3,
    marginTop: -2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stat: {
    alignItems: "center",
    minWidth: 50,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(128,128,128,0.3)",
    marginHorizontal: 12,
  },
});
