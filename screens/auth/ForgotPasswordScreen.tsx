import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/Logo';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordScreenProps {
  onNavigateToLogin: () => void;
}

export default function ForgotPasswordScreen({ onNavigateToLogin }: ForgotPasswordScreenProps) {
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword, isLoading } = useAuth();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    await resetPassword(data.email);
    setEmailSent(true);
  };

  const handleResendEmail = async () => {
    const email = getValues('email');
    if (email) {
      await resetPassword(email);
    }
  };

  if (emailSent) {
    return (
      <View className="flex-1 bg-background">
        <StatusBar style="light" backgroundColor="#000000" />

        {/* Header with back button */}
        <View className="px-6 pb-4 pt-16">
          <TouchableOpacity onPress={onNavigateToLogin} className="mb-4 self-start">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 justify-center px-6">
            {/* Success Animation */}
            <View className="mb-8 items-center">
              <Logo />
              <Text className="mb-4 text-center text-3xl font-bold text-foreground">
                Check Your Email
              </Text>
              <Text className="mb-2 text-center text-lg leading-6 text-muted-foreground">
                We&apos;ve sent a password reset link to:
              </Text>
              <Text className="text-center text-lg font-semibold text-foreground">
                {getValues('email')}
              </Text>
            </View>

            {/* Instructions Card */}
            <View className="mb-8 rounded-xl border border-border bg-secondary p-6">
              <Text className="mb-4 text-lg font-semibold text-foreground">What&apos;s next?</Text>

              <View className="space-y-4">
                <View className="flex-row items-start">
                  <View className="mr-4 mt-1 h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <Text className="text-sm font-bold text-primary-foreground">1</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="mb-1 font-medium text-foreground">Check your inbox</Text>
                    <Text className="text-sm text-muted-foreground">
                      Look for an email from ExpenseAI with reset instructions
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <View className="mr-4 mt-1 h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <Text className="text-sm font-bold text-primary-foreground">2</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="mb-1 font-medium text-foreground">Click the reset link</Text>
                    <Text className="text-sm text-muted-foreground">
                      The link will take you to a secure page to create a new password
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <View className="mr-4 mt-1 h-8 w-8 items-center justify-center rounded-full bg-primary">
                    <Text className="text-sm font-bold text-primary-foreground">3</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="mb-1 font-medium text-foreground">Create new password</Text>
                    <Text className="text-sm text-muted-foreground">
                      Choose a strong password and sign in to your account
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Troubleshooting */}
            <View className="mb-6 rounded-xl border border-accent/20 bg-accent/10 p-4">
              <View className="flex-row items-start">
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color="#a3a3a3"
                  className="mr-3 mt-1"
                />
                <View className="flex-1">
                  <Text className="mb-1 text-sm font-medium text-foreground">
                    Didn&apos;t receive the email?
                  </Text>
                  <Text className="text-xs leading-4 text-muted-foreground">
                    Check your spam folder or try resending the email. Make sure the email address
                    is correct.
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="space-y-3">
              <TouchableOpacity
                onPress={handleResendEmail}
                disabled={isLoading}
                className={`rounded-xl border border-border p-4 ${isLoading ? 'bg-muted' : 'bg-secondary'}`}>
                <View className="flex-row items-center justify-center">
                  {isLoading && (
                    <View className="mr-2">
                      <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
                    </View>
                  )}
                  <Text
                    className={`font-semibold ${isLoading ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {isLoading ? 'Sending...' : 'Resend Email'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={onNavigateToLogin} className="rounded-xl bg-primary p-4">
                <Text className="text-center font-semibold text-primary-foreground">
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" backgroundColor="#000000" />

      <View className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header */}
          <View className="px-6 pb-8 pt-16">
            <TouchableOpacity onPress={onNavigateToLogin} className="mb-8 self-start">
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View className="items-center">
              <Logo />
              <Text className="mb-3 text-center text-3xl font-bold text-foreground">
                Reset Password
              </Text>
              <Text className="max-w-sm text-center text-lg leading-6 text-muted-foreground">
                Enter your email address and we&apos;ll send you a link to reset your password
              </Text>
            </View>
          </View>

          {/* Form */}
          <View className="flex-1 px-6">
            {/* Email Input */}
            <View className="mb-8">
              <Text className="mb-3 text-sm font-medium text-foreground">Email Address</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row items-center rounded-xl border border-border bg-input">
                    <View className="ml-4">
                      <Ionicons name="mail-outline" size={20} color="#a3a3a3" />
                    </View>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter your email address"
                      placeholderTextColor="#a3a3a3"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      className="flex-1 px-4 py-5 text-lg text-foreground"
                    />
                  </View>
                )}
              />
              {errors.email && (
                <Text className="mt-2 text-sm text-destructive">{errors.email.message}</Text>
              )}
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              className={`mb-6 rounded-xl p-5 ${isLoading ? 'bg-muted' : 'bg-primary'}`}>
              <View className="flex-row items-center justify-center">
                {isLoading && (
                  <View className="mr-2">
                    <Ionicons name="refresh-outline" size={20} color="#000000" />
                  </View>
                )}
                <Text
                  className={`text-lg font-bold ${isLoading ? 'text-muted-foreground' : 'text-primary-foreground'}`}>
                  {isLoading ? 'Sending Reset OTP Code...' : 'Send Reset OTP Code'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Info Card */}
            <View className="mb-6 rounded-xl border border-border bg-secondary p-4">
              <View className="flex-row items-start">
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#a3a3a3"
                  className="mr-3 mt-1"
                />
                <View className="flex-1">
                  <Text className="mb-1 text-sm font-medium text-foreground">Security Notice</Text>
                  <Text className="text-xs leading-4 text-muted-foreground">
                    For your security, the reset link will expire in 1 hour. If you don&apos;t
                    receive an email within a few minutes, please check your spam folder.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Link */}
          <View className="px-6 pb-8">
            <View className="flex-row items-center justify-center">
              <Text className="text-muted-foreground">Remember your password? </Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text className="font-semibold text-primary">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
