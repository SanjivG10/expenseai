import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { apiService } from '../services/api';
import { AnalyticsResponse, AnalyticsQuery } from '../types/api';
import LoadingScreen from '../components/LoadingScreen';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch analytics data from API
  const fetchAnalyticsData = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const query: AnalyticsQuery = {
        period: selectedPeriod,
      };

      const response = await apiService.getAnalyticsData(query);
      
      if (response.success) {
        setAnalyticsData(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      Alert.alert('Error', 'Failed to load analytics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Re-fetch when period changes
  useEffect(() => {
    if (!isLoading) {
      fetchAnalyticsData();
    }
  }, [selectedPeriod]);

  const handleRefresh = () => {
    fetchAnalyticsData(true);
  };

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

  // Transform API data for charts
  const spendingTrendData = analyticsData ? {
    labels: analyticsData.spending_trends.labels,
    datasets: [
      {
        data: analyticsData.spending_trends.data,
      },
    ],
  } : { labels: [], datasets: [{ data: [] }] };

  const monthlyComparisonData = analyticsData ? {
    labels: analyticsData.monthly_comparison.labels,
    datasets: [
      {
        data: analyticsData.monthly_comparison.data,
      },
    ],
  } : { labels: [], datasets: [{ data: [] }] };

  const categoryBreakdown = analyticsData ? analyticsData.category_breakdown.map(category => ({
    name: category.category_name,
    amount: category.amount,
    color: category.category_color,
    legendFontColor: category.category_color,
  })) : [];

  const totalSpent = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);

  const stats = analyticsData ? [
    { 
      label: 'This Month', 
      value: `$${analyticsData.summary.this_month.total.toFixed(2)}`, 
      change: analyticsData.summary.this_month.change, 
      icon: 'trending-up' 
    },
    { 
      label: 'Average Daily', 
      value: `$${analyticsData.summary.avg_daily.amount.toFixed(2)}`, 
      change: analyticsData.summary.avg_daily.change, 
      icon: 'calendar' 
    },
    { 
      label: 'Categories', 
      value: analyticsData.summary.total_categories.toString(), 
      change: '0%', 
      icon: 'list' 
    },
    { 
      label: 'Transactions', 
      value: analyticsData.summary.total_transactions.toString(), 
      change: '+8%', 
      icon: 'receipt' 
    },
  ] : [];

  // Loading state
  if (isLoading && !analyticsData) {
    return <LoadingScreen message="Loading your analytics..." />;
  }

  return (
    <View className="bg-background flex-1">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-border border-b px-6 pb-4 pt-14">
        <Text className="text-foreground text-2xl font-bold">Analytics</Text>
        <Text className="text-muted-foreground mt-1 text-sm">Spending insights and trends</Text>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            titleColor="#FFFFFF"
          />
        }>
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
            {analyticsData && spendingTrendData.datasets[0].data.length > 0 ? (
              <LineChart
                data={spendingTrendData}
                width={screenWidth - 48}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={{ marginVertical: 8 }}
              />
            ) : (
              <View className="h-[200px] items-center justify-center">
                <Ionicons name="trending-up-outline" size={48} color="#404040" />
                <Text className="mt-2 text-muted-foreground">No trend data available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Category Breakdown */}
        <View className="mx-6 mt-6">
          <Text className="text-foreground mb-4 text-lg font-semibold">Category Breakdown</Text>
          <View className="border-border bg-secondary rounded-lg border p-4">
            {categoryBreakdown.length > 0 ? (
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
            ) : (
              <View className="h-[200px] items-center justify-center">
                <Ionicons name="pie-chart-outline" size={48} color="#404040" />
                <Text className="mt-2 text-muted-foreground">No category data available</Text>
              </View>
            )}

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
            {analyticsData && monthlyComparisonData.datasets[0].data.length > 0 ? (
              <BarChart
                data={monthlyComparisonData}
                width={screenWidth - 48}
                height={200}
                chartConfig={chartConfig}
                style={{ marginVertical: 8 }}
                yAxisLabel="$"
                yAxisSuffix=""
              />
            ) : (
              <View className="h-[200px] items-center justify-center">
                <Ionicons name="bar-chart-outline" size={48} color="#404040" />
                <Text className="mt-2 text-muted-foreground">No comparison data available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Spacing for Tab Bar */}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
