import React from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface ProfileScreenProps {
  visible: boolean;
  onClose: () => void;
  currentUser: {
    firstName: string;
    lastName: string;
    email: string;
  };
  onSave: (data: ProfileForm) => void;
}

export default function ProfileScreen({
  visible,
  onClose,
  currentUser,
  onSave,
}: ProfileScreenProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
    },
  });

  React.useEffect(() => {
    if (visible) {
      reset({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
      });
    }
  }, [visible, currentUser, reset]);

  const onSubmit = (data: ProfileForm) => {
    onSave(data);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-background">
        <StatusBar style="light" backgroundColor="#000000" />

        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border px-6 pb-4 pt-14">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">Profile Information</Text>
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            className="rounded-lg bg-primary px-4 py-2">
            <Text className="font-semibold text-primary-foreground">Save</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-6 pt-8">
          {/* First Name */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-foreground">First Name *</Text>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter your first name"
                  placeholderTextColor="#a3a3a3"
                  className="rounded-lg border border-border bg-input px-4 py-4 text-foreground"
                />
              )}
            />
            {errors.firstName && (
              <Text className="mt-1 text-sm text-destructive">{errors.firstName.message}</Text>
            )}
          </View>

          {/* Last Name */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-foreground">Last Name *</Text>
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter your last name"
                  placeholderTextColor="#a3a3a3"
                  className="rounded-lg border border-border bg-input px-4 py-4 text-foreground"
                />
              )}
            />
            {errors.lastName && (
              <Text className="mt-1 text-sm text-destructive">{errors.lastName.message}</Text>
            )}
          </View>

          {/* Email (Read-only) */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-muted-foreground">Email Address</Text>
            <View className="rounded-lg border border-border bg-muted px-4 py-4">
              <Text className="text-muted-foreground">{currentUser.email}</Text>
            </View>
            <Text className="mt-1 text-xs text-muted-foreground">Email cannot be changed</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
