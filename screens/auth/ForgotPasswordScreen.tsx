import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/Logo';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetPasswordSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    otp: z.string().min(6, 'OTP must be at least 6 characters'),
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

type EmailForm = z.infer<typeof emailSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

interface ForgotPasswordScreenProps {
  onNavigateToLogin: () => void;
}

export default function ForgotPasswordScreen({ onNavigateToLogin }: ForgotPasswordScreenProps) {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { sendPasswordResetOTP, resetPasswordWithOTP } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email form
  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  // Reset password form
  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
      otp: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onEmailSubmit = async (data: EmailForm) => {
    try {
      setIsLoading(true);
      await sendPasswordResetOTP(data.email);
      setEmail(data.email);
      resetForm.setValue('email', data.email);
      setStep('reset');
    } catch (error) {
      console.error('Send OTP error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordForm) => {
    try {
      setIsLoading(true);
      await resetPasswordWithOTP(data.email, data.otp, data.password);
      onNavigateToLogin();
    } catch (error) {
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (email) {
      try {
        setIsLoading(true);
        await sendPasswordResetOTP(email);
      } catch (error) {
        console.error('Resend OTP error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Show password reset form if OTP has been sent
  if (step === 'reset') {
    return (
      <View className="flex-1 bg-background">
        <StatusBar style="light" backgroundColor="#000000" />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header */}
          <View className="px-6 pb-8 pt-16">
            <TouchableOpacity onPress={() => setStep('email')} className="mb-8 self-start">
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View className="items-center">
              <Logo />
              <Text className="mb-3 text-center text-3xl font-bold text-foreground">
                Enter OTP & New Password
              </Text>
              <Text className="max-w-sm text-center text-lg leading-6 text-muted-foreground">
                Enter the OTP sent to {email} and your new password
              </Text>
            </View>
          </View>

          {/* Form */}
          <View className="flex-1 px-6">
            {/* OTP Input */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-foreground">OTP Code</Text>
              <Controller
                control={resetForm.control}
                name="otp"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row items-center rounded-lg border border-border bg-input">
                    <View className="ml-4">
                      <Ionicons name="key-outline" size={20} color="#a3a3a3" />
                    </View>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor="#a3a3a3"
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!isLoading}
                      className="flex-1 px-4 py-4 text-center font-mono text-lg text-foreground"
                    />
                  </View>
                )}
              />
              {resetForm.formState.errors.otp && (
                <Text className="mt-1 text-sm text-destructive">
                  {resetForm.formState.errors.otp.message}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-foreground">New Password</Text>
              <Controller
                control={resetForm.control}
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
                      editable={!isLoading}
                      className="flex-1 px-4 py-4 text-foreground"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="pr-4">
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#a3a3a3"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {resetForm.formState.errors.password && (
                <Text className="mt-1 text-sm text-destructive">
                  {resetForm.formState.errors.password.message}
                </Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-foreground">Confirm New Password</Text>
              <Controller
                control={resetForm.control}
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
                      editable={!isLoading}
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
              {resetForm.formState.errors.confirmPassword && (
                <Text className="mt-1 text-sm text-destructive">
                  {resetForm.formState.errors.confirmPassword.message}
                </Text>
              )}
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              onPress={resetForm.handleSubmit(onResetSubmit)}
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
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom Actions */}
          <View className="px-6 pb-8">
            <View className="mb-3 flex-row items-center justify-center">
              <Text className="text-muted-foreground">Didn&apos;t receive the OTP? </Text>
              <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
                <Text className="font-medium text-primary">Resend</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-center">
              <Text className="text-muted-foreground">Remember your password? </Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text className="font-medium text-primary">Sign In</Text>
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
                control={emailForm.control}
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
                      editable={!isLoading}
                      className="flex-1 px-4 py-5 text-lg text-foreground"
                    />
                  </View>
                )}
              />
              {emailForm.formState.errors.email && (
                <Text className="mt-2 text-sm text-destructive">
                  {emailForm.formState.errors.email.message}
                </Text>
              )}
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              onPress={emailForm.handleSubmit(onEmailSubmit)}
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
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
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
                    For your security, the OTP will expire in 10 minutes. If you don&apos;t receive
                    an email within a few minutes, please check your spam folder.
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
