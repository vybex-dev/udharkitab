/**
 * hooks/useNetworkStatus.js
 * Thin wrapper around @react-native-community/netinfo.
 *
 * Exposes `isConnected` (null while the first check is still in flight,
 * then true/false) and a `refresh()` you can call from a "Retry" button
 * to force an immediate re-check instead of waiting for the next
 * passive NetInfo event.
 */

import { useEffect, useState, useCallback } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(null); // null = unknown yet

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable can be null on some platforms right after a
      // change fires — fall back to isConnected in that case so we don't
      // flicker into a false "offline" read.
      const reachable =
        state.isInternetReachable ?? state.isConnected ?? false;
      setIsConnected(!!reachable);
    });

    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    const state = await NetInfo.fetch();
    const reachable = state.isInternetReachable ?? state.isConnected ?? false;
    setIsConnected(!!reachable);
    return !!reachable;
  }, []);

  return { isConnected, refresh };
}
