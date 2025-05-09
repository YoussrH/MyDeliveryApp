"use client"
import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity } from "react-native"
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons'
import tw from "@/utils/tw"

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const mockNotifications = [
      {
        id: "1",
        type: "nouvelle_commande",
        titre: "Nouvelle commande assignée",
        message: "Vous avez une nouvelle commande à livrer pour Marie Dubois",
        date: "2023-05-15T10:30:00",
        lue: false,
      },
      {
        id: "2",
        type: "message",
        titre: "Message de l'administrateur",
        message: "Rappel: N'oubliez pas de prendre des photos des livraisons effectuées",
        date: "2023-05-15T09:15:00",
        lue: true,
      }
    ]

    setTimeout(() => {
      setNotifications(mockNotifications)
      setLoading(false)
    }, 500)
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours} h`
    if (diffDays === 1) return "Hier"
    return `Il y a ${diffDays} j`
  }

  const getNotificationIcon = (type) => {
    const iconProps = {
      size: 20,
      style: tw`mr-3`
    }

    switch (type) {
      case "nouvelle_commande":
        return (
          <View style={tw`items-center justify-center w-10 h-10 bg-orange-100 rounded-full`}>
            <MaterialCommunityIcons name="package-variant" color={tw.color("text-orange-600")} {...iconProps} />
          </View>
        )
      case "message":
        return (
          <View style={tw`items-center justify-center w-10 h-10 bg-blue-100 rounded-full`}>
            <Ionicons name="chatbubble" color={tw.color("text-blue-500")} {...iconProps} />
          </View>
        )
      case "alerte":
        return (
          <View style={tw`items-center justify-center w-10 h-10 bg-red-100 rounded-full`}>
            <Ionicons name="alert" color={tw.color("text-red-500")} {...iconProps} />
          </View>
        )
      default:
        return (
          <View style={tw`items-center justify-center w-10 h-10 rounded-full bg-slate-100`}>
            <Ionicons name="notifications" color={tw.color("text-slate-500")} {...iconProps} />
          </View>
        )
    }
  }

  const markAsRead = (id) => {
    setNotifications(notifications.map((notif) => 
      notif.id === id ? { ...notif, lue: true } : notif
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, lue: true })))
  }

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      onPress={() => markAsRead(item.id)} 
      activeOpacity={0.7}
    >
      <View style={[
        tw`p-4 mb-3 bg-white shadow-sm rounded-xl`,
        !item.lue && tw`border-l-4 border-orange-600 bg-violet-50`
      ]}>
        <View style={tw`flex-row items-start`}>
          {getNotificationIcon(item.type)}
          <View style={tw`flex-1`}>
            <Text style={tw`text-base font-semibold text-slate-800`}>{item.titre}</Text>
            <Text style={tw`mt-1 text-sm text-slate-600`}>{item.message}</Text>
            <Text style={tw`mt-2 text-xs text-slate-500`}>{formatDate(item.date)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={tw`items-center justify-center flex-1`}>
        <Text>Chargement des notifications...</Text>
      </View>
    )
  }

  return (
    <View style={tw`flex-1 p-4 mt-10 bg-slate-50`}>
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <Text style={tw`text-2xl font-bold text-slate-800`}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={tw`text-sm font-medium text-orange-600`}>Tout marquer comme lu</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tw`pb-4`}
        ListEmptyComponent={
          <View style={tw`items-center justify-center p-6 bg-white shadow-sm rounded-xl`}>
            <Text style={tw`text-slate-500`}>Aucune notification</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

export default NotificationsScreen