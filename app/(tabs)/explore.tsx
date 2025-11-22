import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Service {
  id: number;
  name: string;
  company: {
    name: string;
  };
  address: {
    city: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
}

export default function NearbyScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { services, toggleFavorite, isFavorite } = useApp();
  const { isDark } = useTheme();

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to show nearby services.'
        );
        setLoading(false);
        setPermissionGranted(false);
        return;
      }

      setPermissionGranted(true);
      getCurrentLocation();
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location.');
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getNearbyServices = () => {
    if (!location) return [];

    return services
      .map(service => {
        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          parseFloat(service.address.geo.lat),
          parseFloat(service.address.geo.lng)
        );
        return { ...service, distance };
      })
      .sort((a, b) => a.distance - b.distance);
  };

  const renderServiceItem = ({ item }: { item: Service & { distance: number } }) => {
    const favorite = isFavorite(item.id);

    return (
      <View style={[styles.serviceCard, isDark && styles.serviceCardDark]}>
        <View style={styles.serviceHeader}>
          <View>
            <Text style={[styles.serviceName, isDark && styles.textDark]}>{item.name}</Text>
            <Text style={[styles.companyName, isDark && styles.textSecondaryDark]}>
              {item.company.name}
            </Text>
          </View>
          <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
            <Ionicons
              name={favorite ? 'heart' : 'heart-outline'}
              size={24}
              color={favorite ? '#FF3B30' : isDark ? '#fff' : '#000'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#007AFF" />
          <Text style={[styles.locationText, isDark && styles.textSecondaryDark]}>
            {item.address.city}
          </Text>
        </View>

        <View style={styles.distanceRow}>
          <Ionicons name="navigate" size={16} color={isDark ? '#999' : '#666'} />
          <Text style={[styles.distanceText, isDark && styles.textSecondaryDark]}>
            {item.distance.toFixed(1)} km away
          </Text>
        </View>

        <TouchableOpacity style={styles.directionsButton}>
          <Ionicons name="navigate-outline" size={18} color="#fff" />
          <Text style={styles.directionsText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.loadingText, isDark && styles.textDark]}>
          Getting your location...
        </Text>
      </View>
    );
  }

  if (!permissionGranted) {
    return (
      <View style={[styles.centerContainer, isDark && styles.containerDark]}>
        <Ionicons name="location-outline" size={64} color={isDark ? '#666' : '#ccc'} />
        <Text style={[styles.errorTitle, isDark && styles.textDark]}>Location Access Required</Text>
        <Text style={[styles.errorText, isDark && styles.textSecondaryDark]}>
          Please enable location permissions to find nearby services.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestLocationPermission}>
          <Text style={styles.retryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nearbyServices = getNearbyServices();

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Nearby Services</Text>
        {location && (
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={18} color="#007AFF" />
            <Text style={[styles.coordsText, isDark && styles.textSecondaryDark]}>
              {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={nearbyServices}
        renderItem={renderServiceItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={isDark ? '#666' : '#ccc'} />
            <Text style={[styles.emptyText, isDark && styles.textSecondaryDark]}>
              No services found nearby
            </Text>
          </View>
        }
      />
    </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
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
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  coordsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  listContent: {
    padding: 20,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceCardDark: {
    backgroundColor: '#1a1a1a',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#666',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  directionsButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#000',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#999',
  },
});
