import { MarkdownRenderChild } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import { ActivityWatchStackedLineChart } from "./ActivityWatchStackedLineChart";
import { ActivityWatchPluginSettings } from "./ActivityWatchPluginSettings";

interface CategoryData {
    categories: {
        name: string;
        duration: number;
        percentage: number;
    }[];
    total_duration: number;
}

export class ActivityWatchStackedLineChartViewBlock extends MarkdownRenderChild {
    private root: Root | null = null;
    private settings: ActivityWatchPluginSettings;

    constructor(
        containerEl: HTMLElement,
        private source: string,
        settings: ActivityWatchPluginSettings
    ) {
        super(containerEl);
        this.settings = settings;
    }

    async onload() {
        console.log("Loading ActivityWatchStackedLineChartViewBlock");
        try {
            const data = await this.fetchCategoryData("aw-watcher-window", 24);
            const prev_data = await this.fetchCategoryData("aw-watcher-window", 48);
            this.root = createRoot(this.containerEl);
            this.root.render(
                React.createElement(
                    React.StrictMode,
                    null,
                    React.createElement(ActivityWatchStackedLineChart, { 
                        data: data, 
                        prev_data: prev_data,
                        onTimeframeChange: this.handleTimeframeChange.bind(this),
                        settings: this.settings
                    }),
                ),
            );
        } catch (error) {
            console.error("Error rendering chart:", error);
            if (error instanceof Error) {
                this.containerEl.setText(`Error: ${error.message}`);
            } else {
                this.containerEl.setText("An unknown error occurred");
            }
        }
    }

    async onunload() {
        console.log("Unloading ActivityWatchStackedLineChartViewBlock");
        if (this.root) {
            this.root.unmount();
        }
    }

    async handleTimeframeChange(hours: number, bucket: string) {
        console.log(`Handling timeframe change: ${hours} hours, bucket: ${bucket}`);
        const data = await this.fetchCategoryData(bucket, hours);
        const prev_data = await this.fetchCategoryData(bucket, hours * 2);
        return { data, prev_data };
    }

    async fetchCategoryData(bucket: string, hours: number): Promise<CategoryData> {
        const url = `http://localhost:5000/category_data/${bucket}/${hours}`;
        console.log(`Fetching data from: ${url}`);

        try {
            const response = await fetch(url, {
                method: "GET",
                mode: "cors",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Received data from API:", JSON.stringify(data, null, 2));

            return data as CategoryData;
        } catch (error) {
            console.error("Error fetching category data:", error);
            throw error;
        }
    }
}