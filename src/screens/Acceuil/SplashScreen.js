"use client"

import { useEffect, useRef } from "react"
import { View, Text, Animated, Easing } from "react-native"
import { FontAwesome5 } from "@expo/vector-icons"
import tw from "@/utils/tw"
import { useAuth } from "@/contexts/AuthContext"

const SplashScreen = ({ navigation }) => {
  // Animation references
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const translateYAnim = useRef(new Animated.Value(20)).current
  const logoRotateAnim = useRef(new Animated.Value(0)).current

  const { utilisateur, token, chargement } = useAuth()

  useEffect(() => {
    // Enhanced animation sequence
    const animation = Animated.sequence([
      // First animate the logo appearance
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Then add a subtle rotation to the logo
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ])

    // Set up navigation timeout
    const navigationTimer = setTimeout(() => {
      if (!chargement) {
        if (utilisateur && token) {
          navigation.replace("App")
        } else {
          navigation.replace("Auth")
        }
      }
    }, 8000) // Extended slightly for better animation experience

    animation.start()

    return () => {
      animation.stop()
      clearTimeout(navigationTimer)
    }
  }, [chargement, utilisateur, token])

  // Convert rotation value to interpolated string
  const spin = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "10deg"],
  })

  return (
    <View style={tw`items-center justify-center flex-1 bg-black`}>
      {/* Background gradient effect */}
      <View style={tw`absolute inset-0 bg-black opacity-90`} />

      <Animated.View
        style={[
          tw`items-center`,
          {
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Logo container with shadow */}
        <Animated.View
          style={[
            tw`items-center justify-center w-24 h-24 mb-8 bg-orange-100 rounded-full`,
            {
              transform: [{ rotate: spin }],
              shadowColor: "#FF6F31",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 10,
            },
          ]}
        >
          {/* Outer ring */}
          <View style={tw`items-center justify-center border-4 border-orange-300 rounded-full w-22 h-22`}>
            <FontAwesome5 name="motorcycle" style={tw`text-black`} size={40} />
          </View>
        </Animated.View>

        {/* App name with enhanced styling */}
        <Text style={tw`text-4xl font-bold tracking-wide text-white`}>
          Livreur <Text style={tw`text-orange-300`}>Pro</Text>
        </Text>
 

        {/* Additional tagline */}
        <Text style={tw`mt-6 text-sm text-gray-400`}>Votre partenaire de livraison</Text>
      </Animated.View>
    </View>
  )
}

export default SplashScreen
