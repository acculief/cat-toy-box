import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ScorePop } from "./HitEffect";

interface Props {
  pops: ScorePop[];
}

export function ScorePopLayer({ pops }: Props) {
  return (
    <View style={styles.container} pointerEvents="none">
      {pops.map((p) => {
        const isCombo = p.text.includes("combo");
        const comboNum = isCombo ? parseInt(p.text) : 0;
        const color =
          comboNum >= 10
            ? "#FF6B6B"
            : comboNum >= 5
            ? "#FECA57"
            : isCombo
            ? "#FFD700"
            : "#fff";
        // Slight random rotation for playful feel
        const rotate = isCombo
          ? `${(p.id % 2 === 0 ? 1 : -1) * (3 + comboNum * 0.5)}deg`
          : "0deg";

        return (
          <Text
            key={p.id}
            style={[
              styles.pop,
              {
                left: p.x - 50,
                top: p.y - 16,
                opacity: p.opacity,
                transform: [{ scale: p.scale }, { rotate }],
                color,
                fontSize: isCombo ? 24 + Math.min(comboNum, 10) : 18,
              },
            ]}
          >
            {p.text}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  pop: {
    position: "absolute",
    width: 100,
    textAlign: "center",
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
