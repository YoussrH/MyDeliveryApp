import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import tw from "@/utils/tw";
import { useAuth } from "@/contexts/AuthContext";

const SplashScreen = ({ navigation }) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const { checkAuth } = useAuth();
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start(() => {
      setAnimationComplete(true);
    });

    return () => animation.stop();
  }, []);

  useEffect(() => {
    if (animationComplete) {
      const timer = setTimeout(() => {
        checkAuth().then(user => {
          if (user) {
            navigation.replace("MainTabs");
          } else {
            navigation.replace("Auth");
          }
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [animationComplete]);

  return (
    <View style={tw`flex-1 justify-center items-center bg-white`}>
      <Animated.View
        style={[
          tw`items-center`,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={tw`w-20 h-20 rounded-full bg-violet-100 justify-center items-center mb-6`}>
          <FontAwesome5 name="motorcycle" style={tw`text-violet-600`} size={40} />
        </View>
        <Text style={tw`text-3xl font-bold text-slate-800`}>Livreur Pro</Text>
        <Text style={tw`text-lg text-slate-500 mt-2`}>Livraisons intelligentes</Text>
      </Animated.View>
    </View>
  );
};

export default SplashScreen;