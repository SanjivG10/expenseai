import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { apiService } from '../services/api';
import { AnalyticsScreenResponse, AnalyticsScreenQuery } from '../types/analytics';
import LoadingScreen, { InlineLoader } from '../components/LoadingScreen';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsScreenResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(false);

  // Get period-specific labels
  const getPeriodLabels = () => {
    switch (selectedPeriod) {
      case 'week':
        return {
          summary: 'This Week',
          trend: 'Daily Spending Trend',
          comparison: 'Weekly Comparison',
          avgLabel: 'Average Daily',
        };
      case 'month':
        return {
          summary: 'This Month',
          trend: 'Weekly Spending Trend',
          comparison: 'Monthly Comparison',
          avgLabel: 'Average Daily',
        };
      case 'year':
        return {
          summary: 'This Year',
          trend: 'Monthly Spending Trend',
          comparison: 'Yearly Comparison',
          avgLabel: 'Average Monthly',
        };
    }
  };

  const periodLabels = getPeriodLabels();

  // Fetch analytics data from API
  const fetchAnalyticsData = async (isRefresh = false, isPeriodChange = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else if (isPeriodChange) setIsLoadingPeriod(true);
      else setIsLoading(true);

      const query: AnalyticsScreenQuery = {
        period: selectedPeriod,
      };

      const response = await apiService.getAnalyticsData(query);

      if (response.success && response.data) {
        setAnalyticsData(response.data);
      } else {
        console.error('Analytics error:', response);
        Alert.alert('Error', response.message || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'Failed to load analytics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingPeriod(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Re-fetch when period changes
  useEffect(() => {
    if (!isLoading) {
      fetchAnalyticsData(false, true);
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
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#404040',
      strokeWidth: 1,
    },
  };

  // Transform API data for charts
  const spendingTrendData =
    analyticsData && analyticsData.spending_trends
      ? {
          labels: analyticsData.spending_trends.labels || [],
          datasets: [
            {
              data: analyticsData.spending_trends.data || [],
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              strokeWidth: 2,
            },
          ],
        }
      : { labels: [], datasets: [{ data: [] }] };

  const comparisonData =
    analyticsData && analyticsData.monthly_comparison
      ? {
          labels: analyticsData.monthly_comparison.labels || [],
          datasets: [
            {
              data: analyticsData.monthly_comparison.data || [],
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            },
          ],
        }
      : { labels: [], datasets: [{ data: [] }] };

  const categoryBreakdown =
    analyticsData && analyticsData.category_breakdown
      ? analyticsData.category_breakdown.map((category, index) => {
          // Generate shades of white/gray for pure black and white theme
          const grayShades = [
            '#FFFFFF', // White
            '#F5F5F5', // Very light gray
            '#E5E5E5', // Light gray
            '#D4D4D4', // Medium light gray
            '#A3A3A3', // Medium gray
            '#737373', // Medium dark gray
            '#525252', // Dark gray
            '#404040', // Very dark gray
          ];
          return {
            name: category.category_name,
            amount: category.amount,
            color: grayShades[index % 8],
            legendFontColor: '#FFFFFF',
          };
        })
      : [];

  const totalSpent = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);

  const stats =
    analyticsData && analyticsData.summary
      ? [
          {
            label: periodLabels.summary,
            value: `$${analyticsData.summary.this_month.total.toFixed(2)}`,
            change: analyticsData.summary.this_month.change,
            icon: 'trending-up',
          },
          {
            label: periodLabels.avgLabel,
            value: `$${analyticsData.summary.avg_daily.amount.toFixed(2)}`,
            change: analyticsData.summary.avg_daily.change,
            icon: 'calendar',
          },
          {
            label: 'Categories',
            value: analyticsData.summary.total_categories.toString(),
            change: '0%',
            icon: 'list',
          },
          {
            label: 'Transactions',
            value: analyticsData.summary.total_transactions.toString(),
            change: '+8%',
            icon: 'receipt',
          },
        ]
      : [];

  // Loading state
  if (isLoading && !analyticsData) {
    return <LoadingScreen message="Loading your analytics..." />;
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" backgroundColor="#000000" />

      {/* Header */}
      <View className="border-b border-border px-6 pb-4 pt-14">
        <Text className="text-2xl font-bold text-foreground">Analytics</Text>
        <Text className="mt-1 text-sm text-muted-foreground">Spending insights and trends</Text>
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
          <View className="flex-row rounded-lg border border-border bg-secondary p-1">
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

        {/* Period Change Loader */}
        {isLoadingPeriod && (
          <View className="mx-6 mt-4">
            <InlineLoader message={`Loading ${selectedPeriod} data...`} />
          </View>
        )}

        {/* Stats Cards */}
        <View className="mx-6 mt-6 flex-row flex-wrap gap-3">
          {stats.map((stat, index) => (
            <View key={index} className="w-[48%] rounded-lg border border-border bg-secondary p-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Ionicons name={stat.icon as any} size={20} color="#a3a3a3" />
                <Text
                  className={`text-xs font-medium ${
                    stat.change.startsWith('+') ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                  {stat.change}
                </Text>
              </View>
              <Text className="text-xl font-bold text-foreground">{stat.value}</Text>
              <Text className="text-sm text-muted-foreground">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Spending Trend Chart */}
        <View className="mx-6 mt-6">
          <Text className="mb-4 text-lg font-semibold text-foreground">{periodLabels.trend}</Text>
          <View className="overflow-hidden rounded-lg border border-border bg-secondary">
            {spendingTrendData.datasets[0].data.length > 0 ? (
              <LineChart
                data={spendingTrendData}
                width={screenWidth - 48}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={{ marginVertical: 8 }}
                withDots={true}
                withShadow={false}
                withInnerLines={true}
                withOuterLines={true}
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
          <Text className="mb-4 text-lg font-semibold text-foreground">Category Breakdown</Text>
          <View className="rounded-lg border border-border bg-secondary p-4">
            {categoryBreakdown.length > 0 && totalSpent > 0 ? (
              <PieChart
                data={categoryBreakdown}
                width={screenWidth - 80}
                height={200}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
                hasLegend={true}
                absolute={true}
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
                    <Text className="font-semibold text-foreground">${category.amount}</Text>
                    <Text className="text-sm text-muted-foreground">
                      {((category.amount / totalSpent) * 100).toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Period Comparison */}
        <View className="mx-6 mb-8 mt-6">
          <Text className="mb-4 text-lg font-semibold text-foreground">
            {periodLabels.comparison}
          </Text>
          <View className="overflow-hidden rounded-lg border border-border bg-secondary">
            {comparisonData.datasets[0].data.length > 0 ? (
              <BarChart
                data={comparisonData}
                width={screenWidth - 48}
                height={200}
                chartConfig={chartConfig}
                style={{ marginVertical: 8 }}
                yAxisLabel="$"
                yAxisSuffix=""
                withInnerLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
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
