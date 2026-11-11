import React from 'react';
import { View, Text, Image, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenContainer, AppHeader, AppCard } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const article = {
    title: 'Essential Dog Vaccination Schedule in India: A Vet Guide',
    category: 'Pet Health & Prevention',
    readTime: '4 min read',
    date: 'Oct 20, 2026',
    author: 'Dr. Ramesh Kumar, MVSc (Senior Veterinary Surgeon)',
    image: require('@/../assets/images/banner-dog.webp'),
    paragraphs: [
      'Vaccination forms the single most critical shield protecting your companion animal against life-threatening infectious diseases such as Canine Parvovirus, Canine Distemper, Hepatitis, Leptospirosis, and Rabies.',
      'In tropical metropolitan climates like Chennai, high humidity and vector proliferation make regular preventive immunization non-negotiable. Puppies should receive their primary core vaccination (DHPPiL) between 6 to 8 weeks of age, followed by two boosters at 3-week intervals.',
      'Rabies vaccination is legally mandatory across India and must be administered at 3 months of age, followed by an annual booster shot. Keeping your pet’s digital passport updated ensures seamless kennel boarding and veterinary emergency admissions.',
      'Post-vaccination care includes monitoring for mild lethargy or localized swelling for 24 hours. Ensure your pet is well-hydrated and avoid strenuous exercise on vaccination day.',
    ],
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: article.title,
        message: `${article.title} — Read expert pet wellness guides on Wuffian!`,
      });
    } catch (_) {}
  };

  return (
    <ScreenContainer backgroundColor="#FAF8F5">
      <AppHeader
        showBack
        title="Article"
        rightAction={
          <TouchableOpacity onPress={handleShare} className="p-2">
            <Ionicons name="share-social-outline" size={20} color="#18181B" />
          </TouchableOpacity>
        }
      />

      <View className="p-4">
        {/* Hero Image */}
        <View className="w-full h-56 rounded-3xl overflow-hidden mb-4 bg-[#F4F4F5]">
          <Image source={article.image} className="w-full h-full" resizeMode="cover" />
        </View>

        {/* Badge & Meta */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="bg-[#E8F9FB] px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-[#1FB6C6]">{article.category}</Text>
          </View>
          <Text className="text-xs text-[#71717A]">{article.readTime}</Text>
        </View>

        <Text className="text-2xl font-bold text-[#18181B] font-heading my-2">
          {article.title}
        </Text>

        {/* Author Byline */}
        <View className="flex-row items-center py-3 border-y border-[#E4E4E7] mb-5">
          <View className="w-10 h-10 rounded-full bg-[#1FB6C6] items-center justify-center mr-3">
            <Ionicons name="medical" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text className="text-xs font-bold text-[#18181B]">{article.author}</Text>
            <Text className="text-[11px] text-[#71717A]">{article.date} • Verified Medical Guide</Text>
          </View>
        </View>

        {/* Formatted Paragraphs */}
        {article.paragraphs.map((p, idx) => (
          <Text key={idx} className="text-sm text-[#18181B] leading-6 mb-4">
            {p}
          </Text>
        ))}

        {/* Medical Disclaimer */}
        <AppCard className="bg-[#FFF1EA] border-[#EA580C]/20 p-4 rounded-2xl my-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={18} color="#EA580C" />
            <Text className="text-xs text-[#52525B] ml-2 flex-1 leading-4">
              <Text className="font-bold text-[#EA580C]">Medical Disclaimer:</Text> This article provides educational guidance and is not a substitute for direct veterinary clinical diagnosis. Always consult a certified veterinarian for specific health concerns.
            </Text>
          </View>
        </AppCard>
      </View>
    </ScreenContainer>
  );
}
