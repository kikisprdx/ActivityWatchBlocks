import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    TooltipProps
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityWatchPluginSettings } from "../ActivityWatchPluginSettings";

interface CategoryData {
    categories: {
        name: string;
        duration: number;
        percentage: number;
    }[];
    total_duration: number;
}

interface ActivityWatchStackedLineChartProps {
    data: CategoryData;
    prev_data: CategoryData;
    onTimeframeChange: (hours: number, bucket: string) => Promise<{ data: CategoryData; prev_data: CategoryData }>;
    settings: ActivityWatchPluginSettings;
}

interface ChartDataItem {
    date: string;
    [key: string]: number | string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export const ActivityWatchStackedLineChart: React.FC<ActivityWatchStackedLineChartProps> = ({
    data: initialData,
    prev_data: initialPrevData,
    onTimeframeChange,
    settings
}) => {
    const [data, setData] = useState<CategoryData>(initialData);
    const [prevData, setPrevData] = useState<CategoryData>(initialPrevData);
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>("24");
    const [categoryCount, setCategoryCount] = useState<number>(4);
    const [buckets, setBuckets] = useState<string[]>([]);
    const [selectedBucket, setSelectedBucket] = useState<string>("");

    useEffect(() => {
        fetchBuckets();
    }, []);

    const fetchBuckets = async () => {
        try {
            const response = await fetch('http://localhost:5000/analyzer_buckets');
            if (!response.ok) {
                throw new Error('Failed to fetch buckets');
            }
            const bucketData = await response.json();
            setBuckets(bucketData);
            if (bucketData.length > 0 && !selectedBucket) {
                setSelectedBucket(bucketData[0]);
            }
        } catch (error) {
            console.error('Error fetching buckets:', error);
        }
    };

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
        setCategoryCount(prevCount => Math.max(1, Math.min(prevCount + increment, data.categories.length)));
    };

    const processDataForChart = (rawData: CategoryData): ChartDataItem[] => {
        const topCategories = rawData.categories
            .sort((a, b) => b.duration - a.duration)
            .slice(0, categoryCount);

        const otherDuration = rawData.categories
            .slice(categoryCount)
            .reduce((sum, category) => sum + category.duration, 0);

        const chartData: ChartDataItem = {
            date: new Date(Date.now() - rawData.total_duration * 1000).toISOString(),
        };

        topCategories.forEach(category => {
            chartData[category.name] = category.duration / 3600;
        });

        if (otherDuration > 0) {
            chartData['Other'] = otherDuration / 3600;
        }

        return [chartData];
    };

    const chartData = processDataForChart(data);
    const prevChartData = processDataForChart(prevData);

    const allCategories = [...new Set([...Object.keys(chartData[0]), ...Object.keys(prevChartData[0])])].filter(key => key !== 'date');

    const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip" style={{
                    backgroundColor: settings.tooltipBackgroundColor,
                    backdropFilter: 'blur(5px)',
                    padding: '10px',
                    border: `1px solid ${settings.tooltipBorderColor}`,
                    borderRadius: '4px',
                    color: settings.tooltipTextColor,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    fontSize: `${settings.labelFontSize}px`,
                    lineHeight: '1.5'
                }}>
                    <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}>{`Date: ${new Date(label).toLocaleString()}`}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ margin: '0', color: entry.color }}>
                            {`${entry.name}: ${entry.value?.toFixed(2) ?? 'N/A'} hours`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

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
                }}>ActivityWatch Stacked Line Chart</h2>
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
                            -
                        </button>
                        <span style={{ margin: '0 8px', color: settings.textColor }}>{categoryCount}</span>
                        <button onClick={() => handleCategoryCountChange(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                            +
                        </button>
                    </div>
                </div>
            </div>
            <div className="card-content" style={{ marginTop: `${settings.chartMarginTop}px`, height: `${settings.chartHeight}px` }}>
                <ResponsiveContainer width={settings.chartWidth} height="100%">
                    <AreaChart 
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={settings.gridColor} />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fill: settings.textColor, fontSize: settings.labelFontSize }}
                            tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                        />
                        <YAxis 
                            tick={{ fill: settings.textColor, fontSize: settings.labelFontSize }}
                            label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: settings.textColor }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            verticalAlign={settings.legendPosition as "top" | "bottom"}
                            height={36}
                            wrapperStyle={{ 
                                padding: '10px',
                                fontSize: `${settings.legendFontSize}px`,
                            }}
                        />
                        {allCategories.map((category, index) => (
                            <Area 
                                key={category}
                                type="monotone"
                                dataKey={category}
                                stackId="1"
                                stroke={COLORS[index % COLORS.length]}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
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