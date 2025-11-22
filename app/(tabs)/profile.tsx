import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const { favorites, services } = useApp();
  const { isDark, toggleTheme, themeMode } = useTheme();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await updateProfile({ profileImage: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await updateProfile({ profileImage: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const handleImagePicker = () => {
    Alert.alert('Profile Picture', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const favoriteServices = services.filter(service => favorites.includes(service.id));

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <TouchableOpacity onPress={handleImagePicker} style={styles.avatarContainer}>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, isDark && styles.avatarPlaceholderDark]}>
              <Ionicons name="person" size={48} color={isDark ? '#666' : '#999'} />
            </View>
          )}
          <View style={styles.cameraButton}>
            <Ionicons name="camera" size={18} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text style={[styles.userName, isDark && styles.textDark]}>{user?.name}</Text>
        <Text style={[styles.userEmail, isDark && styles.textSecondaryDark]}>{user?.email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statBox, isDark && styles.statBoxDark]}>
          <Text style={[styles.statNumber, isDark && styles.textDark]}>{services.length}</Text>
          <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Services</Text>
        </View>
        <View style={[styles.statBox, isDark && styles.statBoxDark]}>
          <Text style={[styles.statNumber, isDark && styles.textDark]}>{favorites.length}</Text>
          <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Favorites</Text>
        </View>
        <View style={[styles.statBox, isDark && styles.statBoxDark]}>
          <Text style={[styles.statNumber, isDark && styles.textDark]}>0</Text>
          <Text style={[styles.statLabel, isDark && styles.textSecondaryDark]}>Bookings</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Favorites</Text>
        {favoriteServices.length > 0 ? (
          favoriteServices.slice(0, 3).map(service => (
            <View key={service.id} style={[styles.favoriteItem, isDark && styles.favoriteItemDark]}>
              <View style={styles.favoriteIcon}>
                <Ionicons name="heart" size={20} color="#FF3B30" />
              </View>
              <View style={styles.favoriteInfo}>
                <Text style={[styles.favoriteName, isDark && styles.textDark]}>
                  {service.name}
                </Text>
                <Text style={[styles.favoriteCompany, isDark && styles.textSecondaryDark]}>
                  {service.company.name}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, isDark && styles.textSecondaryDark]}>
            No favorite services yet
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Settings</Text>

        <View style={[styles.settingItem, isDark && styles.settingItemDark]}>
          <View style={styles.settingLeft}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={24}
              color={isDark ? '#fff' : '#000'}
            />
            <Text style={[styles.settingText, isDark && styles.textDark]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ccc', true: '#007AFF' }}
            thumbColor={isDark ? '#fff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity style={[styles.settingItem, isDark && styles.settingItemDark]}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={24} color={isDark ? '#fff' : '#000'} />
            <Text style={[styles.settingText, isDark && styles.textDark]}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={isDark ? '#666' : '#999'} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, isDark && styles.settingItemDark]}>
          <View style={styles.settingLeft}>
            <Ionicons name="language-outline" size={24} color={isDark ? '#fff' : '#000'} />
            <Text style={[styles.settingText, isDark && styles.textDark]}>Language</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={isDark ? '#666' : '#999'} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, isDark && styles.settingItemDark]}>
          <View style={styles.settingLeft}>
            <Ionicons name="help-circle-outline" size={24} color={isDark ? '#fff' : '#000'} />
            <Text style={[styles.settingText, isDark && styles.textDark]}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={isDark ? '#666' : '#999'} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  containerDark: {
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerDark: {
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderDark: {
    backgroundColor: '#2a2a2a',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statBoxDark: {
    backgroundColor: '#1a1a1a',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  favoriteItemDark: {
    backgroundColor: '#1a1a1a',
  },
  favoriteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffe5e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  favoriteCompany: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingItemDark: {
    backgroundColor: '#1a1a1a',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 8,
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#999',
  },
  bottomSpacer: {
    height: 40,
  },
});
