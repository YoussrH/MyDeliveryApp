// File: screens/NotificationsScreen.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLivreurSocket } from '@/contexts/SocketContext';
import { useNavigation } from '@react-navigation/native';
import tw from '@/utils/tw';

const NotificationsScreen = () => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead 
  } = useLivreurSocket();
  const navigation = useNavigation();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return "Hier";
    return `Il y a ${diffDays} j`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'nouvelle_commande':
        return (
          <View style={tw`items-center justify-center w-10 h-10 bg-orange-100 rounded-full`}>
            <MaterialCommunityIcons 
              name="package-variant" 
              size={20} 
              color={tw.color("text-orange-600")} 
            />
          </View>
        );
      case 'commande_retiree':
        return (
          <View style={tw`items-center justify-center w-10 h-10 bg-red-100 rounded-full`}>
            <MaterialCommunityIcons 
              name="package-variant-remove" 
              size={20} 
              color={tw.color("text-red-600")} 
            />
          </View>
        );
      default:
        return (
          <View style={tw`items-center justify-center w-10 h-10 bg-blue-100 rounded-full`}>
            <MaterialCommunityIcons 
              name="bell" 
              size={20} 
              color={tw.color("text-blue-600")} 
            />
          </View>
        );
    }
  };

  const handleNotificationPress = (notification) => {
    markAsRead(notification.id);
    
    if (notification.livraison_id) {
      navigation.navigate('DetailCommande', { 
        id: notification.livraison_id,
        reference: notification.reference
      });
    }
  };

  return (
    <View style={tw`flex-1 mt-9 bg-slate-50`}>
      <View style={tw`p-4`}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <Text style={tw`text-2xl font-bold text-slate-800`}>Notifications</Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={tw`text-sm font-medium text-orange-600`}>
                Tout marquer comme lu
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
            style={[
              tw`p-4 mx-4 mb-3 bg-white shadow-sm rounded-xl`,
              !item.lue && tw`border-l-4 border-orange-600 bg-orange-50`
            ]}
          >
            <View style={tw`flex-row items-start `}>
              {getNotificationIcon(item.type)}
              <View style={tw`flex-1 pl-3`}>
                <Text style={tw`text-base font-semibold text-slate-800`}>
                  {item.titre}
                </Text>
                <Text style={tw`mt-1 text-sm text-slate-600`}>
                  {item.message}
                </Text>
                <Text style={tw`mt-2 text-xs text-slate-500`}>
                  {formatDate(item.date)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tw`pb-4`}
        ListEmptyComponent={
          <View style={tw`items-center justify-center p-6 mx-4 bg-white shadow-sm rounded-xl`}>
            <Text style={tw`text-slate-500`}>Aucune notification</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default NotificationsScreen;