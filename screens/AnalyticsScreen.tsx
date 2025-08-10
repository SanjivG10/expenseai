import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const chartConfig = {
    backgroundColor: '#000000',
    backgroundGradientFrom: '#1a1a1a',
    backgroundGradientTo: '#262626',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(163, 163, 163, ${opacity})`,
    style: {
      borderRadius: 8,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#FFFFFF',
    },
  };

  const spendingTrendData = {
    labels: ['Jan 1', 'Jan 8', 'Jan 15', 'Jan 22', 'Jan 29'],
    datasets: [
      {
        data: [120, 180, 95, 230, 160],
      },
    ],
  };

  const categoryData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        data: [450, 380, 520, 310, 480],
      },
    ],
  };

  const categoryBreakdown = [
    { name: 'Food', amount: 234, color: '#FFFFFF', legendFontColor: '#FFFFFF' },
    { name: 'Transport', amount: 156, color: '#a3a3a3', legendFontColor: '#a3a3a3' },
    { name: 'Shopping', amount: 189, color: '#666666', legendFontColor: '#666666' },
    { name: 'Entertainment', amount: 89, color: '#404040', legendFontColor: '#404040' },
    { name: 'Other', amount: 67, color: '#262626', legendFontColor: '#262626' },
  ];

  const totalSpent = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);

  const stats = [
    { label: 'This Month', value: '$823.45', change: '+12%', icon: 'trending-up' },
    { label: 'Average Daily', value: '$27.45', change: '+5%', icon: 'calendar' },
    { label: 'Categories', value: '8', change: '0%', icon: 'list' },
    { label: 'Transactions', value: '32', change: '+8%', icon: 'receipt' },
  ];

  return (
    <View className="bg-background flex-1">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-border border-b px-6 pb-4 pt-14">
        <Text className="text-foreground text-2xl font-bold">Analytics</Text>
        <Text className="text-muted-foreground mt-1 text-sm">Spending insights and trends</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View className="mx-6 mt-6">
          <View className="border-border bg-secondary flex-row rounded-lg border p-1">
            {(['week', 'month', 'year'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                className={`flex-1 rounded-md py-2 ${
                  selectedPeriod === period ? 'bg-accent' : ''
                }`}>
                <Text
                  className={`text-center font-medium capitalize ${
                    selectedPeriod === period ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Cards */}
        <View className="mx-6 mt-6 flex-row flex-wrap gap-3">
          {stats.map((stat, index) => (
            <View key={index} className="border-border bg-secondary w-[48%] rounded-lg border p-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Ionicons name={stat.icon as any} size={20} color="#a3a3a3" />
                <Text
                  className={`text-xs font-medium ${
                    stat.change.startsWith('+') ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                  {stat.change}
                </Text>
              </View>
              <Text className="text-foreground text-xl font-bold">{stat.value}</Text>
              <Text className="text-muted-foreground text-sm">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Spending Trend Chart */}
        <View className="mx-6 mt-6">
          <Text className="text-foreground mb-4 text-lg font-semibold">Spending Trend</Text>
          <View className="border-border bg-secondary overflow-hidden rounded-lg border">
            <LineChart
              data={spendingTrendData}
              width={screenWidth - 48}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={{ marginVertical: 8 }}
            />
          </View>
        </View>

        {/* Category Breakdown */}
        <View className="mx-6 mt-6">
          <Text className="text-foreground mb-4 text-lg font-semibold">Category Breakdown</Text>
          <View className="border-border bg-secondary rounded-lg border p-4">
            <PieChart
              data={categoryBreakdown}
              width={screenWidth - 80}
              height={200}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
            />

            {/* Category Details */}
            <View className="mt-4">
              {categoryBreakdown.map((category, index) => (
                <View key={index} className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center">
                    <View
                      className="mr-3 h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <Text className="text-foreground">{category.name}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-foreground font-semibold">${category.amount}</Text>
                    <Text className="text-muted-foreground text-sm">
                      {((category.amount / totalSpent) * 100).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Monthly Comparison */}
        <View className="mx-6 mb-8 mt-6">
          <Text className="text-foreground mb-4 text-lg font-semibold">Monthly Comparison</Text>
          <View className="border-border bg-secondary overflow-hidden rounded-lg border">
            <BarChart
              data={categoryData}
              width={screenWidth - 48}
              height={200}
              chartConfig={chartConfig}
              style={{ marginVertical: 8 }}
              yAxisLabel="$"
              yAxisSuffix=""
            />
          </View>
        </View>

        {/* Bottom Spacing for Tab Bar */}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
