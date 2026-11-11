import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const activeColor = '#1FB6C6';
  const inactiveColor = '#8C7E74';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F0E7DD',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 6,
          shadowColor: '#8C6847',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {/* 1. Home Tab */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={21}
              color={focused ? activeColor : inactiveColor}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 11,
                fontWeight: focused ? '700' : '500',
                color: focused ? activeColor : inactiveColor,
                marginTop: 2,
              }}
            >
              Home
            </Text>
          ),
        }}
      />

      {/* 2. Services Tab */}
      <Tabs.Screen
        name="search"
        options={{
          title: 'Services',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={21}
              color={focused ? activeColor : inactiveColor}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 11,
                fontWeight: focused ? '700' : '500',
                color: focused ? activeColor : inactiveColor,
                marginTop: 2,
              }}
            >
              Services
            </Text>
          ),
        }}
      />

      {/* 3. My Pets Tab */}
      <Tabs.Screen
        name="my-pets"
        options={{
          title: 'My Pets',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'paw' : 'paw-outline'}
              size={21}
              color={focused ? activeColor : inactiveColor}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 11,
                fontWeight: focused ? '700' : '500',
                color: focused ? activeColor : inactiveColor,
                marginTop: 2,
              }}
            >
              My Pets
            </Text>
          ),
        }}
      />

      {/* 4. Bookings Tab (Hidden from bottom tab bar) */}
      <Tabs.Screen
        name="bookings"
        options={{
          href: null,
        }}
      />

      {/* 5. Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={21}
              color={focused ? activeColor : inactiveColor}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontSize: 11,
                fontWeight: focused ? '700' : '500',
                color: focused ? activeColor : inactiveColor,
                marginTop: 2,
              }}
            >
              Profile
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
