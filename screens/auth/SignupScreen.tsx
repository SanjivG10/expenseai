import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';
import Logo from '../../components/Logo';
import { useAuth } from '../../contexts/AuthContext';

const signupSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;

interface SignupScreenProps {
  onNavigateToLogin: () => void;
}

export default function SignupScreen({ onNavigateToLogin }: SignupScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { signup, isLoading } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignupForm) => {
    if (!acceptedTerms) {
      Alert.alert(
        'Terms Required',
        'Please accept the Terms of Service and Privacy Policy to continue.'
      );
      return;
    }

    await signup(data.email, data.password, data.firstName, data.lastName);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="px-6 pb-8 pt-16">
          <View className="mb-8 items-center">
            <Logo />
            <Text className="text-3xl font-bold text-foreground">Create Account</Text>
            <Text className="mt-2 text-center text-muted-foreground">
              Join ExpenseAI to start tracking your finances
            </Text>
          </View>
        </View>

        {/* Signup Form */}
        <View className="flex-1 px-6">
          {/* Name Inputs */}
          <View className="mb-4 flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-2 text-sm font-medium text-foreground">First Name</Text>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="John"
                    placeholderTextColor="#a3a3a3"
                    autoCapitalize="words"
                    className="rounded-lg border border-border bg-input px-4 py-4 text-foreground"
                  />
                )}
              />
              {errors.firstName && (
                <Text className="mt-1 text-sm text-destructive">{errors.firstName.message}</Text>
              )}
            </View>

            <View className="flex-1">
              <Text className="mb-2 text-sm font-medium text-foreground">Last Name</Text>
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Doe"
                    placeholderTextColor="#a3a3a3"
                    autoCapitalize="words"
                    className="rounded-lg border border-border bg-input px-4 py-4 text-foreground"
                  />
                )}
              />
              {errors.lastName && (
                <Text className="mt-1 text-sm text-destructive">{errors.lastName.message}</Text>
              )}
            </View>
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-foreground">Email Address</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row items-center rounded-lg border border-border bg-input">
                  <View className="ml-4">
                    <Ionicons name="mail-outline" size={20} color="#a3a3a3" />
                  </View>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="john.doe@example.com"
                    placeholderTextColor="#a3a3a3"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 px-4 py-4 text-foreground"
                  />
                </View>
              )}
            />
            {errors.email && (
              <Text className="mt-1 text-sm text-destructive">{errors.email.message}</Text>
            )}
          </View>

          {/* Password Input */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-foreground">Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row items-center rounded-lg border border-border bg-input">
                  <View className="ml-4">
                    <Ionicons name="lock-closed-outline" size={20} color="#a3a3a3" />
                  </View>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Create a strong password"
                    placeholderTextColor="#a3a3a3"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    className="flex-1 px-4 py-4 text-foreground"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pr-4">
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#a3a3a3"
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && (
              <Text className="mt-1 text-sm text-destructive">{errors.password.message}</Text>
            )}
          </View>

          {/* Confirm Password Input */}
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-foreground">Confirm Password</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row items-center rounded-lg border border-border bg-input">
                  <View className="ml-4">
                    <Ionicons name="lock-closed-outline" size={20} color="#a3a3a3" />
                  </View>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Confirm your password"
                    placeholderTextColor="#a3a3a3"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    className="flex-1 px-4 py-4 text-foreground"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="pr-4">
                    <Ionicons
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#a3a3a3"
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.confirmPassword && (
              <Text className="mt-1 text-sm text-destructive">
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>

          {/* Terms and Conditions */}
          <TouchableOpacity
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            className="mb-6 flex-row items-start">
            <View
              className={`mr-3 mt-0.5 h-5 w-5 items-center justify-center rounded border-2 ${
                acceptedTerms ? 'border-primary bg-primary' : 'border-border'
              }`}>
              {acceptedTerms && <Ionicons name="checkmark" size={12} color="#000000" />}
            </View>
            <View className="flex-1">
              <Text className="text-sm leading-5 text-muted-foreground">
                I agree to the <Text className="text-primary">Terms of Service</Text> and{' '}
                <Text className="text-primary">Privacy Policy</Text>
              </Text>
            </View>
          </TouchableOpacity>

          {/* Signup Button */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            className={`mb-4 rounded-lg p-4 ${isLoading ? 'bg-muted' : 'bg-primary'}`}>
            <View className="flex-row items-center justify-center">
              {isLoading && (
                <View className="mr-2">
                  <Ionicons name="refresh-outline" size={20} color="#000000" />
                </View>
              )}
              <Text
                className={`font-semibold ${isLoading ? 'text-muted-foreground' : 'text-primary-foreground'}`}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View className="px-6 pb-8">
          <View className="flex-row items-center justify-center">
            <Text className="text-muted-foreground">Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text className="font-medium text-primary">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
