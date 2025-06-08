import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/contexts/AuthContext';
import tw from '@/utils/tw';
import Button from '@/components/Button';
import axios from 'axios';

const ProfilScreen = ({ navigation }) => {
  const { utilisateur, deconnexion, api } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true)
  
  const [edition, setEdition] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    utilisateur: {
      prenom: '',
      nom: '',
      email: ''
    },
    telephone: '',
    statut: false,
    type_vehicule: '',
    plaque_immatriculation: ''
  });

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchProfile = async () => {
      try {
        const response = await api.get('/livreur/mon-profil', {
          cancelToken: source.token
        });
        setProfileData(response.data.livreur);
        
        // Initialize formData with the fetched data
        setFormData({
          utilisateur: {
            prenom: response.data.livreur.utilisateur.prenom,
            nom: response.data.livreur.utilisateur.nom,
            email: response.data.livreur.utilisateur.email
          },
          telephone: response.data.livreur.telephone || '',
          statut: response.data.livreur.statut === 'actif',
          type_vehicule: response.data.livreur.type_vehicule || '',
          plaque_immatriculation: response.data.livreur.plaque_immatriculation || ''
        });
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error(err);
          Alert.alert('Erreur', "Impossible de charger les données du profil.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      source.cancel('Component unmounted');
    };
  }, []);

  const toggleEdition = () => {
    if (!edition) {
      // When entering edit mode, refresh formData with current profileData
      setFormData({
        utilisateur: {
          prenom: profileData.utilisateur.prenom,
          nom: profileData.utilisateur.nom,
          email: profileData.utilisateur.email
        },
        telephone: profileData.telephone || '',
        statut: profileData.statut === 'actif',
        type_vehicule: profileData.type_vehicule || '',
        plaque_immatriculation: profileData.plaque_immatriculation || ''
      });
    }
    setEdition(!edition);
  };

  const handleChange = (field, value) => {
    if (field.startsWith('utilisateur.')) {
      const subField = field.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        utilisateur: {
          ...prev.utilisateur,
          [subField]: value
        }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const soumettreModifications = async () => {
    setUpdating(true);
    try {
      await axios.put('http://localhost:5000/livreur/mettre-a-jour', {
        ...formData,
        statut: formData.statut ? 'actif' : 'inactif'
      });
      Alert.alert('Succès', 'Profil mis à jour avec succès.');
      setEdition(false);
      
      // Refresh profile data after update
      const response = await api.get('/livreur/mon-profil');
      setProfileData(response.data.livreur);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', "Une erreur s'est produite lors de la mise à jour.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeconnexion = () => {
    Alert.alert('Confirmation', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', onPress: deconnexion }
    ]);
  };

  if (loading) {
    return (
      <View style={tw`items-center justify-center flex-1 bg-slate-50`}>
        <ActivityIndicator size="large" color={tw.color('orange-600')} />
      </View>
    );
  }

  const handleChangementMotDePasse = () => {
    navigation.navigate('ChangerMotDePasse');
  };

  return (
    <ScrollView style={tw`flex-1 pt-10 bg-slate-50`} contentContainerStyle={tw`p-4`}>
      <View style={tw`items-center mb-6`}>
        <View style={tw`items-center justify-center w-24 h-24 mb-4 bg-orange-100 rounded-full`}>
          <Ionicons name="person" size={48} color={tw.color('text-orange-600')} />
        </View>

        {edition ? (
          <>
            <TextInput
              style={tw`w-full mb-1 text-xl font-bold text-center text-slate-800`}
              value={formData.utilisateur.prenom}
              onChangeText={(text) => handleChange('utilisateur.prenom', text)}
              placeholder="Prénom"
            />
            <TextInput
              style={tw`w-full text-xl font-bold text-center text-slate-800`}
              value={formData.utilisateur.nom}
              onChangeText={(text) => handleChange('utilisateur.nom', text)}
              placeholder="Nom"
            />
          </>
        ) : (
          <Text style={tw`text-xl font-bold text-slate-800`}>
            {profileData?.utilisateur?.prenom} {profileData?.utilisateur?.nom}
          </Text>
        )}

        {edition ? (
          <TextInput
            style={tw`w-full text-center text-slate-500`}
            value={formData.utilisateur.email}
            onChangeText={(text) => handleChange('utilisateur.email', text)}
            placeholder="Email"
            keyboardType="email-address"
          />
        ) : (
          <Text style={tw`text-slate-500`}>{profileData?.utilisateur?.email}</Text>
        )}

        {utilisateur?.role === 'livreur' && (
          <View style={tw`px-3 py-1 mt-2 bg-orange-100 rounded-full`}>
            <Text style={tw`text-sm font-medium text-orange-700`}>Livreur</Text>
          </View>
        )}
      </View>

      {/* Bloc Informations */}
      <View style={tw`p-4 mb-4 bg-white rounded-lg shadow-sm`}>
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <Text style={tw`text-lg font-semibold text-slate-800`}>Informations</Text>
          {utilisateur?.role === 'livreur' && (
            <TouchableOpacity onPress={toggleEdition}>
              <Ionicons name={edition ? 'close' : 'create'} size={20} color={tw.color('text-orange-600')} />
            </TouchableOpacity>
          )}
        </View>

        {utilisateur?.role === 'livreur' ? (
          <>
            {/* Champs spécifiques au livreur */}
            <View style={tw`py-2 border-b border-slate-100`}>
              <Text style={tw`mb-1 text-sm text-slate-500`}>Téléphone</Text>
              {edition ? (
                <TextInput
                  style={tw`text-slate-700`}
                  value={formData.telephone}
                  onChangeText={(text) => handleChange('telephone', text)}
                  placeholder="Téléphone"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={tw`text-slate-700`}>{profileData?.telephone || 'Non renseigné'}</Text>
              )}
            </View>

            <View style={tw`py-2 border-b border-slate-100`}>
              <Text style={tw`mb-1 text-sm text-slate-500`}>Statut</Text>
              {edition ? (
                <View style={tw`flex-row items-center`}>
                  <Text style={tw`mr-2 text-slate-700`}>{formData.statut ? 'Actif' : 'Inactif'}</Text>
                  <Switch
                    value={formData.statut}
                    onValueChange={(value) => handleChange('statut', value)}
                    thumbColor={tw.color('orange-600')}
                    trackColor={{ false: tw.color('slate-200'), true: tw.color('orange-300') }}
                  />
                </View>
              ) : (
                <Text style={tw`text-slate-700`}>
                  {profileData?.statut === 'actif' ? 'Actif' : 'Inactif'}
                </Text>
              )}
            </View>

            <View style={tw`py-2 border-b border-slate-100`}>
              <Text style={tw`mb-1 text-sm text-slate-500`}>Type de véhicule</Text>
              {edition ? (
                <TextInput
                  style={tw`text-slate-700`}
                  value={formData.type_vehicule}
                  onChangeText={(text) => handleChange('type_vehicule', text)}
                  placeholder="Ex: Moto, Voiture, Vélo"
                />
              ) : (
                <Text style={tw`text-slate-700`}>{profileData?.type_vehicule || 'Non renseigné'}</Text>
              )}
            </View>

            <View style={tw`py-2`}>
              <Text style={tw`mb-1 text-sm text-slate-500`}>Plaque d'immatriculation</Text>
              {edition ? (
                <TextInput
                  style={tw`text-slate-700`}
                  value={formData.plaque_immatriculation}
                  onChangeText={(text) => handleChange('plaque_immatriculation', text)}
                  placeholder="Plaque d'immatriculation"
                />
              ) : (
                <Text style={tw`text-slate-700`}>{profileData?.plaque_immatriculation || 'Non renseigné'}</Text>
              )}
            </View>
          </>
        ) : (
          <>
            <View style={tw`flex-row items-center py-2 border-b border-slate-100`}>
              <Ionicons name="mail" size={20} color={tw.color('text-slate-500')} style={tw`mr-3`} />
              <Text style={tw`text-slate-700`}>{profileData?.utilisateur?.email}</Text>
            </View>

            <View style={tw`flex-row items-center py-2`}>
              <MaterialCommunityIcons
                name={profileData?.utilisateur?.est_verifie ? 'shield-check' : 'shield-alert'}
                size={20}
                color={
                  profileData?.utilisateur?.est_verifie
                    ? tw.color('text-green-500')
                    : tw.color('text-yellow-500')
                }
                style={tw`mr-3`}
              />
              <Text style={tw`text-slate-700`}>
                {profileData?.utilisateur?.est_verifie ? 'Compte vérifié' : 'Compte non vérifié'}
              </Text>
            </View>
          </>
        )}
      </View>

      {edition && (
        <View style={tw`mb-4`}>
          <Button
            title="Enregistrer les modifications"
            onPress={soumettreModifications}
            loading={updating}
          />
        </View>
      )}

      <View style={tw`p-4 mb-4 bg-white rounded-lg shadow-sm`}>
        <Text style={tw`mb-3 text-lg font-semibold text-slate-800`}>Actions</Text>

        <Button
          title="Changer le mot de passe"
          onPress={handleChangementMotDePasse}
          icon={<Ionicons name="key" size={18} color="white" />}
          style={[tw`mb-3`, { backgroundColor: tw.color('orange-600'), borderColor: tw.color('orange-600') }]}
          titleStyle={{ color: 'white' }}
        />

        <Button
          title="Déconnexion"
          onPress={handleDeconnexion}
          variant="danger"
          style={[tw`mb-3`, { backgroundColor: tw.color('orange-600'), borderColor: tw.color('red-600') }]}
          icon={<Ionicons name="log-out" size={18} color={tw.color('text-white')} />}
        />
      </View>
    </ScrollView>
  );
};

export default ProfilScreen;