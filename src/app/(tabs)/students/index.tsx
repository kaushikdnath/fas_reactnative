import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Avatar } from "@/components/ui/avatar";
import { Chip, ChipRow } from "@/components/ui/chip";
import { Fab } from "@/components/ui/fab";
import { ListRow } from "@/components/ui/list-row";
import { SearchBar } from "@/components/ui/search-bar";
import {
  EmptyStateView,
  ErrorView,
  LoadingView,
} from "@/components/ui/state-views";
import { Spacing } from "@/constants/theme";
import { listBatches } from "@/data/batch-repository";
import { listStudents } from "@/data/student-repository";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type {
  Batch,
  Student,
  StudentFilter,
  StudentStatusFilter,
} from "@/types/models";

const PAGE_SIZE = 40;

export default function StudentList() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [statusFilter, setStatusFilter] =
    useState<StudentStatusFilter>("active");
  const [batchFilter, setBatchFilter] = useState<number | "all">("all");
  const [batches, setBatches] = useState<Batch[]>([]);

  const [students, setStudents] = useState<Student[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBatches(false).then((r) => {
      if (r.ok) setBatches(r.value);
    });
  }, []);

  const filter: StudentFilter = useMemo(
    () => ({
      query: debouncedQuery || undefined,
      status: statusFilter,
      batchId: batchFilter === "all" ? undefined : batchFilter,
    }),
    [debouncedQuery, statusFilter, batchFilter],
  );

  const fetchPage = useCallback(
    async (p: number, append: boolean) => {
      append ? setLoadingMore(true) : setLoading(true);
      const result = await listStudents(filter, p, PAGE_SIZE);
      if (result.ok) {
        setStudents((prev) =>
          append ? [...prev, ...result.value.students] : result.value.students,
        );
        setTotalCount(result.value.totalCount);
        setHasMore(result.value.hasMore);
        setPage(p);
        setError(null);
      } else {
        setError(result.failure.message);
      }
      setLoading(false);
      setLoadingMore(false);
    },
    [filter],
  );

  useFocusEffect(
    useCallback(() => {
      fetchPage(0, false);
    }, [fetchPage]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPage(0, false);
    setRefreshing(false);
  };
  const loadMore = () => {
    if (!loadingMore && hasMore) fetchPage(page + 1, true);
  };

  const batchOptions = [
    { value: "all" as const, label: "All batches" },
    ...batches.map((b) => ({
      value: b.id,
      label: `${b.name}, ${b.academicYear}`,
    })),
  ];
  const statusOptions: Array<{ value: StudentStatusFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  return (
    <ThemedView style={styles.page}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <ThemedText type="title">Students</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {totalCount} total
        </ThemedText>
      </View>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search name, code, or guardian mobile"
      />
      <View style={{ flexDirection: "row", marginBottom: 20 }}>
        <Chip
          key={String(batchOptions[0].value)}
          label={batchOptions[0].label}
          selected={"all" === batchFilter}
          onPress={() => setBatchFilter(batchOptions[0].value)}
          styleCss={{ flex: 1, maxWidth: 70 }}
        />
        <ChipRow
          options={batchOptions.filter((b) => b.value !== "all")}
          selected={batchFilter}
          onSelect={setBatchFilter}
        />
      </View>
      <View style={{ flexDirection: "row", marginBottom: 20 }}>
        <Chip
          key={String(statusOptions[0].value)}
          label={statusOptions[0].label}
          selected={"all" === statusFilter}
          onPress={() => setStatusFilter(statusOptions[0].value)}
          styleCss={{ flex: 1, maxWidth: 70 }}
        />
        <ChipRow
          options={statusOptions.filter((b) => b.value !== "all")}
          selected={statusFilter}
          onSelect={setStatusFilter}
        />
      </View>

      {loading && students.length === 0 ? (
        <LoadingView message="Loading students\u2026" />
      ) : error ? (
        <ErrorView message={error} onRetry={() => fetchPage(0, false)} />
      ) : students.length === 0 ? (
        <EmptyStateView
          icon="\uD83D\uDD0D"
          title="No students found"
          subtitle="Try a different search, or add a new student."
          actionLabel="Add student"
          onAction={() => router.push("/students/new")}
        />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footerLoader} />
            ) : null
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={`${item.code} \u00B7 ${item.batchName ?? "Unassigned"}`}
              leading={
                <Avatar name={item.name} uri={item.photoUri} size={44} />
              }
              onPress={() => router.push(`/students/${item.id}`)}
            />
          )}
        />
      )}

      <Fab
        label="+"
        onPress={() =>
          router.push(
            batchFilter === "all"
              ? "/students/new"
              : {
                  pathname: "/students/new",
                  params: { batchId: String(batchFilter) },
                },
          )
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    gap: 2,
  },
  list: { paddingBottom: 96, paddingTop: Spacing.two },
  footerLoader: { marginVertical: Spacing.three },
});
