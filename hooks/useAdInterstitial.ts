import { useCallback, useEffect, useRef } from "react";
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

// Use test ID in dev, real ID in production
const AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-6737818747220655/8024865910";

/**
 * Interstitial ad hook.
 * Preloads an ad on mount. showAd() displays it and returns when closed.
 */
export function useAdInterstitial() {
  const adRef = useRef(InterstitialAd.createForAdRequest(AD_UNIT_ID));
  const loadedRef = useRef(false);
  const lastShownRef = useRef(0);

  useEffect(() => {
    const ad = adRef.current;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      loadedRef.current = false;
      // Retry loading after 30 seconds
      setTimeout(() => {
        if (!loadedRef.current) ad.load();
      }, 30_000);
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubError();
    };
  }, []);

  const showAd = useCallback(async (): Promise<boolean> => {
    const now = Date.now();
    // Throttle: max once per 60 seconds
    if (now - lastShownRef.current < 60_000) return false;

    const ad = adRef.current;

    if (!loadedRef.current) return false;

    return new Promise<boolean>((resolve) => {
      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        unsubClosed();
        lastShownRef.current = Date.now();
        // Preload next ad
        loadedRef.current = false;
        adRef.current = InterstitialAd.createForAdRequest(AD_UNIT_ID);
        adRef.current.load();
        adRef.current.addAdEventListener(AdEventType.LOADED, () => {
          loadedRef.current = true;
        });
        resolve(true);
      });

      ad.show();
    });
  }, []);

  return { showAd };
}
