import React, { useState } from 'react';
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
import { DateFrequencyData, EventPointData, calculateTimeOfDayFrequency } from '../ActivityWatchUtils';
import { ContourPlot }   from '../components/ui/contour-plot';
import { CustomControls } from '../components/ui/controls';
type ContourMapComponentProps = Omit<ChartComponentProps<EventPointData>, "renderChart">;

const CustomHeader: React.FC<{ title: string; settings: any }> = ({ title, settings }) => (
    <h2 style={{ color: 'blue', fontSize: '24px' }}>{title}</h2>
  );
  
  const CustomFooter: React.FC<{ percentageChange: number; currentTotalDuration: number; prevTotalDuration: number; settings: any }> = 
    ({ percentageChange, currentTotalDuration, prevTotalDuration }) => (
    <div>
      <p>Custom footer with simplified info:</p>
      <p>Change: {percentageChange.toFixed(2)}%</p>
      <p>Current: {(currentTotalDuration / 3600).toFixed(2)}h</p>
      <p>Previous: {(prevTotalDuration / 3600).toFixed(2)}h</p>
    </div>
  );

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

    function getTopItemsByAverageDuration(data: DateFrequencyData[], n: number): DateFrequencyData[] {
        return data
          .sort((a, b) => b.duration - a.duration) // Sort in descending order
          .slice(0, n); // Take the first N items
      }

      const filterShortDurations = (data: DateFrequencyData[], minDuration: number): DateFrequencyData[] => {
        return data.filter(d => d.duration >= minDuration);
      };

      const limitCategories = (data: DateFrequencyData[], maxCategories: number): DateFrequencyData[] => {
        const activityTotals = data.reduce((acc, curr) => {
          acc[curr.activity] = (acc[curr.activity] || 0) + curr.duration;
          return acc;
        }, {} as {[key: string]: number});
      
        const topActivities = Object.entries(activityTotals)
          .sort(([, a], [, b]) => b - a)
          .slice(0, maxCategories)
          .map(([activity]) => activity);
      
        return data.filter(d => topActivities.includes(d.activity));
      };

    const renderChart = (dateFrequencyData: EventPointData, prevChartData: EventPointData, settings: ActivityWatchPluginSettings, categoryCount: number) => {
        const transformedData = calculateTimeOfDayFrequency(dateFrequencyData);
        const shortenedData = filterShortDurations(transformedData, 0.25);
        const filteredData = limitCategories(shortenedData, 3);
        //console.log("DATA " + transformedData);
        //const tempBest = getTopItemsByAverageDuration(transformedData, 2);


        return (
    <ContourPlot 
    data={filteredData} 
    maxCategories={5} 
    settings={{
        chartMarginTop: 20,
        chartHeight: 400,
        chartWidth: 600,
        textColor: '#ffffff',
        labelFontSize: 12,
        legendFontSize: 10
    }}
/>
        );
    };

    return <ChartComponent<EventPointData>
      {...props}
      renderChart={renderChart}
      useDateRange={false}
      customControls={CustomControls}
    />;
};