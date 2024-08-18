import React, { useRef, useEffect, useMemo } from 'react';
import { ResponsiveContainer } from 'recharts';
import * as d3 from 'd3';

import { DateFrequencyData } from '../ActivityWatchUtils';

interface ContourPlotProps {
    data: DateFrequencyData[];
    maxCategories?: number;
    settings: {
      chartMarginTop: number;
      chartHeight: number;
      chartWidth: number;
      textColor: string;
      labelFontSize: number;
      legendFontSize: number;
    };
  }

export const ContourPlot: React.FC<ContourPlotProps> = ({ data, maxCategories = 10, settings }) => {
    const svgRef = useRef<SVGSVGElement>(null);
  
    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;
    
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render
    
        const width = settings.chartWidth;
        const height = settings.chartHeight;
        const margin = { top: 20, right: 120, bottom: 30, left: 40 };
    
        const processedData = data.map(d => ({
          ...d,
          x: (new Date(`1970-01-01T${d.start_time}`).getHours() + 
              new Date(`1970-01-01T${d.start_time}`).getMinutes() / 60),
          y: d.duration
        }));
    
        const x = d3.scaleLinear()
          .domain([0, 24])
          .range([margin.left, width - margin.right]);
    
        const y = d3.scaleLinear()
          .domain([0, d3.max(processedData, d => d.y) || 0]).nice()
          .range([height - margin.bottom, margin.top]);
    
        const activities = Array.from(new Set(data.map(d => d.activity)));
        const colorScale = d3.scaleOrdinal<string>()
          .domain(activities)
          .range(d3.schemeCategory10);
    
        svg.attr("viewBox", [0, 0, width, height]);
    
        svg.append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x).tickFormat(d => `${d}:00`))
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll("text")
            .attr("fill", settings.textColor)
            .style("font-size", `${settings.labelFontSize}px`));
    
        svg.append("g")
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y))
          .call(g => g.select(".domain").remove())
          .call(g => g.selectAll("text")
            .attr("fill", settings.textColor)
            .style("font-size", `${settings.labelFontSize}px`));
    
        activities.forEach(activity => {
          const activityData = processedData.filter(d => d.activity === activity);
          const contours = d3.contourDensity()
            .x(d => x(d.x))
            .y(d => y(d.y))
            .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
            .bandwidth(30)
            .thresholds(15)
            (activityData);
    
          svg.append("g")
            .attr("fill", "none")
            .attr("stroke", colorScale(activity))
            .attr("stroke-linejoin", "round")
            .attr("transform", `translate(${margin.left},${margin.top})`)
            .selectAll("path")
            .data(contours)
            .join("path")
            .attr("stroke-width", (d, i) => i % 5 ? 0.25 : 1)
            .attr("d", d3.geoPath());
        });
    
        svg.append("g")
          .selectAll("circle")
          .data(processedData)
          .join("circle")
          .attr("cx", d => x(d.x))
          .attr("cy", d => y(d.y))
          .attr("r", 2)
          .attr("fill", d => colorScale(d.activity))
          .attr("opacity", 0.6);
    
        const legend = svg.append("g")
          .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);
    
        activities.forEach((activity, i) => {
          const legendItem = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);
    
          legendItem.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", colorScale(activity));
    
          legendItem.append("text")
            .attr("x", 15)
            .attr("y", 10)
            .text(activity)
            .attr("fill", settings.textColor)
            .style("font-size", `${settings.legendFontSize}px`);
        });
    
      }, [data, settings]);
    
      return (
        <div className="card-content" style={{ marginTop: `${settings.chartMarginTop}px`, height: `${settings.chartHeight}px` }}>
          <ResponsiveContainer width={settings.chartWidth} height="100%">
            <svg ref={svgRef} width="100%" height="100%" />
          </ResponsiveContainer>
        </div>
      );
    };
    
    export default ContourPlot;