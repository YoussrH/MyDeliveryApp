import { View, Text, StyleSheet } from "react-native"

const Badge = ({ children, variant = "default", size = "default", style, textStyle }) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.badgeSecondary
      case "outline":
        return styles.badgeOutline
      case "success":
        return styles.badgeSuccess
      case "warning":
        return styles.badgeWarning
      case "danger":
        return styles.badgeDanger
      default:
        return styles.badgeDefault
    }
  }

  const getTextStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.textSecondary
      case "outline":
        return styles.textOutline
      case "success":
        return styles.textSuccess
      case "warning":
        return styles.textWarning
      case "danger":
        return styles.textDanger
      default:
        return styles.textDefault
    }
  }

  const getSizeStyle = () => {
    switch (size) {
      case "sm":
        return styles.badgeSm
      case "lg":
        return styles.badgeLg
      default:
        return {}
    }
  }

  const getTextSizeStyle = () => {
    switch (size) {
      case "sm":
        return styles.textSm
      case "lg":
        return styles.textLg
      default:
        return {}
    }
  }

  return (
    <View style={[styles.badge, getVariantStyle(), getSizeStyle(), style]}>
      <Text style={[styles.text, getTextStyle(), getTextSizeStyle(), textStyle]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeDefault: {
    backgroundColor: "#7c3aed",
  },
  badgeSecondary: {
    backgroundColor: "#6b7280",
  },
  badgeOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#7c3aed",
  },
  badgeSuccess: {
    backgroundColor: "#10b981",
  },
  badgeWarning: {
    backgroundColor: "#f59e0b",
  },
  badgeDanger: {
    backgroundColor: "#ef4444",
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeLg: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
  textDefault: {
    color: "#ffffff",
  },
  textSecondary: {
    color: "#ffffff",
  },
  textOutline: {
    color: "#7c3aed",
  },
  textSuccess: {
    color: "#ffffff",
  },
  textWarning: {
    color: "#ffffff",
  },
  textDanger: {
    color: "#ffffff",
  },
  textSm: {
    fontSize: 10,
  },
  textLg: {
    fontSize: 14,
  },
})

export default Badge
