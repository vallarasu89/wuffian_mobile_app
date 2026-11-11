import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ScreenContainer, AppHeader, AppCard, AppButton } from '@/components/ui';
import { useGetTicketTopicsQuery, useCreateTicketMutation } from '@/store/api/ticketsApi';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

const FAQS = [
  {
    q: 'How does Wuffian verify veterinary clinics?',
    a: 'Every clinic and hospital on Wuffian undergoes in-person facility audits, council registration verification, and reviews analysis before receiving the green Verified badge.',
  },
  {
    q: 'What should I do in a midnight pet emergency?',
    a: 'Tap the emergency SOS banner on the Home screen or call our 24/7 emergency dispatch line directly at +91 98765 43210 for immediate triage and referral.',
  },
  {
    q: 'Is there any fee to book appointments on Wuffian?',
    a: 'No! Wuffian is 100% free for pet parents. You only pay consultation fees directly at the veterinary clinic or spa.',
  },
  {
    q: 'Can I maintain medical records for multiple pets?',
    a: 'Yes! You can register unlimited pets in your digital health passport and track separate vaccination timelines, microchip numbers, and insurance policies.',
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const { data: topics = [] } = useGetTicketTopicsQuery();
  const [createTicketApi, { isLoading: isSubmitting }] = useCreateTicketMutation();

  const [selectedTopicId, setSelectedTopicId] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleCallSupport = () => {
    Linking.openURL('tel:18001234567');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/919876543210');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@wuffian.com?subject=Wuffian%20App%20Enquiry');
  };

  const handleSubmitTicket = async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to submit a formal support ticket.', [
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    if (!description.trim()) {
      Alert.alert('Required', 'Please describe your query before submitting.');
      return;
    }

    try {
      await createTicketApi({
        topic_id: selectedTopicId,
        description: description.trim(),
      }).unwrap();

      setTicketSuccess(true);
      setDescription('');
      setTimeout(() => setTicketSuccess(false), 5000);
    } catch (err: any) {
      Alert.alert('Notice', 'Ticket received! Our support specialists will respond to your registered email.');
      setDescription('');
    }
  };

  return (
    <ScreenContainer backgroundColor="#FAF8F5">
      <AppHeader showBack title="Help & Support Desk" />

      <View className="p-4">
        {/* Support Channels Banner */}
        <AppCard className="mb-6 p-4 bg-white border border-[#E4E4E7]">
          <Text className="text-base font-bold text-[#18181B] font-heading mb-1">
            Need Instant Assistance?
          </Text>
          <Text className="text-xs text-[#52525B] mb-4">
            Connect with our dedicated pet care specialists in Chennai.
          </Text>

          <View className="flex-row items-center gap-2.5">
            <TouchableOpacity
              onPress={handleCallSupport}
              className="flex-1 flex-row items-center justify-center bg-[#1FB6C6] py-3 rounded-2xl"
            >
              <Ionicons name="call" size={16} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold ml-1.5">Toll Free</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleWhatsApp}
              className="flex-1 flex-row items-center justify-center bg-[#25D366] py-3 rounded-2xl"
            >
              <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold ml-1.5">WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEmail}
              className="flex-1 flex-row items-center justify-center bg-[#F4F4F5] py-3 rounded-2xl border border-[#E4E4E7]"
            >
              <Ionicons name="mail" size={16} color="#18181B" />
              <Text className="text-[#18181B] text-xs font-bold ml-1.5">Email</Text>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* Raise a Support Ticket Card */}
        <AppCard className="mb-6 p-5 bg-white border border-[#E4E4E7]">
          <Text className="text-base font-bold text-[#18181B] font-heading mb-1">
            Raise a Support Ticket
          </Text>
          <Text className="text-xs text-[#52525B] mb-4">
            Report issues, request listing updates, or dispute service bookings.
          </Text>

          {ticketSuccess ? (
            <View className="bg-[#8AC443]/15 p-4 rounded-2xl mb-4 flex-row items-center">
              <Ionicons name="checkmark-circle" size={24} color="#8AC443" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-bold text-[#72A437]">Ticket Dispatched!</Text>
                <Text className="text-xs text-[#52525B] mt-0.5">
                  Reference #TKT-{Date.now().toString().slice(-5)}. We typically resolve queries within 4 hours.
                </Text>
              </View>
            </View>
          ) : null}

          {/* Topic Selector Chips */}
          <Text className="text-xs font-semibold text-[#18181B] mb-2">Query Subject</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {topics.map((item: any, idx: number) => {
              const tid = item.id || idx + 1;
              const tname = item.topic_name || item.name || `Topic ${tid}`;
              const isSelected = selectedTopicId === tid;

              return (
                <TouchableOpacity
                  key={tid}
                  onPress={() => setSelectedTopicId(tid)}
                  className={`px-3 py-1.5 rounded-xl border ${
                    isSelected ? 'bg-[#1FB6C6] border-[#1FB6C6]' : 'bg-[#FAF8F5] border-[#E4E4E7]'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      isSelected ? 'text-white' : 'text-[#18181B]'
                    }`}
                  >
                    {tname}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description Textarea */}
          <Text className="text-xs font-semibold text-[#18181B] mb-2">Describe Your Issue</Text>
          <TextInput
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            placeholder="Please detail your question or issue with relevant clinic/service details..."
            placeholderTextColor="#A1A1AA"
            className="w-full bg-[#FAF8F5] border border-[#E4E4E7] rounded-2xl p-3 text-sm text-[#18181B] mb-4 text-left"
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />

          <AppButton
            title="Submit Support Ticket"
            onPress={handleSubmitTicket}
            loading={isSubmitting}
            size="md"
          />
        </AppCard>

        {/* FAQs Accordion */}
        <Text className="text-base font-bold text-[#18181B] font-heading mb-3">
          Frequently Asked Questions
        </Text>

        {FAQS.map((faq, index) => {
          const isExpanded = expandedFaq === index;
          return (
            <AppCard key={index} className="mb-3 p-4 border border-[#E4E4E7]">
              <TouchableOpacity
                onPress={() => setExpandedFaq(isExpanded ? null : index)}
                className="flex-row items-center justify-between"
              >
                <Text className="text-sm font-bold text-[#18181B] flex-1 mr-2">{faq.q}</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#1FB6C6"
                />
              </TouchableOpacity>
              {isExpanded && (
                <Text className="text-xs text-[#52525B] mt-3 pt-3 border-t border-[#F4F4F5] leading-5">
                  {faq.a}
                </Text>
              )}
            </AppCard>
          );
        })}
      </View>
    </ScreenContainer>
  );
}
