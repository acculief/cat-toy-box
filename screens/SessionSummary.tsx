import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { GameMode } from "./ModeSelectScreen";

export interface SessionData {
  mode: GameMode;
  hits: number;
  maxCombo: number;
  elapsed: number; // seconds
}

const MODE_LABELS: Record<GameMode, { name: string; comment: string }> = {
  bug: { name: "Bug", comment: "So quick!" },
  laser: { name: "Laser", comment: "Nice aim!" },
  fish: { name: "Fish", comment: "Great catch!" },
  sparkle: { name: "Sparkle", comment: "So pretty!" },
  ladybug: { name: "Ladybug", comment: "So cute!" },
  snake: { name: "Snake", comment: "So wiggly!" },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function saveHighScore(mode: GameMode, hits: number, maxCombo: number) {
  try {
    const key = `highscore_${mode}`;
    const existing = await SecureStore.getItemAsync(key);
    const prev = existing ? JSON.parse(existing) : { hits: 0, maxCombo: 0 };
    const updated = {
      hits: Math.max(prev.hits, hits),
      maxCombo: Math.max(prev.maxCombo, maxCombo),
    };
    await SecureStore.setItemAsync(key, JSON.stringify(updated));
    return { prevHits: prev.hits, prevCombo: prev.maxCombo, ...updated };
  } catch {
    return null;
  }
}

interface Props {
  session: SessionData;
  onDone: () => void;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

export function SessionSummary({ session, onDone, isPremium, onUpgrade }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [highScore, setHighScore] = React.useState<{
    prevHits: number;
    prevCombo: number;
    hits: number;
    maxCombo: number;
  } | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 12,
        bounciness: 5,
      }),
    ]).start();

    saveHighScore(session.mode, session.hits, session.maxCombo).then(
      setHighScore
    );
  }, []);

  const label = MODE_LABELS[session.mode];
  const isNewBest =
    highScore && session.hits > 0 && session.hits >= highScore.hits && session.hits > highScore.prevHits;
  const isNewCombo =
    highScore &&
    session.maxCombo > 0 &&
    session.maxCombo >= highScore.maxCombo &&
    session.maxCombo > highScore.prevCombo;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Cat face */}
        <View style={styles.catFace}>
          <View style={styles.catEarRow}>
            <View style={[styles.catEar, styles.catEarLeft]} />
            <View style={[styles.catEar, styles.catEarRight]} />
          </View>
          <View style={styles.catHead}>
            <View style={styles.catEyeRow}>
              <View style={styles.catEye} />
              <View style={styles.catEye} />
            </View>
            <View style={styles.catNose} />
            <Text style={styles.catMouth}>w</Text>
          </View>
        </View>

        <Text style={styles.greeting}>Well done!</Text>
        <Text style={styles.comment}>{label.comment}</Text>
        <Text style={styles.modeName}>{label.name} Mode</Text>

        <View style={styles.statsGrid}>
          <StatCard
            label="HITS"
            value={`${session.hits}`}
            isNew={!!isNewBest}
          />
          <StatCard
            label="MAX COMBO"
            value={`${session.maxCombo}`}
            isNew={!!isNewCombo}
          />
          <StatCard
            label="TIME"
            value={formatTime(session.elapsed)}
          />
          <StatCard
            label="HITS/MIN"
            value={
              session.elapsed > 0
                ? `${((session.hits / session.elapsed) * 60).toFixed(1)}`
                : "0"
            }
          />
        </View>

        {highScore && (highScore.hits > 0 || highScore.maxCombo > 0) && (
          <View style={styles.highScoreRow}>
            <Text style={styles.highScoreLabel}>BEST RECORD</Text>
            <Text style={styles.highScoreValue}>
              {highScore.hits} hits  {highScore.maxCombo} combo
            </Text>
          </View>
        )}

        {!isPremium && onUpgrade && (
          <TouchableOpacity onPress={onUpgrade} activeOpacity={0.7}>
            <Text style={styles.upsellText}>
              Unlock all toys?
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.button} onPress={onDone}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  isNew,
}: {
  label: string;
  value: string;
  isNew?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {isNew && <Text style={styles.newBadge}>NEW</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF6F0",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
  },

  // Cat face
  catFace: {
    alignItems: "center",
    marginBottom: 12,
  },
  catEarRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
    marginBottom: -4,
  },
  catEar: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 18,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#2C1810",
  },
  catEarLeft: { transform: [{ rotate: "-12deg" }] },
  catEarRight: { transform: [{ rotate: "12deg" }] },
  catHead: {
    width: 72,
    height: 62,
    borderRadius: 36,
    backgroundColor: "#2C1810",
    alignItems: "center",
    justifyContent: "center",
  },
  catEyeRow: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 4,
  },
  catEye: {
    width: 6,
    height: 8,
    borderRadius: 3,
    backgroundColor: "#FAF6F0",
  },
  catNose: {
    width: 5,
    height: 4,
    borderRadius: 2.5,
    backgroundColor: "#C89B7B",
    marginBottom: 1,
  },
  catMouth: {
    fontSize: 10,
    color: "#FAF6F0",
    fontWeight: "300",
    marginTop: -2,
  },

  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2C1810",
    letterSpacing: 2,
  },
  comment: {
    fontSize: 14,
    color: "#A09484",
    marginTop: 4,
    fontWeight: "500",
  },
  modeName: {
    fontSize: 12,
    color: "#C8BFAE",
    marginTop: 2,
    marginBottom: 28,
    letterSpacing: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: 20,
  },
  statCard: {
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2C1810",
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 11,
    color: "#A09484",
    marginTop: 4,
    fontWeight: "500",
    letterSpacing: 1,
  },
  newBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#C44536",
    marginTop: 4,
    letterSpacing: 2,
  },
  highScoreRow: {
    alignItems: "center",
    marginBottom: 24,
  },
  highScoreLabel: {
    fontSize: 11,
    color: "#A09484",
    fontWeight: "600",
    letterSpacing: 2,
  },
  highScoreValue: {
    fontSize: 15,
    color: "#2C1810",
    fontWeight: "700",
    marginTop: 2,
  },
  upsellText: {
    fontSize: 12,
    color: "#7B5EA7",
    fontWeight: "500",
    marginBottom: 16,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: "#2C1810",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    color: "#FAF6F0",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
