import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityWatchPluginSettings } from "../ActivityWatchPluginSettings";
import { fetchBuckets } from 'ActivityWatchUtils';

export interface CategoryData {
    categories: {
        name: string;
        duration: number;
        percentage: number;
    }[];
    total_duration: number;
}

export interface ChartDataItem {
    name: string;
    current: number;
    currentPercentage: number;
    previous: number;
    previousPercentage: number;
}

export interface ChartComponentProps {
    data: CategoryData;
    prev_data: CategoryData;
    onTimeframeChange: (hours: number, bucket: string) => Promise<{ data: CategoryData; prev_data: CategoryData }>;
    settings: ActivityWatchPluginSettings;
    renderChart: (chartData: ChartDataItem[], settings: ActivityWatchPluginSettings) => React.ReactNode;
}

export const ChartComponent: React.FC<ChartComponentProps> = ({
    data: initialData,
    prev_data: initialPrevData,
    onTimeframeChange,
    settings,
    renderChart
}) => {
    const [data, setData] = useState<CategoryData>(initialData);
    const [prevData, setPrevData] = useState<CategoryData>(initialPrevData);
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>("24");
    const [categoryCount, setCategoryCount] = useState<number>(settings.categoryCount);
    const [buckets, setBuckets] = useState<string[]>([]);
    const [selectedBucket, setSelectedBucket] = useState<string>("");

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

    const handleTimeframeChange = async (value: string) => {
        setSelectedTimeframe(value);
        const hours = parseInt(value);
        const { data: newData, prev_data: newPrevData } = await onTimeframeChange(hours, selectedBucket);
        setData(newData);
        setPrevData(newPrevData);
    };

    const handleBucketChange = async (value: string) => {
        setSelectedBucket(value);
        const hours = parseInt(selectedTimeframe);
        const { data: newData, prev_data: newPrevData } = await onTimeframeChange(hours, value);
        setData(newData);
        setPrevData(newPrevData);
    };

    const handleCategoryCountChange = (increment: number) => {
        setCategoryCount(prevCount => Math.max(1, prevCount + increment));
    };

    const chartData: ChartDataItem[] = data.categories
        .sort((a, b) => b.duration - a.duration)
        .slice(0, Math.min(categoryCount, data.categories.length))
        .map((category) => {
            const prevCategory = prevData.categories.find(c => c.name === category.name);
            return {
                name: category.name,
                current: Number((category.duration / 3600).toFixed(2)),
                currentPercentage: category.percentage,
                previous: prevCategory ? Number((prevCategory.duration / 3600).toFixed(2)) : 0,
                previousPercentage: prevCategory ? prevCategory.percentage : 0
            };
        });

    const totalHours = (data.total_duration / 3600).toFixed(2);
    const previousTotalHours = (prevData.total_duration / 3600).toFixed(2);
    
    const percentageChange = 
        prevData.total_duration > 0
            ? ((data.total_duration - prevData.total_duration) / prevData.total_duration) * 100
            : (data.total_duration > 0 ? 100 : 0);

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                </div>
            </div>
            {renderChart(chartData, settings)}
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
                    Current period: {totalHours} hours, Previous period: {previousTotalHours} hours
                </div>
            </div>
        </div>
    );
};