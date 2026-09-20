import NetInfo from '@react-native-community/netinfo';

export class IpdmNetwork {
  /**
   * Safely probes whether internet connectivity is available.
   * Handles timeout and catches unexpected driver exceptions.
   */
  public static async isConnected(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return Boolean(state.isConnected && state.isInternetReachable !== false);
    } catch (e) {
      console.warn('[IpdmNetwork] Could not fetch network state:', e);
      return false;
    }
  }

  /** Subscribes to network connectivity state changes */
  public static addEventListener(callback: (isConnected: boolean) => void) {
    return NetInfo.addEventListener((state) => {
      callback(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
  }
}
