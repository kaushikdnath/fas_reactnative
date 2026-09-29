import Constants from "expo-constants";
import { Animated, StyleSheet, View } from "react-native";
type LoadingBarProps = {
  visible: boolean;
};
export default function LoadingBar({ visible = true }: LoadingBarProps) {
  return (
    <View style={styles.progressBar}>
      <Animated.View style={{ backgroundColor: "white", width: "50%" }} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column", //column direction
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Constants.statusBarHeight,
    backgroundColor: "#ecf0f1",
    padding: 8,
  },
  progressBar: {
    height: 20,
    flexDirection: "row",
    width: "100%",
    backgroundColor: "white",
    borderColor: "#000",
    borderWidth: 2,
    borderRadius: 5,
  },
});
