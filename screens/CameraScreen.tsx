import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View className="flex-1 bg-background" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <StatusBar style="light" backgroundColor="#000000" />
        <Ionicons name="camera-outline" size={80} color="#404040" />
        <Text className="mt-6 text-center text-xl font-bold text-foreground">
          Camera Permission Required
        </Text>
        <Text className="mb-8 mt-2 text-center text-muted-foreground">
          We need camera access to scan receipts and capture expense photos
        </Text>
        <TouchableOpacity onPress={requestPermission} className="rounded-lg bg-primary px-8 py-3">
          <Text className="font-semibold text-primary-foreground">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        if (photo?.uri) {
          Alert.alert(
            'Photo Captured',
            'Receipt processing will be implemented with backend integration.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        Alert.alert(
          'Image Selected',
          'Receipt processing will be implemented with backend integration.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-b border-border bg-background px-6 pb-4 pt-14">
        <Text className="text-2xl font-bold text-foreground">Add Expense</Text>
        <Text className="mt-1 text-sm text-muted-foreground">Scan receipt or add manually</Text>
      </View>

      {/* Camera View */}
      <View className="m-4 flex-1 overflow-hidden rounded-xl border border-border">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
          <View className="flex-1 justify-end p-6">
            {/* Camera Controls */}
            <View className="flex-row items-center justify-between">
              {/* Gallery Button */}
              <TouchableOpacity
                onPress={pickImage}
                className="h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary/80">
                <Ionicons name="images-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Capture Button */}
              <TouchableOpacity
                onPress={takePicture}
                className="h-20 w-20 items-center justify-center rounded-full border-4 border-primary">
                <View className="h-16 w-16 rounded-full bg-primary" />
              </TouchableOpacity>

              {/* Flip Camera */}
              <TouchableOpacity
                onPress={toggleCameraFacing}
                className="h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary/80">
                <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>

      {/* Action Buttons */}
      <View className="px-6 pb-8">
        <TouchableOpacity className="rounded-lg border border-border bg-secondary p-4">
          <View className="flex-row items-center justify-center">
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            <Text className="ml-2 font-medium text-foreground">Add Expense Manually</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
