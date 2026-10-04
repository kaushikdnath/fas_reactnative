import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

type LoadingBarProps = {
  visible: boolean;
};

export default function LoadingBar({ visible }: LoadingBarProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      progress.stopAnimation();
      return;
    }

    progress.setValue(0);

    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
      progress.stopAnimation();
    };
  }, [visible, progress]);

  return (
    <View style={styles.container}>
      {visible && (
        <Animated.View
          style={[
            styles.bar,
            {
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["-100%", "300%"],
                  }),
                },
              ],
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 1,
    width: "100%",
    overflow: "hidden",
  },

  bar: {
    position: "absolute",
    left: 0,
    height: "100%",
    width: "45%",
    backgroundColor: "#2196F3",
  },
});
