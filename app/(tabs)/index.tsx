import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Service {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}

const serviceCategories = [
  { icon: '⚡', name: 'Electrician' },
  { icon: '🔧', name: 'Plumber' },
  { icon: '🧹', name: 'Cleaner' },
  { icon: '🔨', name: 'Carpenter' },
  { icon: '🎨', name: 'Painter' },
  { icon: '❄️', name: 'AC Repair' },
];

export default function HomeScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toggleFavorite, isFavorite, setServices: setGlobalServices } = useApp();
  const { isDark } = useTheme();

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchQuery, services, selectedCategory]);

  const fetchServices = async () => {
    try {
      const response = await axios.get('https://jsonplaceholder.typicode.com/users');
      setServices(response.data);
      setGlobalServices(response.data);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterServices = () => {
    let filtered = services;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(service => {
        const categoryIndex = service.id % serviceCategories.length;
        return serviceCategories[categoryIndex].name === selectedCategory;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        service =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.address.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  };

  const handleCategoryPress = (categoryName: string) => {
    // Toggle category selection
    if (selectedCategory === categoryName) {
      setSelectedCategory(null); // Deselect if same category is clicked
    } else {
      setSelectedCategory(categoryName);
    }
  };

  const handleBookNow = (service: Service) => {
    const category = serviceCategories[service.id % serviceCategories.length];
    
    Alert.alert(
      'Book Service',
      `Book ${category.name} service with ${service.name}?\n\n` +
      `Company: ${service.company.name}\n` +
      `Location: ${service.address.city}\n` +
      `Phone: ${service.phone}`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Call Now',
          onPress: () => {
            Linking.openURL(`tel:${service.phone}`);
          }
        },
        {
          text: 'Confirm Booking',
          onPress: () => {
            // Add to favorites automatically when booking
            if (!isFavorite(service.id)) {
              toggleFavorite(service.id);
            }
            
            Alert.alert(
              'Booking Confirmed! ✅',
              `Your ${category.name} service has been booked with ${service.name}.\n\n` +
              `You will receive a confirmation email at your registered address.\n\n` +
              `Service Details:\n` +
              `• Provider: ${service.company.name}\n` +
              `• Location: ${service.address.city}\n` +
              `• Contact: ${service.phone}\n` +
              `• Email: ${service.email}\n\n` +
              `Added to your favorites! ⭐`,
              [
                {
                  text: 'View Email',
                  onPress: () => {
                    Linking.openURL(`mailto:${service.email}`);
                  }
                },
                {
                  text: 'OK',
                  style: 'default'
                }
              ]
            );
          },
          style: 'default'
        }
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchServices();
  }, []);

  const renderServiceItem = ({ item }: { item: Service }) => {
    const favorite = isFavorite(item.id);
    const randomCategory = serviceCategories[item.id % serviceCategories.length];

    return (
      <View style={[styles.serviceCard, isDark && styles.serviceCardDark]}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceIcon}>
            <Text style={styles.serviceEmoji}>{randomCategory.icon}</Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleFavorite(item.id)}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={favorite ? 'heart' : 'heart-outline'}
              size={24}
              color={favorite ? '#FF3B30' : isDark ? '#fff' : '#000'}
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.serviceName, isDark && styles.textDark]}>{item.name}</Text>
        <Text style={[styles.serviceCategory, isDark && styles.textSecondaryDark]}>
          {randomCategory.name}
        </Text>
        <Text style={[styles.serviceCompany, isDark && styles.textSecondaryDark]}>
          {item.company.name}
        </Text>
        <Text style={[styles.serviceTagline, isDark && styles.textSecondaryDark]} numberOfLines={1}>
          {item.company.catchPhrase}
        </Text>

        <View style={styles.serviceFooter}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={isDark ? '#999' : '#666'} />
            <Text style={[styles.locationText, isDark && styles.textSecondaryDark]}>
              {item.address.city}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => handleBookNow(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCategoryItem = ({ item }: { item: typeof serviceCategories[0] }) => {
    const isSelected = selectedCategory === item.name;
    
    return (
      <TouchableOpacity 
        style={[
          styles.categoryCard, 
          isDark && styles.categoryCardDark,
          isSelected && styles.categoryCardSelected,
          isSelected && isDark && styles.categoryCardSelectedDark
        ]}
        onPress={() => handleCategoryPress(item.name)}
        activeOpacity={0.7}
      >
        <Text style={styles.categoryIcon}>{item.icon}</Text>
        <Text style={[
          styles.categoryName, 
          isDark && styles.textDark,
          isSelected && styles.categoryNameSelected
        ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Smart Services</Text>
        <Text style={[styles.headerSubtitle, isDark && styles.textSecondaryDark]}>
          Find services near you
        </Text>

        <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
          <Ionicons name="search" size={20} color={isDark ? '#999' : '#666'} />
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="Search services..."
            placeholderTextColor={isDark ? '#999' : '#666'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.categoriesSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Categories</Text>
          {selectedCategory && (
            <TouchableOpacity 
              onPress={() => setSelectedCategory(null)}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          horizontal
          data={serviceCategories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.name}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <View style={styles.servicesSection}>
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
          {selectedCategory 
            ? `${selectedCategory} Services (${filteredServices.length})`
            : `Available Services (${filteredServices.length})`
          }
        </Text>
        <FlatList
          data={filteredServices}
          renderItem={renderServiceItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.servicesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#fff' : '#007AFF'}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="search-outline" 
                size={64} 
                color={isDark ? '#333' : '#ddd'} 
                style={{ marginBottom: 16 }}
              />
              <Text style={[styles.emptyText, isDark && styles.textSecondaryDark]}>
                {selectedCategory 
                  ? `No ${selectedCategory.toLowerCase()} services found`
                  : searchQuery 
                    ? 'No services match your search'
                    : 'No services available'
                }
              </Text>
              {(selectedCategory || searchQuery) && (
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                  style={styles.resetButton}
                >
                  <Text style={styles.resetButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  searchBarDark: {
    backgroundColor: '#2a2a2a',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  searchInputDark: {
    color: '#fff',
  },
  categoriesSection: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  clearButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardDark: {
    backgroundColor: '#1a1a1a',
  },
  categoryCardSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryCardSelectedDark: {
    backgroundColor: '#0051D5',
    borderColor: '#0051D5',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  servicesSection: {
    flex: 1,
    marginTop: 20,
  },
  servicesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceEmoji: {
    fontSize: 28,
  },
  favoriteButton: {
    padding: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  serviceCompany: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  serviceTagline: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#999',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
