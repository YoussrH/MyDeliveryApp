import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TouchableOpacity, View, Text, ActivityIndicator } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useLivreurSocket } from "@/contexts/SocketContext";
import tw from "@/utils/tw";

// Screens
import SplashScreen from "@/screens/Acceuil/SplashScreen";
import ConnexionScreen from "@/screens/Auth/ConnexionScreen";
import AccueilScreen from "@/screens/Acceuil/AccueilScreen";
import LivraisonsScreen from "@/screens/Commande/LivraisonsScreen";
import ScannerScreen from "@/screens/ScannerScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import DetailCommandeScreen from "@/screens/Commande/DetailCommandeScreen";
import MotDePasseOublieScreen from "@/screens/Auth/MotDePasseOublieScreen";
import ReinitialiserMotDePasseScreen from "@/screens/Auth/ReinitialiserMotDePasseScreen";
import ChangerMotDePasseScreen from "@/screens/Auth/ChangerMotDePasseScreen";
import VerifierCodeScreen from "@/screens/Auth/VerifierCodeScreen";
import ProfilScreen from "@/screens/Auth/ProfilScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const ScanButton = ({ children, onPress }) => {
  return (
    <TouchableOpacity 
      style={tw`top-[-20px] justify-center items-center`} 
      onPress={onPress} 
      activeOpacity={0.9}
    >
      <View style={tw`items-center justify-center bg-orange-600 rounded-full shadow-lg w-14 h-14 shadow-orange-600/30`}>
        {children}
      </View>
    </TouchableOpacity>
  );
};

const HeaderRight = ({ navigation }) => {
  const { notifications } = useLivreurSocket();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={tw`flex-row items-center pr-4`}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('Notifications')}
        style={tw`relative mr-2`}
      >
        <Ionicons 
          name="notifications-outline" 
          size={24} 
          color={tw.color("slate-600")} 
        />
        {unreadCount > 0 && (
          <View style={tw`absolute items-center justify-center w-5 h-5 bg-orange-600 rounded-full -top-1 -right-1`}>
            <Text style={tw`text-xs text-white`}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const TabNavigator = () => {
  const { notifications } = useLivreurSocket();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: tw`h-16 bg-white border-t-0 shadow-md`,
        tabBarActiveTintColor: tw.color("text-orange-600"),
        tabBarInactiveTintColor: tw.color("text-slate-500"),
        tabBarShowLabel: true,
        headerShown: route.name !== 'Accueil',
        tabBarLabelStyle: tw`pb-1 text-xs font-medium`,
        headerRight: () => <HeaderRight navigation={route.params?.navigation} />,
        headerRightContainerStyle: tw`pr-4`,
      })}
    >
      <Tab.Screen
        name="Accueil"
        component={AccueilScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              color={color} 
              size={24} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Mes livraisons"
        component={LivraisonsScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "package-variant" : "package-variant-closed"} 
              color={color} 
              size={24} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="qrcode-scan" color="white" size={26} style={tw`justify-center items-center ml-0.5`} />
          ),
          tabBarLabel: () => null,
          tabBarButton: (props) => <ScanButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "notifications" : "notifications-outline"} 
              color={color} 
              size={24} 
            />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: tw`text-white bg-orange-600`,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              color={color} 
              size={24} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Connexion" 
      component={ConnexionScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="MotDePasseOublie" 
      component={MotDePasseOublieScreen}
      options={{
        headerShown: true,
        title: "Mot de passe oublié",
        headerTitleStyle: tw`font-mono text-lg font-semibold text-slate-800`,
        headerBackTitleVisible: false,
        headerTintColor: tw.color("text-orange-600"),
        headerStyle: tw`bg-white border-b border-slate-200`,
      }}
    />
    <Stack.Screen 
      name="VerifierCode" 
      component={VerifierCodeScreen}
      options={{
        headerShown: true,
        title: "Vérification",
        headerTitleStyle: tw`font-mono text-lg font-semibold text-slate-800`,
        headerBackTitleVisible: false,
        headerTintColor: tw.color("text-orange-600"),
        headerStyle: tw`bg-white border-b border-slate-200`,
      }}
    />
    <Stack.Screen 
      name="ReinitialiserMotDePasse" 
      component={ReinitialiserMotDePasseScreen}
      options={{
        headerShown: true,
        title: "Réinitialisation",
        headerTitleStyle: tw`font-mono text-lg font-semibold text-slate-800`,
        headerBackTitleVisible: false,
        headerTintColor: tw.color("text-orange-600"),
        headerStyle: tw`bg-white border-b border-slate-200`,
      }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { utilisateur, token, chargement } = useAuth();

  if (chargement) {
    return (
      <View style={tw`items-center justify-center flex-1 bg-white`}>
        <ActivityIndicator size="large" color={tw.color("orange-600")} />
        <Text style={tw`mt-4 font-mono text-slate-500`}>Chargement...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator 
      screenOptions={({ navigation }) => ({
        headerShown: false,
        headerRight: () => <HeaderRight navigation={navigation} />,
        headerRightContainerStyle: tw`pr-4`,
      })}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      {utilisateur && token ? (
        <>
          <Stack.Screen name="App" component={TabNavigator} />
          <Stack.Screen 
            name="Livraisons" 
            component={LivraisonsScreen}
            options={{
              headerShown: true,
              title: "Livraisons",
              headerTitleStyle: tw`font-mono text-lg font-semibold text-slate-800`,
              headerBackTitleVisible: false,
              headerTintColor: tw.color("text-orange-600"),
              headerStyle: tw`bg-white border-b border-slate-200`,
            }}
          />
          <Stack.Screen
            name="DetailCommande"
            component={DetailCommandeScreen}
            options={({ route }) => ({
              headerShown: true,
              title: `Commande #${route.params?.reference || ''}`,
              headerTitleStyle: tw`font-mono text-lg font-semibold text-slate-800`,
              headerBackTitleVisible: false,
              headerTintColor: tw.color("text-orange-600"),
              headerStyle: tw`bg-white border-b border-slate-200`,
            })}
          />
          <Stack.Screen
            name="ChangerMotDePasse"
            component={ChangerMotDePasseScreen}
            options={{
              headerShown: true,
              title: "Changer mot de passe",
              headerTitleStyle: tw`font-mono text-lg font-semibold text-slate-800`,
              headerBackTitleVisible: false,
              headerTintColor: tw.color("text-orange-600"),
              headerStyle: tw`bg-white border-b border-slate-200`,
            }}
          />
          <Stack.Screen 
            name="ReinitialiserMotDePasse" 
            component={ReinitialiserMotDePasseScreen}
            options={{
              headerShown: true,
              title: "Réinitialisation",
              headerTitleStyle: tw`font-mono text-lg font-semibold text-slate-800`,
              headerBackTitleVisible: false,
              headerTintColor: tw.color("text-orange-600"),
              headerStyle: tw`bg-white border-b border-slate-200`,
            }}
          />
          <Stack.Screen 
            name="Profil" 
            component={ProfilScreen}
            options={{
              headerShown: true,
              title: "Profil",
              headerBackTitleVisible: false,
              headerTintColor: tw.color("text-orange-600"),
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;