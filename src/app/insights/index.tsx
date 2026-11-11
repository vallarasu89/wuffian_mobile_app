import React, { useState, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer, AppHeader, AppCard, SearchBar } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

const ARTICLES = [
  {
    id: 1,
    title: 'Essential Dog Vaccination Schedule in India: A Vet Guide',
    category: 'Pet Health',
    readTime: '4 min read',
    date: 'Oct 20, 2026',
    excerpt:
      'Understanding mandatory puppy vaccinations—from Rabies, DHPPiL to Kennel Cough boosters—to keep your pet protected throughout Chennai’s seasons.',
    image: require('@/../assets/images/banner-dog.webp'),
    author: 'Dr. Ramesh Kumar, MVSc',
  },
  {
    id: 2,
    title: 'Monsoon Grooming & Tick Prevention for Dogs & Cats',
    category: 'Grooming',
    readTime: '5 min read',
    date: 'Oct 18, 2026',
    excerpt:
      'How to prevent fungal skin infections, paw rot, and tick infestations during the rainy season with professional grooming protocols.',
    image: require('@/../assets/images/clinic_image.webp'),
    author: 'Ananya S., Certified Pet Groomer',
  },
  {
    id: 3,
    title: 'Puppy Socialization and Basic Obedience Training at Home',
    category: 'Training',
    readTime: '6 min read',
    date: 'Oct 15, 2026',
    excerpt:
      'Crucial developmental milestones, positive reinforcement training techniques, and leash walking etiquette for young puppies.',
    image: require('@/../assets/images/add-pet.png'),
    author: 'Vikram Raj, K9 Behaviourist',
  },
];

const CATEGORIES = ['All', 'Pet Health', 'Grooming', 'Training'];

export default function InsightsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return ARTICLES.filter((art) => {
      if (selectedCategory !== 'All' && art.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          art.title.toLowerCase().includes(q) ||
          art.excerpt.toLowerCase().includes(q) ||
          art.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <ScreenContainer backgroundColor="#FAF8F5">
      <AppHeader showBack title="Pet Knowledge Base" />

      <View className="p-4">
        {/* Banner */}
        <View className="bg-[#1FB6C6] rounded-3xl p-5 mb-5 shadow-sm">
          <Text className="text-xs font-bold text-white/80 uppercase tracking-wider">
            Curated Veterinary Guides
          </Text>
          <Text className="text-xl font-bold text-white font-heading mt-1">
            Expert Pet Health & Wellness
          </Text>
          <Text className="text-xs text-white/90 mt-1.5 leading-4">
            Veterinary advice, seasonal care routines, and certified training articles for pet parents.
          </Text>
        </View>

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search articles, vaccination guides..."
        />

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row">
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full mr-2 border ${
                selectedCategory === cat
                  ? 'bg-[#1FB6C6] border-[#1FB6C6]'
                  : 'bg-white border-[#E4E4E7]'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedCategory === cat ? 'text-white' : 'text-[#52525B]'
                }`}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Article Cards Feed */}
        {filtered.map((art) => (
          <AppCard
            key={art.id}
            onPress={() => router.push(`/insights/${art.id}`)}
            className="mb-4 p-0 overflow-hidden border border-[#E4E4E7]"
          >
            <View className="w-full h-44 bg-[#F4F4F5]">
              <Image source={art.image} className="w-full h-full" resizeMode="cover" />
              <View className="absolute top-3 left-3 bg-[#1FB6C6] px-2.5 py-1 rounded-full">
                <Text className="text-white text-[11px] font-bold">{art.category}</Text>
              </View>
            </View>

            <View className="p-4">
              <View className="flex-row items-center mb-1">
                <Ionicons name="time-outline" size={13} color="#71717A" />
                <Text className="text-[11px] text-[#71717A] ml-1 mr-3">{art.readTime}</Text>
                <Text className="text-[11px] text-[#71717A]">{art.date}</Text>
              </View>

              <Text className="text-base font-bold text-[#18181B] font-heading mt-1" numberOfLines={2}>
                {art.title}
              </Text>

              <Text className="text-xs text-[#52525B] mt-1.5 leading-4" numberOfLines={2}>
                {art.excerpt}
              </Text>

              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-[#F4F4F5]">
                <Text className="text-[11px] font-medium text-[#1FB6C6]">{art.author}</Text>
                <View className="flex-row items-center">
                  <Text className="text-xs font-bold text-[#EA580C] mr-1">Read Article</Text>
                  <Ionicons name="arrow-forward" size={14} color="#EA580C" />
                </View>
              </View>
            </View>
          </AppCard>
        ))}
      </View>
    </ScreenContainer>
  );
}
