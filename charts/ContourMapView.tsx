import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import { BarChartComponent } from "./BarChartComponent";
import { ActivityWatchPluginSettings } from "../ActivityWatchPluginSettings";
import { fetchCategoryData, fetchTimeframeData, ChartState } from "../ActivityWatchUtils";

export const VIEW_TYPE_BARCHART = "activitywatch-barchart-view";

export class ActivityWatchBarChartView extends ItemView {
    private root: Root | null = null;
    private settings: ActivityWatchPluginSettings;
    private chartState: Partial<ChartState> = {};
    private plugin: any; // Replace 'any' with your actual plugin type

    constructor(leaf: WorkspaceLeaf, settings: ActivityWatchPluginSettings, plugin: any) {
        super(leaf);
        this.settings = settings;
        this.plugin = plugin;
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
        await this.loadChartState();
        await this.renderChart();
    }

    async loadChartState() {
        const savedState = await this.plugin.loadData("barchart-view-state");
        if (savedState) {
            this.chartState = savedState;
            console.log("Loaded chart state:", this.chartState);
        }
    }

    async saveChartState() {
        await this.plugin.saveData("barchart-view-state", this.chartState);
        console.log("Saved chart state:", this.chartState);
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
                        settings: this.settings,
                        initialState: this.chartState,
                        onStateChange: this.handleStateChange.bind(this)
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

    private async handleStateChange(newState: Partial<ChartState>) {
        this.chartState = { ...this.chartState, ...newState };
        await this.saveChartState();
        console.log("Chart state updated and saved:", this.chartState);
    }

    async onClose() {
        // Ensure the latest state is saved when the view is closed
        await this.saveChartState();
    }
}