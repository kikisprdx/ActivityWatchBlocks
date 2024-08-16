import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityWatchPluginSettings } from "../ActivityWatchPluginSettings";
import { fetchBuckets, ChartState, StochasticData, CategoryData } from '../ActivityWatchUtils';
import { DatePickerWithRange } from "../components/ui/date-range-picker"
import { DateRange } from "react-day-picker"

export interface ChartComponentProps<T> {
    data: T;
    prev_data: T;
    onTimeframeChange: (hours: number, bucket: string, from: Date, to: Date) => Promise<{ data: T; prev_data: T }>;
    settings: ActivityWatchPluginSettings;
    renderChart: (chartData: T, prevChartData: T, settings: ActivityWatchPluginSettings, categoryCount: number) => React.ReactNode;
    initialState?: Partial<ChartState>;
    onStateChange: (newState: Partial<ChartState>) => void;
    useDateRange?: boolean;
}

export interface ChartDataItem {
    name: string;
    current: number;
    currentPercentage: number;
    previous: number;
    previousPercentage: number;
}

export function ChartComponent<T extends StochasticData | CategoryData>({
    data: initialData,
    prev_data: initialPrevData,
    onTimeframeChange,
    settings,
    renderChart,
    initialState,
    onStateChange,
    useDateRange = false
}: ChartComponentProps<T>) {
    const [data, setData] = useState<T>(initialData);
    const [prevData, setPrevData] = useState<T>(initialPrevData);
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>(initialState?.selectedTimeframe || "24");
    const [buckets, setBuckets] = useState<string[]>([]);
    const [selectedBucket, setSelectedBucket] = useState<string>(initialState?.selectedBucket || "");
    const [categoryCount, setCategoryCount] = useState<number>(initialState?.categoryCount || 10);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: initialState?.dateRange?.from || new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        to: initialState?.dateRange?.to || new Date()
    });

    useEffect(() => {
        const loadBuckets = async () => {
            try {
                const bucketData = await fetchBuckets();
                setBuckets(bucketData);
                if (bucketData.length > 0 && !selectedBucket) {
                    setSelectedBucket(bucketData[0]);
                }
            } catch (error) {
                console.error('Error loading buckets:', error);
            }
        };

        loadBuckets();
    }, []);

    useEffect(() => {
        if (initialState?.dateRange) {
            setDateRange(initialState.dateRange);
        }
    }, [initialState?.dateRange]);

    const handleTimeframeChange = async (value: string) => {
        setSelectedTimeframe(value);
        const hours = parseInt(value);
        if (dateRange?.from && dateRange?.to) {
            const { data: newData, prev_data: newPrevData } = await onTimeframeChange(hours, selectedBucket, dateRange.from, dateRange.to);
            setData(newData);
            setPrevData(newPrevData);
        }
    };

    const handleBucketChange = async (value: string) => {
        setSelectedBucket(value);
        const hours = parseInt(selectedTimeframe);
        if (dateRange?.from && dateRange?.to) {
            const { data: newData, prev_data: newPrevData } = await onTimeframeChange(hours, value, dateRange.from, dateRange.to);
            setData(newData);
            setPrevData(newPrevData);
        }
    };

    const handleCategoryCountChange = (increment: number) => {
        setCategoryCount(prevCount => {
            const newCount = Math.max(1, prevCount + increment);
            onStateChange({ categoryCount: newCount });
            return newCount;
        });
    };

    const handleDateRangeChange = async (newRange: DateRange | undefined) => {
        console.log('handleDateRangeChange called with:', newRange);
        setDateRange(newRange);
        if (newRange?.from && newRange?.to) {
            const hours = parseInt(selectedTimeframe);
            try {
                const { data: newData, prev_data: newPrevData } = await onTimeframeChange(hours, selectedBucket, newRange.from, newRange.to);
                setData(newData);
                setPrevData(newPrevData);
                onStateChange({ 
                    dateRange: { from: newRange.from, to: newRange.to },
                    selectedTimeframe,
                    selectedBucket,
                    categoryCount
                });
            } catch (error) {
                console.error('Error updating chart with new date range:', error);
            }
        }
    };

    useEffect(() => {
        onStateChange({ 
            selectedTimeframe, 
            selectedBucket,
            categoryCount,
            dateRange: dateRange ? { from: dateRange.from, to: dateRange.to } : undefined
        });
    }, [selectedTimeframe, selectedBucket, categoryCount, dateRange]);

    const calculateTotalDuration = (chartData: T): number => {
        if ('total_duration' in chartData) {
            return (chartData as CategoryData).total_duration;
        } else if ('period_data' in chartData) {
            return (chartData as StochasticData).period_data.reduce((total, dataPoint) => 
                total + Object.values(dataPoint.categories).reduce((sum, value) => sum + value, 0), 0
            );
        }
        return 0;
    };

    const currentTotalDuration = calculateTotalDuration(data);
    const prevTotalDuration = calculateTotalDuration(prevData);

    const percentageChange = 
        prevTotalDuration > 0
            ? ((currentTotalDuration - prevTotalDuration) / prevTotalDuration) * 100
            : (currentTotalDuration > 0 ? 100 : 0);

    return (
        <div className="card" style={{ 
            backgroundColor: settings.backgroundColor, 
            color: settings.textColor, 
            padding: `${settings.cardPadding}px`, 
            borderRadius: '8px' 
        }}>
            <div className="card-header" style={{ marginBottom: `${settings.controlsMarginBottom}px` }}>
                <h2 className="card-title" style={{ 
                    fontSize: `${settings.titleFontSize}px`, 
                    fontWeight: 'bold', 
                    marginBottom: `${settings.titleMarginBottom}px`, 
                    textAlign: 'left' 
                }}>ActivityWatch Chart</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <Select onValueChange={handleTimeframeChange} value={selectedTimeframe}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="6">6 hours</SelectItem>
                            <SelectItem value="12">12 hours</SelectItem>
                            <SelectItem value="24">24 hours</SelectItem>
                            <SelectItem value="48">48 hours</SelectItem>
                            <SelectItem value="72">72 hours</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select onValueChange={handleBucketChange} value={selectedBucket}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select bucket" />
                        </SelectTrigger>
                        <SelectContent>
                            {buckets.map((bucket) => (
                                <SelectItem key={bucket} value={bucket}>{bucket}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#3f4144', borderRadius: '4px', padding: '2px' }}>
                        <button onClick={() => handleCategoryCountChange(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                            <ChevronDown color={settings.textColor} size={20} />
                        </button>
                        <span style={{ margin: '0 8px', color: settings.textColor }}>{categoryCount}</span>
                        <button onClick={() => handleCategoryCountChange(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                            <ChevronUp color={settings.textColor} size={20} />
                        </button>
                    </div>
                    {useDateRange && (
                        <DatePickerWithRange
                            dateRange={dateRange}
                            onDateRangeChange={handleDateRangeChange}
                        />
                    )}
                </div>
            </div>
            {renderChart(data, prevData, settings, categoryCount)}
            <div className="card-footer" style={{ marginTop: `${settings.footerMarginTop}px`, fontSize: `${settings.labelFontSize}px` }}>
                <div className="flex gap-2 font-medium leading-none">
                    {percentageChange !== 0 ? (
                        <>
                            {percentageChange > 0 ? 'Trending up' : 'Trending down'} by {Math.abs(percentageChange).toFixed(1)}% this period
                            {percentageChange > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </>
                    ) : (
                        'No change in trend'
                    )}
                </div>
                <div className="leading-none text-muted-foreground" style={{ marginTop: '10px' }}>
                    Current period: {(currentTotalDuration / 3600).toFixed(2)} hours, Previous period: {(prevTotalDuration / 3600).toFixed(2)} hours
                </div>
            </div>
        </div>
    );
}