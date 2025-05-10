import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from "@/contexts/AuthContext";

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  // Animation refs
  const imageScale = useRef(new Animated.Value(0.8)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const imageY = useRef(new Animated.Value(20)).current;
  const imageFloatY = useRef(new Animated.Value(0)).current;
  const imageRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(20)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  // Dot animation refs
  const dotScales = [useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current];
  const dotOpacities = [useRef(new Animated.Value(0.7)).current, useRef(new Animated.Value(0.7)).current, useRef(new Animated.Value(0.7)).current];

  const { utilisateur, token, chargement } = useAuth();

  useEffect(() => {
    // Image animation (scale, opacity, y)
    Animated.parallel([
      Animated.timing(imageScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(imageY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation for image
    Animated.loop(
      Animated.sequence([
        Animated.timing(imageFloatY, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(imageFloatY, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation for image
    Animated.loop(
      Animated.sequence([
        Animated.timing(imageRotate, {
          toValue: 2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(imageRotate, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(imageRotate, {
          toValue: -2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(imageRotate, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Text animation
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(textY, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Dots animation
    Animated.timing(dotsOpacity, {
      toValue: 1,
      duration: 1000,
      delay: 600,
      useNativeDriver: true,
    }).start();

    // Individual dot animations
    dotScales.forEach((scale, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.5,
            duration: 750,
            delay: index * 200,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    dotOpacities.forEach((opacity, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 750,
            delay: index * 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Set up navigation timeout
    const navigationTimer = setTimeout(() => {
      if (!chargement) {
        if (utilisateur && token) {
          navigation.replace("App");
        } else {
          navigation.replace("Auth");
        }
      }
    }, 3000); // Total duration (animation + slight delay)

    return () => {
      clearTimeout(navigationTimer);
    };
  }, [chargement, utilisateur, token]);

  const rotateInterpolate = imageRotate.interpolate({
    inputRange: [-2, 0, 2],
    outputRange: ['-2deg', '0deg', '2deg'],
  });

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <LinearGradient
        colors={['#000000', '#FD683D']}
        style={styles.gradient}
      />
 

{/* <LinearGradient
  colors={['#A2451D', '#A2451D','#CF7136','#CF7136','#CF7136','#CF7136', '#FDB75E']}
  style={styles.gradient}
/> */}

      <View style={styles.content}>
        {/* Image container with shadow */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [{ scale: imageScale }, { translateY: imageY }],
              opacity: imageOpacity,
            },
          ]}
        >
          <View style={styles.innerImageContainer}>
            <View style={styles.imageBorder}>
              <Animated.View
                style={{
                  width: '90%',
                  height: '90%',
                  transform: [
                    { translateY: imageFloatY },
                    { rotate: rotateInterpolate },
                  ],
                }}
              >
                <Image
                  source={require('../../../assets/delivery-rider.png')} // Adjust path as needed
                  style={styles.image}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        {/* App name with enhanced styling */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textY }],
            alignItems: 'center',
          }}
        >
          <Text style={styles.title}>
            Livreur <Text style={styles.titleHighlight}>Pro </Text>
          </Text>
          <Text style={styles.tagline}>
            {chargement ? "Chargement..." : "Votre partenaire de livraison"}
          </Text>
        </Animated.View>

        {/* Loading indicator */}
        <Animated.View style={[styles.dotsContainer, { opacity: dotsOpacity }]}>
          {dotScales.map((scale, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  transform: [{ scale: scale }],
                  opacity: dotOpacities[index],
                },
              ]}
            />
          ))}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.9,
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  imageContainer: {
    width: 256,
    height: 256,
    marginBottom: 32,
    borderRadius: 128,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  innerImageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 128,
    backgroundColor: '#fff', // Simulating gradient with solid color
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBorder: {
    width: '100%',
    height: '100%',
    borderWidth: 4,
    borderColor: '#FEAB87',
    borderRadius: 128,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  titleHighlight: {
    color: '#F68B5E',
  },
  tagline: {
    marginTop: 24,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  dotsContainer: {
    marginTop: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    backgroundColor: '#F68B5E',
    borderRadius: 6,
    marginHorizontal: 4,
  },
});

export default SplashScreen;