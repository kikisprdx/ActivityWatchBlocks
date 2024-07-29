import { MarkdownRenderChild } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import { ActivityWatchBarChart } from "./ActivityWatchBarChart";
import { ActivityWatchPluginSettings } from "./ActivityWatchPluginSettings";

interface CategoryData {
    categories: {
        name: string;
        duration: number;
        percentage: number;
    }[];
    total_duration: number;
}

export class ActivityWatchBarChartBlock extends MarkdownRenderChild {
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
        console.log("ActivityWatchBarChartBlock onload called");
        const params = this.source
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line);
        const hours = parseInt(params[0]) || 24;
        const prev_hours = parseInt(params[1]) || 24;
        await this.render(hours, prev_hours);
    }

    async render(hours: number, prev_hours: number) {
        console.log(`Rendering chart for ${hours} hours`);
        try {
            const data = await this.fetchCategoryData(
                "aw-watcher-window",
                hours,
            );
            const prev_data = await this.fetchCategoryData(
                "aw-watcher-window",
                prev_hours,
            );

            console.log("Fetched data:", data);
            console.log("Fetched previous data:", prev_data);
            this.mountReactComponent(data, prev_data);
        } catch (error) {
            console.error("Error in ActivityWatch plugin:", error);
            if (error instanceof Error) {
                this.containerEl.setText(
                    `Error: ${error.message}. Check the console for more details.`
                );
            } else {
                this.containerEl.setText(
                    "An unknown error occurred. Check the console for more details."
                );
            }
        }
    }

    mountReactComponent(data: CategoryData, prev_data: CategoryData) {
        console.log("Mounting React component");
        this.root = createRoot(this.containerEl);
        this.root.render(
            React.createElement(ActivityWatchBarChart, { 
                data: data, 
                prev_data: prev_data,
                onTimeframeChange: this.handleTimeframeChange.bind(this),
                settings: this.settings
            }),
        );
    }

    async handleTimeframeChange(hours: number, bucket: string) {
        console.log(`Handling timeframe change: ${hours} hours, bucket: ${bucket}`);
        const data = await this.fetchCategoryData(bucket, hours);
        const prev_data = await this.fetchCategoryData(bucket, hours * 2);
        return { data, prev_data };
    }

    async onunload() {
        console.log("Unmounting React component");
        if (this.root) {
            this.root.unmount();
        }
    }

    async fetchCategoryData(bucket: string, hours: number): Promise<CategoryData> {
        console.log(`Fetching data for bucket: ${bucket}, hours: ${hours}`);
        const response = await fetch(
            `http://localhost:5000/category_data/${bucket}/${hours}`,
            {
                method: "GET",
                mode: "cors",
                headers: {
                    Accept: "application/json",
                },
            },
        );
        if (!response.ok) {
            throw new Error("Failed to fetch category data");
        }
        return await response.json();
    }
}