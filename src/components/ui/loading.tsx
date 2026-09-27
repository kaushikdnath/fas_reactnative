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

      Animated.timing(progress, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();

      return;
    }

    progress.setValue(0);

    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 0.7,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0.25,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [visible, progress]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.bar,
          {
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 3,
    width: "100%",
    overflow: "hidden",
  },

  bar: {
    height: "100%",
    backgroundColor: "#2196F3",
  },
});
