import React, { useState, useMemo } from 'react';
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
import { ChartComponent, ChartComponentProps } from './ChartComponent';
import { ActivityWatchPluginSettings } from "../ActivityWatchPluginSettings";
import { StochasticData, StochasticDataPoint } from '../ActivityWatchUtils';
import { DateRangePicker } from 'components/ui/date-range-picker';

type StackedLineChartComponentProps = Omit<ChartComponentProps<StochasticData>, 'renderChart'>;

export const StackedLineChartComponent: React.FC<StackedLineChartComponentProps> = (props) => {
    const [showPreviousPeriod, setShowPreviousPeriod] = useState(false);
    const [dateRange, setDateRange] = useState({ from: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), to: new Date() });

    const handleDateRangeChange = (newRange: { from: Date, to: Date }) => {
        setDateRange(newRange);
        props.onStateChange({ dateRange: newRange });
        // Fetch new data with the updated date range
        props.onTimeframeChange(props.data.period_hours, props.data.bucket_id, newRange.from, newRange.to);
    };

    const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip" style={{
                    backgroundColor: props.settings.tooltipBackgroundColor,
                    backdropFilter: 'blur(5px)',
                    padding: '10px',
                    border: `1px solid ${props.settings.tooltipBorderColor}`,
                    borderRadius: '4px',
                    color: props.settings.tooltipTextColor,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    fontSize: `${props.settings.labelFontSize}px`,
                    lineHeight: '1.5'
                }}>
                    <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}>{`${new Date(label).toLocaleString()}`}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ color: entry.color, margin: '0' }}>
                            {`${entry.name}: ${(entry.value as number).toFixed(2)} hours`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const getLegendProps = (position: 'top' | 'bottom' | 'left' | 'right') => {
        switch (position) {
            case 'top':
                return { verticalAlign: 'top' as const, align: 'center' as const };
            case 'bottom':
                return { verticalAlign: 'bottom' as const, align: 'center' as const };
            case 'left':
                return { verticalAlign: 'middle' as const, align: 'left' as const };
            case 'right':
                return { verticalAlign: 'middle' as const, align: 'right' as const };
            default:
                return { verticalAlign: 'bottom' as const, align: 'center' as const };
        }
    };

    const determineTopCategories = (data: StochasticData, categoryCount: number): string[] => {
        // Aggregate all categories across all data points
        const aggregatedCategories: { [key: string]: number } = {};
        data.period_data.forEach(dataPoint => {
            Object.entries(dataPoint.categories).forEach(([category, value]) => {
                aggregatedCategories[category] = (aggregatedCategories[category] || 0) + value;
            });
        });

        // Sort categories by total duration and select top categories
        const sortedCategories = Object.entries(aggregatedCategories)
            .sort(([, a], [, b]) => b - a)
            .map(([category]) => category);

        return sortedCategories.slice(0, categoryCount);
    };

    const binCategories = (dataPoint: StochasticDataPoint, topCategories: string[]): StochasticDataPoint => {
        const binnedCategories: { [key: string]: number } = {};
        let otherTotal = 0;

        Object.entries(dataPoint.categories).forEach(([category, value]) => {
            if (topCategories.includes(category)) {
                binnedCategories[category] = value;
            } else {
                otherTotal += value;
            }
        });

        if (otherTotal > 0) {
            binnedCategories['Other'] = otherTotal;
        }

        return {
            ...dataPoint,
            categories: binnedCategories
        };
    };

    const renderChart = (data: StochasticData, prevData: StochasticData, settings: ActivityWatchPluginSettings, categoryCount: number) => {
        if (!data || !data.period_data || !Array.isArray(data.period_data)) {
            return <div>No data available</div>;
        }

        const topCategories = useMemo(() => determineTopCategories(data, categoryCount), [data, categoryCount]);
        const binnedData = data.period_data.map(dataPoint => binCategories(dataPoint, topCategories));
        
        const categories = [...topCategories];
        if (binnedData.some(dataPoint => 'Other' in dataPoint.categories)) {
            categories.push('Other');
        }

        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1'];

        return (
            <div className="card-content" style={{ marginTop: `${settings.chartMarginTop}px`, height: `${settings.chartHeight}px` }}>
                <ResponsiveContainer width={settings.chartWidth} height="100%">
                    <AreaChart 
                        data={binnedData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={settings.gridColor} />
                        <XAxis 
                            dataKey="end" 
                            tick={{ fill: settings.textColor, fontSize: settings.labelFontSize }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis 
                            tick={{ fill: settings.textColor, fontSize: settings.labelFontSize }}
                            label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: settings.textColor }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            {...getLegendProps(settings.legendPosition)}
                            wrapperStyle={{ 
                                padding: '10px',
                                fontSize: `${settings.legendFontSize}px`,
                            }}
                        />
                        {categories.map((category, index) => (
                            <Area 
                                key={category}
                                type="monotone"
                                dataKey={(item: StochasticDataPoint) => (item.categories[category] || 0) / 3600} // Convert seconds to hours
                                stackId="1"
                                stroke={colors[index % colors.length]}
                                fill={colors[index % colors.length]}
                                name={category}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return <ChartComponent<StochasticData> 
    {...props} 
    renderChart={renderChart}
    useDateRange={true}  // Enable date range picker
/>;
};