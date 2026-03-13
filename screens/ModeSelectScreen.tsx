import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Modal,
} from "react-native";
import * as Haptics from "expo-haptics";
import { PREMIUM_MODES } from "../hooks/usePremium";
import { BugIcon, LaserIcon, FishIcon, SparkleIcon, LadybugIcon, SnakeIcon } from "./ModeIcons";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_GAP = 14;
const CARD_WIDTH = (SCREEN_W - CARD_GAP * 3) / 2;

export type GameMode = "bug" | "laser" | "fish" | "sparkle" | "ladybug" | "snake";

interface ModeItem {
  id: GameMode;
  title: string;
  description: string;
  color: string;
}

const MODES: ModeItem[] = [
  {
    id: "bug",
    title: "Bug",
    description: "Chase the speedy critter",
    color: "#5B8C5A",
  },
  {
    id: "laser",
    title: "Laser",
    description: "Catch the red dot",
    color: "#C44536",
  },
  {
    id: "fish",
    title: "Fish",
    description: "Tap the swimming fish",
    color: "#3B7EA1",
  },
  {
    id: "sparkle",
    title: "Sparkle",
    description: "Chase the floating lights",
    color: "#7B5EA7",
  },
  {
    id: "ladybug",
    title: "Ladybug",
    description: "Catch the cute little bugs",
    color: "#C0392B",
  },
  {
    id: "snake",
    title: "Snake",
    description: "Chase the wiggly snakes",
    color: "#2E7D32",
  },
];

// Cat ear shapes as decorative element
function CatEars({ color }: { color: string }) {
  return (
    <View style={catEarStyles.container}>
      <View style={[catEarStyles.ear, catEarStyles.earLeft, { borderBottomColor: color }]} />
      <View style={[catEarStyles.ear, catEarStyles.earRight, { borderBottomColor: color }]} />
    </View>
  );
}

const catEarStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: -2,
  },
  ear: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  earLeft: { transform: [{ rotate: "-10deg" }] },
  earRight: { transform: [{ rotate: "10deg" }] },
});

const MODE_ICONS: Record<GameMode, React.ComponentType<{ size: number }>> = {
  bug: BugIcon,
  laser: LaserIcon,
  fish: FishIcon,
  sparkle: SparkleIcon,
  ladybug: LadybugIcon,
  snake: SnakeIcon,
};

function ModeCard({
  mode,
  onPress,
  index,
  locked,
}: {
  mode: ModeItem;
  onPress: () => void;
  index: number;
  locked: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = 2200 + index * 400;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const iconTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const bg = locked ? "#B0A89F" : mode.color;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[styles.card, { backgroundColor: bg }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Animated.View style={[styles.cardIconArea, { transform: [{ translateY: iconTranslateY }] }]}>
          {React.createElement(MODE_ICONS[mode.id], { size: 56 })}
        </Animated.View>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{mode.title}</Text>
          {locked && <Text style={styles.lockBadge}>PRO</Text>}
        </View>
        <Text style={styles.cardDesc}>{mode.description}</Text>
      </Pressable>
    </Animated.View>
  );
}

function PawPrint({ size = 16, color = "rgba(44,24,16,0.06)" }: { size?: number; color?: string }) {
  const pad = size * 0.45;
  const toe = size * 0.22;
  return (
    <View style={{ width: size, height: size * 1.1, alignItems: "center" }}>
      <View style={{ flexDirection: "row", gap: size * 0.08, marginBottom: size * 0.04 }}>
        <View style={{ width: toe, height: toe, borderRadius: toe / 2, backgroundColor: color }} />
        <View style={{ width: toe, height: toe, borderRadius: toe / 2, backgroundColor: color, marginTop: -size * 0.06 }} />
        <View style={{ width: toe, height: toe, borderRadius: toe / 2, backgroundColor: color, marginTop: -size * 0.06 }} />
        <View style={{ width: toe, height: toe, borderRadius: toe / 2, backgroundColor: color }} />
      </View>
      <View style={{ width: pad, height: pad * 0.85, borderRadius: pad / 2, backgroundColor: color }} />
    </View>
  );
}

function UpgradeModal({
  visible,
  onClose,
  onPurchase,
  onRestore,
}: {
  visible: boolean;
  onClose: () => void;
  onPurchase: () => void;
  onRestore: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <CatEars color="#2C1810" />
          <View style={styles.modalIconCircle}>
            <Text style={styles.modalIconText}>PRO</Text>
          </View>
          <Text style={styles.modalTitle}>Unlock All</Text>
          <Text style={styles.modalSubtitle}>
            Get access to every toy and feature
          </Text>

          <View style={styles.modalFeatures}>
            <FeatureRow label="All 6 modes" />
            <FeatureRow label="No ads" />
            <FeatureRow label="Future modes included" />
          </View>

          <TouchableOpacity style={styles.purchaseButton} onPress={onPurchase}>
            <Text style={styles.purchaseButtonText}>Unlock Premium</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.restoreButton} onPress={onRestore}>
            <Text style={styles.restoreButtonText}>Restore Purchase</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function FeatureRow({ label }: { label: string }) {
  return (
    <View style={styles.featureRow}>
      <PawPrint size={14} color="rgba(44,24,16,0.25)" />
      <Text style={styles.modalFeature}>{label}</Text>
    </View>
  );
}

interface Props {
  onSelectMode: (mode: GameMode) => void;
  isPremium: boolean;
  onPurchase: () => void;
  onRestore: () => void;
  onToggleDebugPremium?: () => void;
}

export function ModeSelectScreen({
  onSelectMode,
  isPremium,
  onPurchase,
  onRestore,
  onToggleDebugPremium,
}: Props) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isModeLocked = (mode: GameMode) =>
    !isPremium && (PREMIUM_MODES as readonly string[]).includes(mode);

  const handleModePress = (mode: GameMode) => {
    if (isModeLocked(mode)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowUpgrade(true);
      return;
    }
    onSelectMode(mode);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative paw prints */}
      <View style={styles.pawDecor1}><PawPrint size={28} /></View>
      <View style={styles.pawDecor2}><PawPrint size={22} /></View>
      <View style={styles.pawDecor3}><PawPrint size={18} /></View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={styles.header}>
          <CatEars color="#2C1810" />
          <View style={styles.titleCircle}>
            <Text style={styles.titleMain}>Cat Toy</Text>
            <Text style={styles.titleSub}>Box</Text>
          </View>
          <Text style={styles.subtitle}>Pick a toy</Text>
        </View>

        <View style={styles.grid}>
          {MODES.map((mode, i) => (
            <ModeCard
              key={mode.id}
              mode={mode}
              index={i}
              locked={isModeLocked(mode.id)}
              onPress={() => handleModePress(mode.id)}
            />
          ))}
        </View>

        {!isPremium && (
          <TouchableOpacity
            style={styles.upgradeButton}
            activeOpacity={0.8}
            onPress={() => setShowUpgrade(true)}
          >
            <PawPrint size={14} color="#7B5EA7" />
            <Text style={styles.upgradeText}>Unlock all toys</Text>
          </TouchableOpacity>
        )}

        {__DEV__ && onToggleDebugPremium && (
          <TouchableOpacity
            style={styles.debugButton}
            activeOpacity={0.7}
            onPress={onToggleDebugPremium}
          >
            <Text style={styles.debugButtonText}>
              {isPremium ? "[DEV] PRO ON → OFF" : "[DEV] PRO OFF → ON"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onPurchase={() => {
          onPurchase();
          setShowUpgrade(false);
        }}
        onRestore={() => {
          onRestore();
          setShowUpgrade(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF6F0",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  pawDecor1: {
    position: "absolute",
    top: 70,
    right: 30,
    transform: [{ rotate: "25deg" }],
    opacity: 0.5,
  },
  pawDecor2: {
    position: "absolute",
    top: 130,
    left: 20,
    transform: [{ rotate: "-15deg" }],
    opacity: 0.4,
  },
  pawDecor3: {
    position: "absolute",
    bottom: 60,
    right: 50,
    transform: [{ rotate: "40deg" }],
    opacity: 0.3,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 14,
    alignItems: "center",
  },
  titleCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#2C1810",
    justifyContent: "center",
    alignItems: "center",
  },
  titleMain: {
    fontSize: 13,
    fontWeight: "300",
    color: "#FAF6F0",
    letterSpacing: 1,
  },
  titleSub: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FAF6F0",
    letterSpacing: 0.5,
    marginTop: -1,
  },
  subtitle: {
    fontSize: 15,
    color: "#8B7D6B",
    marginTop: 10,
    fontWeight: "500",
    letterSpacing: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: CARD_GAP,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.9,
    borderRadius: 20,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  cardIconArea: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
  },
  lockBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: "hidden",
    letterSpacing: 1,
  },
  cardDesc: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 15,
  },
  upgradeButton: {
    marginTop: 18,
    marginHorizontal: CARD_GAP,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 10,
  },
  upgradeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7B5EA7",
  },
  debugButton: {
    marginTop: 8,
    marginHorizontal: CARD_GAP,
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "rgba(255,0,0,0.06)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,0,0,0.15)",
  },
  debugButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#C0392B",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(44,24,16,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  modalContent: {
    backgroundColor: "#FAF6F0",
    borderRadius: 28,
    padding: 28,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2C1810",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalIconText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FAF6F0",
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2C1810",
    marginBottom: 4,
    letterSpacing: 1,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#8B7D6B",
    marginBottom: 20,
  },
  modalFeatures: {
    alignSelf: "stretch",
    gap: 10,
    marginBottom: 24,
    paddingLeft: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalFeature: {
    fontSize: 14,
    color: "#2C1810",
    fontWeight: "500",
  },
  purchaseButton: {
    backgroundColor: "#2C1810",
    borderRadius: 14,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  purchaseButtonText: {
    color: "#FAF6F0",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  restoreButton: {
    marginTop: 12,
    paddingVertical: 10,
  },
  restoreButtonText: {
    fontSize: 13,
    color: "#8B7D6B",
    fontWeight: "600",
  },
  closeButton: {
    marginTop: 4,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 13,
    color: "#C8BFAE",
  },
});
