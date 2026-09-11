import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { stats } from "../services/repositories";
export default function Home() {
  const [s, setS] = useState<any>({ students: 0, batches: 0, present: 0 });
  useEffect(() => {
    stats().then(setS);
  }, []);
  return (
    <ScrollView style={st.page}>
      <Text style={st.title}>Attendance</Text>
      <Text style={st.sub}>AS608 fingerprint attendance system</Text>
      <View style={st.grid}>
        {[
          ["Students", s.students, "/students"],
          ["Batches", s.batches, "/batches"],
          ["Present Today", s.present, "/attendance"],
          ["Device", "AS608", "/device"],
          ["Fingerprints", "Enroll", "/fingerprints"],
        ].map(([a, b, p]: any) => (
          <TouchableOpacity
            key={a}
            style={st.card}
            onPress={() => router.push(p)}
          >
            <Text style={st.num}>{b}</Text>
            <Text style={st.label}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={st.primary}
        onPress={() => router.push("/attendance")}
      >
        <Text style={st.primaryText}>Start Attendance</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={st.secondary}
        onPress={() => router.push("/students")}
      >
        <Text>Manage Students</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={st.secondary}
        onPress={() => router.push("/device")}
      >
        <Text>Fingerprint Device</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={st.secondary}
        onPress={() => router.push("/settings")}
      >
        <Text>Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const st = StyleSheet.create({
  page: { flex: 1, padding: 24, backgroundColor: "#f7f8fa" },
  title: { fontSize: 32, fontWeight: "800", marginTop: 40 },
  sub: { color: "#68707c", marginBottom: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
  },
  num: { fontSize: 28, fontWeight: "800" },
  label: { color: "#667085", marginTop: 6 },
  primary: {
    backgroundColor: "#111827",
    padding: 17,
    borderRadius: 14,
    marginTop: 24,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  secondary: {
    backgroundColor: "#fff",
    padding: 17,
    borderRadius: 14,
    marginTop: 12,
    alignItems: "center",
  },
});
