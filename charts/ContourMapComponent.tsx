import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    TooltipProps
} from "recharts";
import { ChartComponent, ChartComponentProps, ChartDataItem } from './ChartComponent';
import { ActivityWatchPluginSettings } from "../ActivityWatchPluginSettings";
import { CategoryData } from '../ActivityWatchUtils';

type ContourMapComponentProps = Omit<ChartComponentProps<CategoryData>, "renderChart">;

export const ContourMapComponent: React.FC<ContourMapComponentProps> = (props) => {
    const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as ChartDataItem;
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
                    <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}>{`${label}`}</p>
                    <p style={{ margin: '0', color: props.settings.currentBarColor }}>{`Current: ${data.current.toFixed(2)} hours (${data.currentPercentage.toFixed(2)}%)`}</p>
                    <p style={{ margin: '0', color: props.settings.previousBarColor }}>{`Previous: ${data.previous.toFixed(2)} hours (${data.previousPercentage.toFixed(2)}%)`}</p>
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

    const renderChart = (chartData: CategoryData, prevChartData: CategoryData, settings: ActivityWatchPluginSettings, categoryCount: number) => {
        // Transform CategoryData into ChartDataItem[]
        const transformedData: ChartDataItem[] = chartData.categories.slice(0, categoryCount).map(category => {
            const prevCategory = prevChartData.categories.find(c => c.name === category.name);
            return {
                name: category.name,
                current: category.duration / 3600, // Convert seconds to hours
                currentPercentage: category.percentage,
                previous: prevCategory ? prevCategory.duration / 3600 : 0,
                previousPercentage: prevCategory ? prevCategory.percentage : 0
            };
        });

        return (
            <div className="card-content" style={{ marginTop: `${settings.chartMarginTop}px`, height: `${settings.chartHeight}px` }}>
                            <ResponsiveContainer width={settings.chartWidth} height="100%">
                <BarChart 
                    data={transformedData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                    layout="vertical"
                    barGap={settings.barGap}
                >
                        <CartesianGrid strokeDasharray="3 3" stroke={settings.gridColor} />
                        <XAxis type="number" tick={{ fill: settings.textColor, fontSize: settings.labelFontSize }} />
                        <YAxis 
                            dataKey="name" 
                            type="category"
                            tick={{ fill: settings.textColor, fontSize: settings.labelFontSize }}
                            width={150}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            {...getLegendProps(settings.legendPosition)}
                            wrapperStyle={{ 
                                padding: '10px',
                                fontSize: `${settings.legendFontSize}px`,
                            }}
                        />
                        <Bar dataKey="current" fill={settings.currentBarColor} name="Current Period" />
                        <Bar dataKey="previous" fill={settings.previousBarColor} name="Previous Period" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return <ChartComponent<CategoryData> {...props} renderChart={renderChart} useDateRange={false}/>;
};