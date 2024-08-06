import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import { BarChartComponent } from "./BarChartComponent";
import { ActivityWatchPluginSettings } from "../ActivityWatchPluginSettings";
import { fetchCategoryData, fetchTimeframeData} from "ActivityWatchUtils";

export const VIEW_TYPE_BARCHART = "activitywatch-barchart-view";

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
            const currentData = await fetchCategoryData("aw-watcher-window_Kikis", 24);
            const previousData = await fetchCategoryData("aw-watcher-window_Kikis", 48);
            console.log("Fetched initial data:", currentData, previousData);
            
            this.root?.render(
                React.createElement(
                    React.StrictMode,
                    null,
                    React.createElement(BarChartComponent, {
                        data: currentData,
                        prev_data: previousData,
                        onTimeframeChange: fetchTimeframeData.bind(this),
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



   
}