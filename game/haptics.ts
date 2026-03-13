import * as Haptics from "expo-haptics";

export function tapHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hitHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function panicHaptic() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
