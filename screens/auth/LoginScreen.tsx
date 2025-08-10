import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/Logo';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginScreenProps {
  onNavigateToSignup: () => void;
  onNavigateToForgotPassword: () => void;
}

export default function LoginScreen({
  onNavigateToSignup,
  onNavigateToForgotPassword,
}: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    await login(data.email, data.password);
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
            <Text className="text-3xl font-bold text-foreground">Welcome Back</Text>
            <Text className="mt-2 text-center text-muted-foreground">
              Sign in to continue tracking your expenses
            </Text>
          </View>
        </View>

        {/* Login Form */}
        <View className="flex-1 px-6">
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
                    placeholder="Enter your email"
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
          <View className="mb-6">
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
                    placeholder="Enter your password"
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

          {/* Forgot Password Link */}
          <TouchableOpacity onPress={onNavigateToForgotPassword} className="mb-6 self-end">
            <Text className="text-sm font-medium text-primary">Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
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
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View className="px-6 pb-8">
          <View className="flex-row items-center justify-center">
            <Text className="text-muted-foreground">Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={onNavigateToSignup}>
              <Text className="font-medium text-primary">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
