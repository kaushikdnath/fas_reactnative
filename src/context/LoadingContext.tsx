import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useColorScheme } from "react-native";

export type LoadingOptions = {
  /** Text message displayed below the loading animation */
  message?: string;
  /** Whether tapping the backdrop or pressing the hardware back button dismisses the loader */
  cancelable?: boolean;
  /** Callback triggered when the loader is canceled by the user */
  onCancel?: () => void;
};

export type LoadingContextType = {
  /** Whether the loading overlay is currently visible */
  isLoading: boolean;
  /** Current loading message, or null if none */
  message: string | null;
  /**
   * Display the loading animation overlay.
   * Can be called with a simple string message or full LoadingOptions.
   */
  showLoading: (messageOrOptions?: string | LoadingOptions) => void;
  /**
   * Hide the loading animation overlay.
   * If `force` is true, resets all concurrent loading requests immediately.
   */
  hideLoading: (force?: boolean) => void;
  /** Dynamically update the displayed message while loading is active */
  setMessage: (message: string | null) => void;
  /**
   * Executes an async operation wrapped in the loading animation.
   * Automatically shows loading before execution and hides loading when completed or failed.
   */
  withLoading: <T>(
    operation: () => Promise<T>,
    messageOrOptions?: string | LoadingOptions,
  ) => Promise<T>;
};

type LoadingManager = {
  showLoading: (messageOrOptions?: string | LoadingOptions) => void;
  hideLoading: (force?: boolean) => void;
  setMessage: (message: string | null) => void;
  withLoading: <T>(
    operation: () => Promise<T>,
    messageOrOptions?: string | LoadingOptions,
  ) => Promise<T>;
};

let globalLoadingManager: LoadingManager | null = null;

/**
 * Imperative loading controller for use outside React component trees
 * (e.g. within data repositories, services, and background tasks).
 */
export const globalLoading = {
  show: (messageOrOptions?: string | LoadingOptions) => {
    globalLoadingManager?.showLoading(messageOrOptions);
  },
  hide: (force?: boolean) => {
    globalLoadingManager?.hideLoading(force);
  },
  setMessage: (message: string | null) => {
    globalLoadingManager?.setMessage(message);
  },
  withLoading: async <T,>(
    operation: () => Promise<T>,
    messageOrOptions?: string | LoadingOptions,
  ): Promise<T> => {
    if (globalLoadingManager) {
      return globalLoadingManager.withLoading(operation, messageOrOptions);
    }
    return operation();
  },
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

/**
 * Animated circular spinner built with react-native-reanimated.
 * Can be used standalone or inside the global LoadingOverlay.
 */
export function LoadingSpinner({
  size = 48,
  color,
  style,
}: {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const spinnerColor = color ?? theme.primary;
  const trackColor = theme.outlineVariant + "40";
  const strokeWidth = Math.max(3, Math.round(size / 12));

  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(0.9);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 650, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.85, { duration: 650, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(pulseScale);
    };
  }, [rotation, pulseScale]);

  const animatedSpinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const halfSize = size / 2;
  const innerDotSize = Math.max(7, Math.round(size / 4.8));

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
      accessibilityRole="progressbar"
    >
      {/* Background Track Circle */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: halfSize,
          borderWidth: strokeWidth,
          borderColor: trackColor,
        }}
      />

      {/* Animated Rotating Arc */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: size,
            height: size,
            borderRadius: halfSize,
            borderWidth: strokeWidth,
            borderColor: "transparent",
            borderTopColor: spinnerColor,
            borderRightColor: spinnerColor,
          },
          animatedSpinnerStyle,
        ]}
      />

      {/* Animated Center Pulse Indicator */}
      <Animated.View
        style={[
          {
            width: innerDotSize,
            height: innerDotSize,
            borderRadius: innerDotSize / 2,
            backgroundColor: spinnerColor,
            opacity: 0.85,
          },
          animatedPulseStyle,
        ]}
      />
    </View>
  );
}

/**
 * Full-screen loading overlay containing the animated spinner and optional message.
 */
export function LoadingOverlay({
  visible,
  message,
  cancelable,
  onCancel,
}: {
  visible: boolean;
  message?: string | null;
  cancelable?: boolean;
  onCancel?: () => void;
}) {
  const theme = useTheme();
  const colorScheme = useColorScheme();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (cancelable && onCancel) {
          onCancel();
        }
      }}
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          if (cancelable && onCancel) {
            onCancel();
          }
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ width: "100%", alignItems: "center" }}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.outlineVariant + "50",
                shadowColor: "#000",
              },
            ]}
          >
            <LoadingSpinner
              size={50}
              color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            />
            {message ? (
              <ThemedText
                type="body"
                style={styles.messageText}
                accessibilityLiveRegion="polite"
              >
                {message}
              </ThemedText>
            ) : null}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * LoadingProvider gives any child component access to `useLoading()`.
 * Automatically mounts a full-screen animated LoadingOverlay when active.
 */
export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [options, setOptions] = useState<LoadingOptions | undefined>(undefined);

  // Counter to properly handle overlapping/concurrent loading calls
  const activeCountRef = useRef(0);

  const showLoading = useCallback(
    (messageOrOptions?: string | LoadingOptions) => {
      activeCountRef.current += 1;

      if (typeof messageOrOptions === "string") {
        setMessage(messageOrOptions);
        setOptions(undefined);
      } else if (messageOrOptions) {
        setMessage(messageOrOptions.message ?? null);
        setOptions(messageOrOptions);
      } else {
        setMessage(null);
        setOptions(undefined);
      }

      setIsLoading(true);
    },
    [],
  );

  const hideLoading = useCallback((force = false) => {
    if (force) {
      activeCountRef.current = 0;
      setIsLoading(false);
      setMessage(null);
      setOptions(undefined);
      return;
    }

    activeCountRef.current = Math.max(0, activeCountRef.current - 1);
    if (activeCountRef.current === 0) {
      setIsLoading(false);
      setMessage(null);
      setOptions(undefined);
    }
  }, []);

  const handleCancel = useCallback(() => {
    options?.onCancel?.();
    hideLoading(true);
  }, [options, hideLoading]);

  const withLoading = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      messageOrOptions?: string | LoadingOptions,
    ): Promise<T> => {
      showLoading(messageOrOptions);
      try {
        return await operation();
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading],
  );

  useEffect(() => {
    globalLoadingManager = {
      showLoading,
      hideLoading,
      setMessage,
      withLoading,
    };
    return () => {
      globalLoadingManager = null;
    };
  }, [showLoading, hideLoading, setMessage, withLoading]);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        message,
        showLoading,
        hideLoading,
        setMessage,
        withLoading,
      }}
    >
      {children}
      <LoadingOverlay
        visible={isLoading}
        message={message}
        cancelable={options?.cancelable}
        onCancel={handleCancel}
      />
    </LoadingContext.Provider>
  );
}

/**
 * Hook to consume the LoadingContext.
 *
 * Example:
 * ```tsx
 * const { showLoading, hideLoading, withLoading } = useLoading();
 *
 * // Option 1: Manual show/hide
 * showLoading("Saving student...");
 * await saveStudent(data);
 * hideLoading();
 *
 * // Option 2: Automatic wrapper
 * await withLoading(() => saveStudent(data), "Saving student...");
 * ```
 */
export function useLoading(): LoadingContextType {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }

  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.four,
  },
  card: {
    minWidth: 140,
    maxWidth: 280,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.five,
    borderRadius: Radius.xlarge,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  messageText: {
    marginTop: Spacing.three,
    textAlign: "center",
    fontWeight: "500",
  },
});
