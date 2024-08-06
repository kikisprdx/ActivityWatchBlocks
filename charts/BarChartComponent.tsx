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

type BarChartComponentProps = Omit<ChartComponentProps, 'renderChart'>;

export const BarChartComponent: React.FC<BarChartComponentProps> = (props) => {
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
                    <p style={{ margin: '0 0 5px', fontWeight: 'bold' }}>{`${label}`}</p>
                    <p style={{ margin: '0', color: props.settings.currentBarColor }}>{`Current: ${payload[0].value?.toFixed(2)} hours (${(payload[0].payload as ChartDataItem).currentPercentage.toFixed(2)}%)`}</p>
                    <p style={{ margin: '0', color: props.settings.previousBarColor }}>{`Previous: ${payload[1].value?.toFixed(2)} hours (${(payload[1].payload as ChartDataItem).previousPercentage.toFixed(2)}%)`}</p>
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

    const renderChart = (chartData: ChartDataItem[], settings: ActivityWatchPluginSettings) => (
        <div className="card-content" style={{ marginTop: `${settings.chartMarginTop}px`, height: `${settings.chartHeight}px` }}>
            <ResponsiveContainer width={settings.chartWidth} height="100%">
                <BarChart 
                    data={chartData}
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

    return <ChartComponent {...props} renderChart={renderChart} />;
};