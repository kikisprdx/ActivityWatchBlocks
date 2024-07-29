import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import { ActivityWatchBarChart } from "./ActivityWatchBarChart";
import { ActivityWatchPluginSettings } from "./ActivityWatchPluginSettings";

export const VIEW_TYPE_BARCHART = "activitywatch-barchart-view";

interface CategoryData {
    categories: {
        name: string;
        duration: number;
        percentage: number;
    }[];
    total_duration: number;
}

export class ActivityWatchBarChartView extends ItemView {
    private root: Root | null = null;
    private settings: ActivityWatchPluginSettings;

    constructor(leaf: WorkspaceLeaf, settings: ActivityWatchPluginSettings) {
        super(leaf);
        this.settings = settings;
    }

    getViewType(): string {
        return VIEW_TYPE_BARCHART;
    }

    getDisplayText(): string {
        return "ActivityWatch Bar Chart";
    }

    async onOpen() {
        console.log("Opening ActivityWatch Bar Chart View");
        const container = this.containerEl.children[1];
        container.empty();
        this.root = createRoot(container as HTMLElement);
        await this.renderChart();
    }

    async renderChart() {
        console.log("Starting renderChart method");
        try {
            console.log("Fetching initial data...");
            const currentData = await this.fetchCategoryData("aw-watcher-window", 24);
            const previousData = await this.fetchCategoryData("aw-watcher-window", 48);
            console.log("Fetched initial data:", currentData, previousData);
            
            this.root?.render(
                React.createElement(
                    React.StrictMode,
                    null,
                    React.createElement(ActivityWatchBarChart, {
                        data: currentData,
                        prev_data: previousData,
                        onTimeframeChange: this.handleTimeframeChange.bind(this),
                        settings: this.settings
                    }),
                ),
            );
            console.log("React component rendered");
        } catch (error) {
            console.error("Error rendering chart:", error);
            if (error instanceof Error) {
                this.containerEl.setText(`Error: ${error.message}`);
            } else {
                this.containerEl.setText("An unknown error occurred");
            }
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
                    Accept: "application/json",
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