import { MaterialIcons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AppHeaderProps = {
  onNotificationPress?: () => void;
  onMenuPress?: () => void;
};

export default function AppHeader({
  onNotificationPress,
  onMenuPress,
}: AppHeaderProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
        {/* Logo + title */}
        <View style={styles.brand}>
          <Image
            source={require("@/assets/images/icons/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              Ankit <Text style={styles.fas}>FAS</Text>
            </Text>

            <Text style={styles.subtitle}>Fingerprint Attendance System</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={onNotificationPress}>
            <MaterialIcons
              name="notifications-none"
              size={25}
              color="#172B4D"
            />
          </Pressable>

          <Pressable style={styles.actionButton} onPress={onMenuPress}>
            <MaterialIcons name="more-vert" size={25} color="#172B4D" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 64,

    backgroundColor: "#FFFFFF",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 14,

    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",

    elevation: 2,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  logo: {
    width: 65,
    height: 65,
  },

  titleContainer: {
    marginLeft: 9,
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#172B4D",
  },

  fas: {
    color: "#2878D7",
  },

  subtitle: {
    fontSize: 8.5,
    color: "#64748B",
    marginTop: 1,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
});
