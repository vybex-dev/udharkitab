/**
 * components/analytics/WeeklyFlowChart.jsx
 * Simple 7-bar chart of daily collected amounts, no chart library —
 * just Views sized proportionally. Used on the analytics-style Home
 * screen's "Weekly Flow" card.
 */

import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";

const DAY_LETTERS_EN = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_LETTERS_HI = ["र", "सो", "मं", "बु", "गु", "शु", "श"];

export default function WeeklyFlowChart({ data = [], language = "en" }) {
  const max = Math.max(1, ...data.map((d) => d.collected));
  const dayLetters = language === "hi" ? DAY_LETTERS_HI : DAY_LETTERS_EN;

  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {data.map((d, idx) => {
          const heightPct = d.collected > 0 ? (d.collected / max) * 100 : 4;
          const isToday = idx === data.length - 1;
          return (
            <View key={d.date || idx} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightPct}%`,
                      backgroundColor: isToday
                        ? colors.primary
                        : colors.primaryLight,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {dayLetters[new Date(d.date).getDay()] ?? "-"}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 4 },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 90,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barTrack: {
    width: 18,
    height: 70,
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderRadius: 6,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textTertiary,
  },
  dayLabelToday: {
    color: colors.primary,
    fontWeight: "800",
  },
});
