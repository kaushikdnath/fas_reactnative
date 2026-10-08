import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PageContainer from "@/components/PageContainer";
import { ThemedText } from "@/components/themed-text";
import { AppBar } from "@/components/ui/AppBar";
import { Button } from "@/components/ui/button";
import { ChipRow } from "@/components/ui/chip";
import { ListRow } from "@/components/ui/list-row";
import { TextField } from "@/components/ui/text-field";
import { Spacing } from "@/constants/theme";
import { useThemeMode } from "@/hooks/theme-mode-context";
import {
  getInstitutionName,
  getSmsConfig,
  saveInstitutionName,
  saveSmsConfig,
} from "@/services/settings";
import { NativeModules } from "react-native";

const { SimInfo } = NativeModules;

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { mode, setMode, palette, setPalette } = useThemeMode();

  const [institutionName, setInstitutionName] = useState("");
  const [selectedSIM, setSelectedSIM] = useState("1");
  const [activeSIMS, setActiveSIMS] = useState([]);

  useEffect(() => {
    getInstitutionName().then(setInstitutionName);

    const getActiveSIMs = async () => {
      const sims = await SimInfo.getActiveSims();
      setActiveSIMS(sims);
    };
    getActiveSIMs();
    getSmsConfig().then((c) => {
      setSelectedSIM(c.selectedSIM);
    });
  }, []);
  const saveSelectedSim = async (sim: string) => {
    await saveSmsConfig(sim);
    setSelectedSIM(sim);
  };
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
          <ChipRow
            options={[
              { label: "System", value: "system" },
              { label: "Light", value: "light" },
              { label: "Dark", value: "dark" },
            ]}
            selected={mode}
            onSelect={setMode}
            styleCss={{ gap: 0 }}
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
          <ChipRow
            options={activeSIMS.map((s) => {
              return {
                label: `${s["displayName"]} (SIM ${(s["slotIndex"] ?? 0) + 1})`,
                value: s["subscriptionId"] + "",
              };
            })}
            selected={selectedSIM}
            onSelect={saveSelectedSim}
            styleCss={{ flex: 1 }}
            chipStyleCss={{ flex: 1, height: 40 }}
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
