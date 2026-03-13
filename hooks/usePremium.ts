import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";

const RC_API_KEY = "test_KIaghNjOyxfkrXGFmvfUTwIhHhy";
const ENTITLEMENT_ID = "Cat Toy Box Pro";
const PREMIUM_KEY = "is_premium"; // dev-only fallback

let rcConfigured = false;

function hasPremiumEntitlement(info: CustomerInfo): boolean {
  return typeof info.entitlements.active[ENTITLEMENT_ID] !== "undefined";
}

async function initRC() {
  if (rcConfigured) return;
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  Purchases.configure({ apiKey: RC_API_KEY });
  rcConfigured = true;
}

/**
 * Premium state hook backed by RevenueCat.
 * In __DEV__, also supports a local toggle via SecureStore.
 */
export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check entitlement on mount + listen for changes
  useEffect(() => {
    (async () => {
      try {
        await initRC();
        const info = await Purchases.getCustomerInfo();
        const entitled = hasPremiumEntitlement(info);

        if (__DEV__ && !entitled) {
          const local = await SecureStore.getItemAsync(PREMIUM_KEY);
          setIsPremium(local === "true");
        } else {
          setIsPremium(entitled);
        }
      } catch {
        const local = await SecureStore.getItemAsync(PREMIUM_KEY);
        setIsPremium(local === "true");
      }
      setLoading(false);
    })();

    // Listen for subscription status changes
    const listener = (info: CustomerInfo) => {
      setIsPremium(hasPremiumEntitlement(info));
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => { Purchases.removeCustomerInfoUpdateListener(listener); };
  }, []);

  // Show RevenueCat paywall (uses react-native-purchases-ui)
  const purchase = useCallback(async () => {
    try {
      const offerings = await Purchases.getOfferings();
      const packages = offerings.current?.availablePackages;
      if (!packages || packages.length === 0) return false;

      // Purchase the first available package
      const { customerInfo } = await Purchases.purchasePackage(packages[0]);
      const entitled = hasPremiumEntitlement(customerInfo);
      setIsPremium(entitled);
      if (entitled) {
        await SecureStore.setItemAsync(PREMIUM_KEY, "true");
      }
      return entitled;
    } catch (e: any) {
      if (!e.userCancelled) {
        console.warn("Purchase error:", e);
      }
      return false;
    }
  }, []);

  const restore = useCallback(async () => {
    try {
      const info = await Purchases.restorePurchases();
      const entitled = hasPremiumEntitlement(info);
      setIsPremium(entitled);
      if (entitled) {
        await SecureStore.setItemAsync(PREMIUM_KEY, "true");
      }
      return entitled;
    } catch {
      return false;
    }
  }, []);

  // Dev-only toggle (bypasses RevenueCat)
  const toggle = useCallback(async () => {
    const next = !isPremium;
    await SecureStore.setItemAsync(PREMIUM_KEY, next ? "true" : "false");
    setIsPremium(next);
  }, [isPremium]);

  return { isPremium, loading, purchase, restore, toggle };
}

export const FREE_MODES = ["bug", "laser"] as const;
export const PREMIUM_MODES = ["fish", "sparkle", "ladybug", "snake"] as const;
