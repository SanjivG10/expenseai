import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I add expenses?',
    answer:
      'You can add expenses in two ways: 1) Use the camera to scan receipts from the Add tab, or 2) Manually enter expense details using the "Add Manual" button on the dashboard.',
  },
  {
    id: '2',
    question: 'How does receipt scanning work?',
    answer:
      'Take a photo of your receipt using the camera. Our AI will automatically extract the amount, merchant name, and date. You can then review and confirm the details before saving.',
  },
  {
    id: '3',
    question: 'Can I edit or delete expenses?',
    answer:
      'Yes! Go to the Expenses tab, find the expense you want to modify, and tap on it. You can then edit the details or delete the expense entirely.',
  },
  {
    id: '4',
    question: 'How do I create custom categories?',
    answer:
      'Go to Settings > Categories to view all existing categories. You can add new categories with custom names and icons, or delete categories you no longer need.',
  },
  {
    id: '5',
    question: 'What do the analytics show?',
    answer:
      'The Analytics tab provides insights into your spending patterns including monthly trends, category breakdowns, and comparison charts to help you understand your expenses better.',
  },
  {
    id: '6',
    question: 'How do I use the calendar view?',
    answer:
      'On the Dashboard, tap the calendar icon in the top-right corner. You can then navigate between months and tap on specific days to see expenses for that date.',
  },
  {
    id: '7',
    question: 'Is my data safe?',
    answer:
      'Yes, all your expense data is stored locally on your device. We do not store your personal financial information on external servers.',
  },
  {
    id: '8',
    question: 'How do I search for expenses?',
    answer:
      'Go to the Expenses tab and use the search bar at the top. You can search by expense description, and also filter by category or sort by date, amount, or category.',
  },
];

interface FAQScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function FAQScreen({ visible, onClose }: FAQScreenProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="bg-background flex-1">
        <StatusBar style="light" backgroundColor="#000000" />

        {/* Header */}
        <View className="border-border flex-row items-center justify-between border-b px-6 pb-4 pt-14">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-foreground text-xl font-bold">Help & FAQ</Text>
          <View className="w-6" />
        </View>

        <ScrollView className="flex-1 px-6 pt-4">
          <Text className="text-muted-foreground mb-6 text-center">
            Find answers to commonly asked questions about ExpenseAI
          </Text>

          {faqs.map((faq) => {
            const isExpanded = expandedItems.has(faq.id);
            return (
              <View
                key={faq.id}
                className="border-border bg-secondary mb-3 overflow-hidden rounded-lg border">
                <TouchableOpacity
                  onPress={() => toggleExpanded(faq.id)}
                  className="flex-row items-center justify-between p-4">
                  <Text className="text-foreground flex-1 pr-3 font-medium">{faq.question}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#a3a3a3"
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <View className="border-border border-t px-4 pb-4">
                    <Text className="text-muted-foreground pt-3 text-sm leading-6">
                      {faq.answer}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          <View className="border-border bg-secondary mt-8 rounded-lg border p-4">
            <Text className="text-foreground mb-2 font-semibold">Still need help?</Text>
            <Text className="text-muted-foreground text-sm">
              If you can&apos;t find the answer you&apos;re looking for, feel free to contact our
              support team.
            </Text>
          </View>

          <View className="h-10" />
        </ScrollView>
      </View>
    </Modal>
  );
}
