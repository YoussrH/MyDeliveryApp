import { View, Text, StyleSheet } from "react-native"

const Card = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>
}

const CardHeader = ({ children, style }) => {
  return <View style={[styles.cardHeader, style]}>{children}</View>
}

const CardTitle = ({ children, style }) => {
  return <Text style={[styles.cardTitle, style]}>{children}</Text>
}

const CardDescription = ({ children, style }) => {
  return <Text style={[styles.cardDescription, style]}>{children}</Text>
}

const CardContent = ({ children, style }) => {
  return <View style={[styles.cardContent, style]}>{children}</View>
}

const CardFooter = ({ children, style }) => {
  return <View style={[styles.cardFooter, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  cardDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  cardContent: {
    marginVertical: 8,
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
})

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
