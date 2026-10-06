import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PageContainer from "@/components/PageContainer";
import { ThemedText } from "@/components/themed-text";
import { AppBar } from "@/components/ui/AppBar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ListRow } from "@/components/ui/list-row";
import { TextField } from "@/components/ui/text-field";
import { Spacing } from "@/constants/theme";
import { useThemeMode } from "@/hooks/theme-mode-context";
import {
  getInstitutionName,
  getSmsConfig,
  saveInstitutionName,
} from "@/services/settings";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { mode, setMode, palette, setPalette } = useThemeMode();

  const [institutionName, setInstitutionName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [token, setToken] = useState("");
  const [sim, setSim] = useState("sim1");

  useEffect(() => {
    getInstitutionName().then(setInstitutionName);
    getSmsConfig().then((c) => {
      setBaseUrl(c.baseUrl);
      setToken(c.token);
    });
  }, []);

  return (
    <>
      <AppBar title="Settings" subtitle="Configure app preferences" />
      <PageContainer>
        <ThemedText
          type="label"
          themeColor="textSecondary"
          style={styles.sectionLabel}
        >
          APPEARANCE
        </ThemedText>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 10,
            paddingHorizontal: Spacing.three,
          }}
        >
          <Chip
            key="system"
            label="System"
            selected={"system" == mode}
            onPress={() => setMode("system")}
          />
          <Chip
            key="light"
            label="Light"
            selected={"light" == mode}
            onPress={() => setMode("light")}
          />
          <Chip
            key="dark"
            label="Dark"
            selected={"dark" == mode}
            onPress={() => setMode("dark")}
          />
        </View>

        <View style={styles.card}>
          <TextField
            label="Institution name"
            value={institutionName}
            onChangeText={setInstitutionName}
            placeholder="e.g. Sunrise Public School"
          />
          <Button
            label="Save"
            variant="tonal"
            onPress={() => saveInstitutionName(institutionName.trim())}
          />
        </View>

        <ThemedText type="label" themeColor="textSecondary" style={styles.card}>
          SIM FOR SENDING SMS
        </ThemedText>
        <View style={styles.card}>
          <Chip
            key="sim1"
            label="Sim 1"
            selected={"sim1" == sim}
            onPress={() => setSim("sim1")}
            styleCss={{ paddingBottom: Spacing.two, paddingTop: Spacing.two }}
          />
        </View>

        <ThemedText
          type="label"
          themeColor="textSecondary"
          style={[styles.card, { marginBottom: Spacing.two }]}
        >
          DEVICE &amp; DATA
        </ThemedText>
        <ListRow
          title="Fingerprint scanner"
          subtitle="Connect, initialize, and check sensor info"
          onPress={() => router.push("/device")}
        />
        <ListRow
          title="Manage fingerprints"
          subtitle="View or remove all enrolled templates"
          onPress={() => router.push("/fingerprints")}
        />
        <ListRow
          title="SMS log"
          subtitle="History of sent and failed messages"
          onPress={() => router.push("/sms-log")}
        />

        <ThemedText
          type="label"
          themeColor="textSecondary"
          style={styles.sectionLabel}
        >
          ABOUT
        </ThemedText>
        <ListRow title="App version" subtitle="1.0.0" />
        <ListRow title="Fingerprint hardware" subtitle="AS608 sensor" />
      </PageContainer>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  scroll: { paddingBottom: 96 },
  header: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.two },
  sectionLabel: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  card: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.one,
    marginTop: Spacing.three,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.two,
  },
  switchLabel: { flex: 1, marginRight: Spacing.two },
  testStatus: { marginTop: Spacing.one },
});
