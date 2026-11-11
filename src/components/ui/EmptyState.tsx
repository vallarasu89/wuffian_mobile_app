import React from 'react';
import { View, Text, Image } from 'react-native';
import { AppButton } from './AppButton';

export interface EmptyStateProps {
  title: string;
  description?: string;
  image?: any;
  actionTitle?: string;
  onActionPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  image,
  actionTitle,
  onActionPress,
}) => {
  const defaultImage = require('@/../assets/images/noreasult.webp');
  const imageSource = image || defaultImage;

  return (
    <View className="items-center justify-center p-6 my-8">
      <Image
        source={imageSource}
        style={{ width: 180, height: 180 }}
        resizeMode="contain"
      />
      <Text className="text-lg font-bold text-[#18181B] text-center mt-4 font-heading">
        {title}
      </Text>
      {description ? (
        <Text className="text-sm text-[#52525B] text-center mt-1.5 px-4 leading-5">
          {description}
        </Text>
      ) : null}

      {actionTitle && onActionPress ? (
        <View className="mt-6 w-full max-w-[220px]">
          <AppButton title={actionTitle} onPress={onActionPress} size="md" />
        </View>
      ) : null}
    </View>
  );
};
