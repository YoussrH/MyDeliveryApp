"use client"
import { View, Text, Switch as RNSwitch, StyleSheet } from "react-native"

const Switch = ({ value, onValueChange, label, disabled = false, style }) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: "#e5e7eb", true: "#7c3aed" }}
        thumbColor={value ? "#ffffff" : "#ffffff"}
        ios_backgroundColor="#e5e7eb"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 16,
    color: "#374151",
    marginRight: 8,
  },
})

export default Switch
