import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system';
import AddExpenseScreen from './AddExpenseScreen';
import { apiService } from '../services/api';
import { ProcessReceiptResponse } from '../types/api';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessReceiptResponse | null>(null);
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

  const processReceiptImage = async (imageUri: string) => {
    try {
      setIsProcessing(true);
      
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const response = await apiService.processReceipt({ image: base64 });
      
      if (response.success) {
        setProcessedData(response.data);
        setShowAddExpense(true);
      } else {
        Alert.alert('Processing Failed', response.message || 'Failed to process receipt');
      }
    } catch (error) {
      console.error('Receipt processing error:', error);
      Alert.alert('Error', 'Failed to process receipt image');
    } finally {
      setIsProcessing(false);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        if (photo?.uri) {
          await processReceiptImage(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const pickImage = async () => {
    if (isProcessing) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processReceiptImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleExpenseSave = async (expense: any) => {
    try {
      // Create expense using API
      await apiService.createExpense(expense);
      setShowAddExpense(false);
      setProcessedData(null);
      Alert.alert('Success', 'Expense added successfully!');
    } catch (error) {
      console.error('Error saving expense:', error);
      Alert.alert('Error', 'Failed to save expense');
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
          {/* Processing Overlay */}
          {isProcessing && (
            <View className="absolute inset-0 bg-black/70 items-center justify-center">
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text className="mt-4 text-lg text-white font-medium">Processing Receipt...</Text>
              <Text className="mt-1 text-sm text-white/70">Extracting expense data</Text>
            </View>
          )}
          
          <View className="flex-1 justify-end p-6">
            {/* Camera Controls */}
            <View className="flex-row items-center justify-between">
              {/* Gallery Button */}
              <TouchableOpacity
                onPress={pickImage}
                disabled={isProcessing}
                className={`h-12 w-12 items-center justify-center rounded-full border border-border ${
                  isProcessing ? 'bg-secondary/40' : 'bg-secondary/80'
                }`}>
                <Ionicons 
                  name="images-outline" 
                  size={24} 
                  color={isProcessing ? "#666666" : "#FFFFFF"} 
                />
              </TouchableOpacity>

              {/* Capture Button */}
              <TouchableOpacity
                onPress={takePicture}
                disabled={isProcessing}
                className={`h-20 w-20 items-center justify-center rounded-full border-4 ${
                  isProcessing ? 'border-gray-600' : 'border-primary'
                }`}>
                <View className={`h-16 w-16 rounded-full ${
                  isProcessing ? 'bg-gray-600' : 'bg-primary'
                }`} />
              </TouchableOpacity>

              {/* Flip Camera */}
              <TouchableOpacity
                onPress={toggleCameraFacing}
                disabled={isProcessing}
                className={`h-12 w-12 items-center justify-center rounded-full border border-border ${
                  isProcessing ? 'bg-secondary/40' : 'bg-secondary/80'
                }`}>
                <Ionicons 
                  name="camera-reverse-outline" 
                  size={24} 
                  color={isProcessing ? "#666666" : "#FFFFFF"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>

      {/* Action Buttons */}
      <View className="px-6 pb-24">
        <TouchableOpacity 
          onPress={() => {
            setProcessedData(null);
            setShowAddExpense(true);
          }}
          disabled={isProcessing}
          className={`rounded-lg border border-border p-4 ${
            isProcessing ? 'bg-secondary/50' : 'bg-secondary'
          }`}>
          <View className="flex-row items-center justify-center">
            <Ionicons 
              name="create-outline" 
              size={20} 
              color={isProcessing ? "#666666" : "#FFFFFF"} 
            />
            <Text className={`ml-2 font-medium ${
              isProcessing ? 'text-muted-foreground' : 'text-foreground'
            }`}>
              Add Expense Manually
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <AddExpenseScreen
        visible={showAddExpense}
        onClose={() => {
          setShowAddExpense(false);
          setProcessedData(null);
        }}
        onSave={handleExpenseSave}
        initialData={processedData}
      />
    </View>
  );
}
