import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGetUserPetsQuery, useDeletePetMutation } from '@/store/api/petsApi';

const DEFAULT_SAMPLE_PETS = [
  {
    id: 'buddy',
    name: 'Buddy',
    type: 'Dog',
    breed: 'Golden Retriever',
    gender: 'Male',
    age: '3 Years',
    weight: '28 kg',
    image: require('@/../assets/images/petimg/Dog1.jpg'),
    healthStatus: 'Good Health',
    vaccineStatus: 'Up to Date',
    weightStatus: 'Healthy Weight',
    moodStatus: 'Active & Happy',
  },
  {
    id: 'lily',
    name: 'Lily',
    type: 'Cat',
    breed: 'Persian Cat',
    gender: 'Female',
    age: '2 Years',
    weight: '4.2 kg',
    image: require('@/../assets/images/petimg/cat.jpg'),
    healthStatus: 'Good Health',
    vaccineStatus: 'Due Soon',
    weightStatus: 'Healthy Weight',
    moodStatus: 'Calm & Sweet',
  },
  {
    id: 'coco',
    name: 'Coco',
    type: 'Rabbit',
    breed: 'Holland Lop',
    gender: 'Male',
    age: '1 Year',
    weight: '1.8 kg',
    image: require('@/../assets/images/petimg/Dog2.jpg'),
    healthStatus: 'Excellent',
    vaccineStatus: 'Up to Date',
    weightStatus: 'Optimal',
    moodStatus: 'Playful & Energetic',
  },
];

export default function MyPetsScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const { data: apiPets = [], isLoading, refetch, isFetching } = useGetUserPetsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [deletePetApi] = useDeletePetMutation();

  // Active Selected Pet Index
  const [selectedPetIndex, setSelectedPetIndex] = useState(0);

  // Active Tab: Overview | Health | Routine | Gallery
  const [activeTab, setActiveTab] = useState<'Overview' | 'Health' | 'Routine' | 'Gallery'>('Overview');

  // Demo Preview toggle for guest visitors who want to preview the UI
  const [showDemoPreview, setShowDemoPreview] = useState(false);

  // Merged Pets list (Live API pets prioritized, fallback to mockup sample companions only for guest preview)
  const allPets = useMemo(() => {
    if (isAuthenticated) {
      if (Array.isArray(apiPets) && apiPets.length > 0) {
        return apiPets.map((p, idx) => ({
          id: p.id || p.pet_id || `api-pet-${idx}`,
          name: p.name || 'Pet Companion',
          type: p.type || 'Pet',
          breed: p.breed || 'Companion Breed',
          gender: 'Male',
          age: p.birthDate ? `${new Date().getFullYear() - new Date(p.birthDate).getFullYear()} Years` : '3 Years',
          weight: '28 kg',
          image: p.image ? { uri: p.image } : DEFAULT_SAMPLE_PETS[idx % DEFAULT_SAMPLE_PETS.length].image,
          healthStatus: 'Good Health',
          vaccineStatus: p.vaccinationDue || 'Up to Date',
          weightStatus: 'Healthy Weight',
          moodStatus: 'Active & Happy',
        }));
      }
      return []; // Real empty list for logged-in user with no pets yet
    }
    return DEFAULT_SAMPLE_PETS;
  }, [isAuthenticated, apiPets]);

  const currentPet = allPets[selectedPetIndex] || allPets[0] || DEFAULT_SAMPLE_PETS[0];

  const handleAddPetPress = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to register and save your pets to your Wuffian account.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }
    router.push('/pets/add');
  };

  const handleDeletePet = (pet: any) => {
    Alert.alert(
      'Remove Pet',
      `Are you sure you want to remove ${pet.name} from My Pets?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (pet.id && !String(pet.id).startsWith('buddy') && !String(pet.id).startsWith('sample')) {
                await deletePetApi(pet.id).unwrap();
              }
              Alert.alert('Success', `${pet.name} has been removed.`);
              refetch();
            } catch (err: any) {
              Alert.alert('Error', err?.data?.message || 'Failed to remove pet.');
            }
          },
        },
      ]
    );
  };

  // =========================================================================
  // GUEST EXPERIENCE: Modern "Sign In to Access Your Pets" Screen
  // =========================================================================
  if (!isAuthenticated && !showDemoPreview) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF8F5' }}>
        <StatusBar style="dark" />
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF8F5' }} edges={['top']}>
          {/* Top Bar Header */}
          <View className="flex-row items-center justify-between px-5 pt-3 pb-2 bg-[#FAF8F5]">
            <Text className="text-[26px] font-black text-[#2D231E] tracking-tight font-heading">
              My Pets
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(auth)/login')}
              className="bg-[#1FB6C6] px-4 py-1.5 rounded-full shadow-xs"
            >
              <Text className="text-xs font-bold text-white">Sign In</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 18, paddingBottom: 48 }}
          >
            {/* Hero Card */}
            <View className="w-full bg-white rounded-3xl p-5 border border-[#E4E4E7] shadow-xs mb-5 overflow-hidden">
              <View className="w-full h-44 rounded-2xl overflow-hidden mb-4 bg-[#E8F9FB] relative items-center justify-center">
                <Image
                  source={require('@/../assets/images/dogfamily.png')}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <View className="absolute top-3 left-3 bg-black/65 px-3 py-1 rounded-full flex-row items-center">
                  <Ionicons name="paw" size={13} color="#1FB6C6" />
                  <Text className="text-[10px] font-bold text-white ml-1.5 tracking-wider uppercase">
                    Pet Health Ecosystem
                  </Text>
                </View>
              </View>

              {/* Title & Subtitle */}
              <View className="mb-2">
                <Text className="text-2xl font-black text-[#18181B] font-heading tracking-tight leading-tight">
                  Sign In to Access Your Pets
                </Text>
                <Text className="text-sm text-[#52525B] mt-2 leading-relaxed">
                  Keep your companions' digital health records, vaccination schedules, deworming history, and verified clinic bookings securely in the cloud.
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="mt-4 space-y-2.5">
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => router.push('/(auth)/login')}
                  className="w-full bg-[#1FB6C6] py-3.5 rounded-2xl flex-row items-center justify-center shadow-md"
                  style={{
                    shadowColor: '#1FB6C6',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.28,
                    shadowRadius: 6,
                    elevation: 3,
                  }}
                >
                  <Ionicons name="log-in-outline" size={19} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text className="text-white text-base font-bold">Sign In to Your Account</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/(auth)/login')}
                  className="w-full bg-[#FAF8F5] py-3 rounded-2xl border border-[#E4E4E7] items-center justify-center mt-2.5"
                >
                  <Text className="text-sm font-bold text-[#18181B]">Create Free Wuffian Account</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Feature Benefits List */}
            <Text className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-3 ml-1">
              Why Add Your Pets to Wuffian?
            </Text>

            <View className="bg-white rounded-2xl p-4 border border-[#E4E4E7] mb-3 flex-row items-center shadow-2xs">
              <View className="w-11 h-11 rounded-xl bg-[#E8F9FB] items-center justify-center mr-3.5 border border-[#1FB6C6]/20">
                <Ionicons name="shield-checkmark" size={22} color="#1FB6C6" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#18181B]">Digital Health Records</Text>
                <Text className="text-xs text-[#71717A] mt-0.5 leading-snug">
                  Keep rabies, DHPPiL, and deworming due dates accurately tracked and verified.
                </Text>
              </View>
            </View>

            <View className="bg-white rounded-2xl p-4 border border-[#E4E4E7] mb-3 flex-row items-center shadow-2xs">
              <View className="w-11 h-11 rounded-xl bg-[#EFF6FF] items-center justify-center mr-3.5 border border-[#3B82F6]/20">
                <Ionicons name="notifications" size={22} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#18181B]">Automated Reminders</Text>
                <Text className="text-xs text-[#71717A] mt-0.5 leading-snug">
                  Receive timely alerts before crucial vaccine due dates to keep your companion safe.
                </Text>
              </View>
            </View>

            <View className="bg-white rounded-2xl p-4 border border-[#E4E4E7] mb-6 flex-row items-center shadow-2xs">
              <View className="w-11 h-11 rounded-xl bg-[#FFF7ED] items-center justify-center mr-3.5 border border-[#EA580C]/20">
                <Ionicons name="medkit" size={22} color="#EA580C" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#18181B]">Direct Clinic Care</Text>
                <Text className="text-xs text-[#71717A] mt-0.5 leading-snug">
                  Instantly share companion details with verified veterinary clinics across Chennai.
                </Text>
              </View>
            </View>

            {/* Optional Demo Preview link */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setShowDemoPreview(true)}
              className="py-3 items-center justify-center flex-row"
            >
              <Ionicons name="eye-outline" size={16} color="#71717A" style={{ marginRight: 6 }} />
              <Text className="text-xs font-semibold text-[#71717A]">
                Want to explore first? <Text className="text-[#1FB6C6] font-bold">Preview Sample Pet Profile →</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF8F5' }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF8F5' }} edges={['top']}>
        {/* ======================================================== */}
        {/* 1. TOP HEADER: "My Pets" + Add Pet Button               */}
        {/* ======================================================== */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-3 bg-[#FAF8F5]">
          <Text className="text-[26px] font-black text-[#2D231E] tracking-tight font-heading">
            My Pets
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAddPetPress}
            className="flex-row items-center bg-[#FFF2EB] px-3.5 py-1.5 rounded-full border border-[#FED7AA]"
          >
            <Ionicons name="add-circle-outline" size={17} color="#EA580C" />
            <Text className="text-[12.5px] font-extrabold text-[#EA580C] ml-1.5">
              Add Pet
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guest Demo Preview Banner (Shown only when guest taps Preview Demo Profile) */}
        {!isAuthenticated && showDemoPreview && (
          <View className="mx-5 mb-3 bg-[#FFF7ED] p-3 rounded-2xl border border-[#FED7AA] flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <Ionicons name="sparkles" size={17} color="#EA580C" />
              <Text className="text-xs text-[#9A3412] ml-2 flex-1">
                <Text className="font-bold">Demo Preview:</Text> Sample profile only.
              </Text>
            </View>
            <View className="flex-row items-center space-x-1.5">
              <TouchableOpacity
                onPress={() => setShowDemoPreview(false)}
                className="px-2.5 py-1 bg-white rounded-full border border-[#FED7AA] mr-1.5"
              >
                <Text className="text-[11px] font-semibold text-[#78716C]">Exit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/(auth)/login')}
                className="bg-[#EA580C] px-3 py-1.5 rounded-full"
              >
                <Text className="text-xs font-bold text-white">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => {
                refetch();
              }}
              colors={['#1FB6C6', '#EA580C']}
            />
          }
        >
          {/* Authenticated Empty State: 0 pets registered */}
          {isAuthenticated && allPets.length === 0 ? (
            <View className="py-20 px-6 items-center justify-center">
              <View className="w-20 h-20 rounded-full bg-[#E8F9FB] items-center justify-center mb-4 border border-[#1FB6C6]/30">
                <Ionicons name="paw" size={38} color="#1FB6C6" />
              </View>
              <Text className="text-xl font-bold text-[#18181B] mb-2 font-heading text-center">
                No Pets Added Yet
              </Text>
              <Text className="text-sm text-[#71717A] text-center max-w-[280px] mb-6 leading-relaxed">
                Add your dog, cat, or companion to track health records, vaccination schedules, and schedule appointments.
              </Text>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.push('/pets/add')}
                className="bg-[#1FB6C6] px-6 py-3.5 rounded-full flex-row items-center shadow-md"
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text className="text-white text-sm font-bold">Add Your First Pet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ======================================================== */}
              {/* 2. PET AVATAR SWITCHER CAROUSEL                          */}
              {/* ======================================================== */}
              <View className="py-2">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 16, alignItems: 'center' }}
                >
                  {allPets.map((pet, idx) => {
                    const isSelected = selectedPetIndex === idx;
                    return (
                      <TouchableOpacity
                        key={pet.id}
                        activeOpacity={0.85}
                        onPress={() => setSelectedPetIndex(idx)}
                        className="items-center"
                      >
                        {/* Circle Avatar with Active Ring in Brand Blue */}
                        <View
                          className={`w-[66px] h-[66px] rounded-full p-[2.5px] items-center justify-center ${
                            isSelected
                              ? 'border-[2.5px] border-[#1FB6C6] bg-white'
                              : 'border border-[#EFE8DF] bg-white'
                          }`}
                          style={{
                            shadowColor: '#1FB6C6',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isSelected ? 0.35 : 0.04,
                            shadowRadius: 5,
                            elevation: isSelected ? 3 : 1,
                          }}
                        >
                          <Image
                            source={typeof pet.image === 'number' ? pet.image : pet.image}
                            className="w-full h-full rounded-full"
                            resizeMode="cover"
                          />
                        </View>

                        {/* Pet Name & Type Label */}
                        <Text
                          className={`text-[12px] mt-1.5 text-center ${
                            isSelected ? 'font-extrabold text-[#2D231E]' : 'font-semibold text-[#78716C]'
                          }`}
                        >
                          {pet.name}
                        </Text>
                        <Text className="text-[10px] font-medium text-[#A8A29E] text-center">
                          {pet.type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

              {/* Add Pet Avatar Circle */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/pets/add')}
                className="items-center"
              >
                <View
                  className="w-[66px] h-[66px] rounded-full items-center justify-center bg-white border border-dashed border-[#D6C7B7]"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                >
                  <Ionicons name="add" size={26} color="#78716C" />
                </View>
                <Text className="text-[11.5px] font-bold text-[#78716C] mt-1.5 text-center">
                  Add Pet
                </Text>
                <Text className="text-[10px] font-medium text-transparent">
                  New
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* ======================================================== */}
          {/* 3. FEATURED PET SHOWCASE HERO CARD (Mockup Screen 2 & 3) */}
          {/* ======================================================== */}
          <View className="px-5 mt-3 mb-5">
            <View
              className="w-full bg-white rounded-[26px] overflow-hidden border border-[#EFE8DF]"
              style={{
                shadowColor: '#8C6847',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              {/* Pet Image Banner with Overlay Elements */}
              <View className="w-full h-[210px] bg-[#F5ECE3] relative">
                <Image
                  source={typeof currentPet.image === 'number' ? currentPet.image : currentPet.image}
                  className="w-full h-full"
                  resizeMode="cover"
                />

                {/* Top Right: Edit Button + "My Best Friend ♡" Script */}
                <View className="absolute top-3.5 right-3.5 items-end">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({
                        pathname: '/pets/add',
                        params: { pet_id: String(currentPet.id) },
                      })
                    }
                    className="flex-row items-center bg-white/90 px-3 py-1.5 rounded-full border border-white/80 shadow-xs mb-1.5 backdrop-blur-md"
                  >
                    <Ionicons name="create-outline" size={13} color="#2D231E" />
                    <Text className="text-[11px] font-bold text-[#2D231E] ml-1">Edit</Text>
                  </TouchableOpacity>

                  <Text
                    className="text-[12px] text-white font-semibold italic drop-shadow-md"
                    style={{
                      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                      textShadowColor: 'rgba(0, 0, 0, 0.45)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    }}
                  >
                    My Best Friend ♡
                  </Text>
                </View>
              </View>

              {/* Pet Info & Detail Badges */}
              <View className="p-4.5 bg-white">
                <Text className="text-[23px] font-black text-[#2D231E] leading-tight">
                  {currentPet.name}
                </Text>
                <Text className="text-[13px] font-medium text-[#78716C] mt-0.5">
                  {currentPet.breed}
                </Text>

                {/* 3 Detail Badges in a Row (Male, 3 Years, 28 kg) */}
                <View className="flex-row items-center gap-2 mt-3">
                  <View className="flex-row items-center bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#EFE8DF]">
                    <Ionicons name="male" size={13} color="#0284C7" />
                    <Text className="text-xs font-bold text-[#2D231E] ml-1.5">{currentPet.gender}</Text>
                  </View>

                  <View className="flex-row items-center bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#EFE8DF]">
                    <Ionicons name="calendar-outline" size={13} color="#EA580C" />
                    <Text className="text-xs font-bold text-[#2D231E] ml-1.5">{currentPet.age}</Text>
                  </View>

                  <View className="flex-row items-center bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#EFE8DF]">
                    <Ionicons name="scale-outline" size={13} color="#059669" />
                    <Text className="text-xs font-bold text-[#2D231E] ml-1.5">{currentPet.weight}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ======================================================== */}
          {/* 4. TAB SWITCHER (Mockup Screen 3): Overview | Health ... */}
          {/* ======================================================== */}
          <View className="px-5 mb-4">
            <View className="flex-row items-center justify-between border-b border-[#EFE8DF] pb-2">
              {(['Overview', 'Health', 'Routine', 'Gallery'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    className="pb-1 relative"
                  >
                    <Text
                      className={`text-[13.5px] ${
                        isActive ? 'font-extrabold text-[#2D231E]' : 'font-medium text-[#A8A29E]'
                      }`}
                    >
                      {tab}
                    </Text>
                    {isActive && (
                      <View className="absolute bottom-[-9px] left-0 right-0 h-[2.5px] bg-[#1FB6C6] rounded-full" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ======================================================== */}
          {/* 5. 4 HEALTH STATUS METRIC SQUIRCLES (Mockup Screen 3)    */}
          {/* ======================================================== */}
          <View className="px-5 mb-5">
            <View className="flex-row flex-wrap justify-between">
              {[
                { title: 'Good Health', icon: 'heart', color: '#059669', bg: '#EAF6F0', border: '#A7F3D0' },
                { title: 'Up to Date Vaccination', icon: 'shield-checkmark', color: '#1FB6C6', bg: '#E8F9FB', border: '#BAE6FD' },
                { title: 'Healthy Weight', icon: 'bag-handle', color: '#EA580C', bg: '#FEF1E8', border: '#FED7AA' },
                { title: 'Active & Happy', icon: 'flash', color: '#7C3AED', bg: '#F3E8FF', border: '#DDD6FE' },
              ].map((badge) => (
                <View
                  key={badge.title}
                  className="w-[48%] rounded-2xl p-3 mb-3 border items-center justify-center"
                  style={{
                    backgroundColor: badge.bg,
                    borderColor: badge.border,
                    shadowColor: '#0F172A',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.03,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mb-1.5"
                    style={{ backgroundColor: `${badge.color}15` }}
                  >
                    <Ionicons name={badge.icon as any} size={20} color={badge.color} />
                  </View>
                  <Text className="text-[11.5px] font-extrabold text-[#2D231E] text-center" numberOfLines={2}>
                    {badge.title}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ======================================================== */}
          {/* 6. NEXT CARE DUE (Mockup Screen 3)                       */}
          {/* ======================================================== */}
          <View className="px-5 mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-[17px] font-extrabold text-[#2D231E]">
                Next Care Due
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Text className="text-xs font-bold text-[#1FB6C6]">Find Clinics</Text>
              </TouchableOpacity>
            </View>

            {[
              {
                title: 'Vaccination',
                sub: 'Annual Booster',
                date: '15 Oct 2026',
                daysLeft: 'In 24 days',
                icon: 'shield-checkmark-outline',
                color: '#0284C7',
                bg: '#EBF3FA',
                badgeBg: '#E0F2FE',
              },
              {
                title: 'Grooming',
                sub: 'Bath & Trim',
                date: '28 Sep 2026',
                daysLeft: 'In 7 days',
                icon: 'cut-outline',
                color: '#0D9488',
                bg: '#EAF6F0',
                badgeBg: '#CCFBF1',
              },
              {
                title: 'Vet Checkup',
                sub: 'General Health',
                date: '22 Sep 2026',
                daysLeft: 'In 1 day',
                icon: 'medkit-outline',
                color: '#EA580C',
                bg: '#FEF1E8',
                badgeBg: '#FFEDD5',
              },
            ].map((care) => (
              <TouchableOpacity
                key={care.title}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/search')}
                className="bg-white rounded-2xl p-3.5 mb-2.5 flex-row items-center justify-between border border-[#EFE8DF]"
                style={{
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  elevation: 1.5,
                }}
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View
                    className="w-11 h-11 rounded-2xl items-center justify-center mr-3"
                    style={{ backgroundColor: care.bg }}
                  >
                    <Ionicons name={care.icon as any} size={20} color={care.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-extrabold text-[#2D231E]">
                      {care.title}
                    </Text>
                    <Text className="text-[11.5px] font-medium text-[#78716C] mt-0.5">
                      {care.sub}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-xs font-bold text-[#2D231E]">{care.date}</Text>
                  <View
                    className="px-2 py-0.5 rounded-full mt-1"
                    style={{ backgroundColor: care.badgeBg }}
                  >
                    <Text
                      className="text-[10px] font-extrabold"
                      style={{ color: care.color }}
                    >
                      {care.daysLeft}
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={15} color="#A8A29E" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            ))}
          </View>

          {/* ======================================================== */}
          {/* 7. QUICK MANAGEMENT ACTION LIST (Mockup Screen 2)        */}
          {/* ======================================================== */}
          <View className="px-5 mb-5">
            <Text className="text-[17px] font-extrabold text-[#2D231E] mb-3">
              Pet Records &amp; Reminders
            </Text>

            {[
              {
                title: 'Health Records',
                sub: 'Vaccinations, Reports, Prescriptions',
                icon: 'document-text-outline',
                color: '#059669',
                bg: '#EAF6F0',
                route: () => router.push('/insights'),
              },
              {
                title: 'Care Reminders & Logs',
                sub: 'Vaccination schedules & wellness checkups',
                icon: 'notifications-outline',
                color: '#EA580C',
                bg: '#FEF1E8',
                route: () => router.push('/insights'),
              },
              {
                title: 'Growth Tracker',
                sub: 'Weight, Height & Progress',
                icon: 'bar-chart-outline',
                color: '#0284C7',
                bg: '#EBF3FA',
                route: () => router.push('/insights'),
              },
              {
                title: 'Care Reminders',
                sub: 'Never miss important care',
                icon: 'notifications-outline',
                color: '#7C3AED',
                bg: '#F3E8FF',
                route: () => router.push('/insights'),
              },
            ].map((act) => (
              <TouchableOpacity
                key={act.title}
                activeOpacity={0.8}
                onPress={act.route}
                className="bg-white rounded-2xl p-3.5 mb-2.5 flex-row items-center justify-between border border-[#EFE8DF]"
                style={{
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  elevation: 1.5,
                }}
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View
                    className="w-11 h-11 rounded-2xl items-center justify-center mr-3"
                    style={{ backgroundColor: act.bg }}
                  >
                    <Ionicons name={act.icon as any} size={20} color={act.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-extrabold text-[#2D231E]">
                      {act.title}
                    </Text>
                    <Text className="text-[11.5px] font-medium text-[#78716C] mt-0.5">
                      {act.sub}
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={16} color="#A8A29E" />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>

        {/* ======================================================== */}
        {/* 8. STICKY BOTTOM ACTION CTA BUTTON (Mockup Screen 3)     */}
        {/* ======================================================== */}
        <View
          className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 border-t border-[#EFE8DF]"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/search',
                params: { category: 'Veterinary' },
              })
            }
            className="w-full py-3.5 rounded-full items-center justify-center flex-row"
            style={{
              backgroundColor: '#8B4513',
              shadowColor: '#8B4513',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Text className="text-white text-[15px] font-extrabold mr-2">
              Explore Verified Clinics &amp; Vets
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
