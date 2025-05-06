import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native"

const Button = ({
  onPress,
  title,
  variant = "default",
  size = "default",
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "outline":
        return styles.buttonOutline
      case "ghost":
        return styles.buttonGhost
      case "link":
        return styles.buttonLink
      case "destructive":
        return styles.buttonDestructive
      default:
        return styles.buttonDefault
    }
  }

  const getTextStyle = () => {
    switch (variant) {
      case "outline":
        return styles.textOutline
      case "ghost":
        return styles.textGhost
      case "link":
        return styles.textLink
      case "destructive":
        return styles.textDestructive
      default:
        return styles.textDefault
    }
  }

  const getSizeStyle = () => {
    switch (size) {
      case "sm":
        return styles.buttonSm
      case "lg":
        return styles.buttonLg
      default:
        return styles.buttonDefault
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
    <TouchableOpacity
      style={[styles.button, getVariantStyle(), getSizeStyle(), disabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "default" || variant === "destructive" ? "#ffffff" : "#7c3aed"}
        />
      ) : (
        <>
          {icon && <Text style={styles.iconContainer}>{icon}</Text>}
          <Text style={[styles.text, getTextStyle(), getTextSizeStyle(), disabled && styles.textDisabled, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonDefault: {
    backgroundColor: "#7c3aed", // Violet (primary)
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#7c3aed",
  },
  buttonGhost: {
    backgroundColor: "transparent",
  },
  buttonLink: {
    backgroundColor: "transparent",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  buttonDestructive: {
    backgroundColor: "#ef4444", // Rouge
  },
  buttonSm: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  buttonLg: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  textDefault: {
    color: "#ffffff",
  },
  textOutline: {
    color: "#7c3aed",
  },
  textGhost: {
    color: "#7c3aed",
  },
  textLink: {
    color: "#7c3aed",
    textDecorationLine: "underline",
  },
  textDestructive: {
    color: "#ffffff",
  },
  textDisabled: {
    color: "#9ca3af",
  },
  textSm: {
    fontSize: 14,
  },
  textLg: {
    fontSize: 18,
  },
  iconContainer: {
    marginRight: 8,
  },
})

export default Button
