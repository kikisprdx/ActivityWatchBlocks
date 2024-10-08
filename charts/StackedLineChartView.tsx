import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import { StackedLineChartComponent } from "./StackedLineChartComponent";
import { ActivityWatchPluginSettings } from "../ActivityWatchPluginSettings";
import { ChartState, fetchStocahsticTimeframeData, StochasticData } from "../ActivityWatchUtils";

export const VIEW_TYPE_STACKEDLINECHART = "activitywatch-stackedlinechart-view";

export class ActivityWatchStackedLineChartView extends ItemView {
    private root: Root | null = null;
    private settings: ActivityWatchPluginSettings;
    private chartState: Partial<ChartState> = {};
    private plugin: any;

    constructor(leaf: WorkspaceLeaf, settings: ActivityWatchPluginSettings, plugin: any) {
        super(leaf);
        this.settings = settings;
        this.plugin = plugin;
    }
    getViewType(): string {
        return VIEW_TYPE_STACKEDLINECHART;
    }

    getDisplayText(): string {
        return "ActivityWatch Stacked Line Chart";
    }

    async onOpen() {
        console.log("Opening ActivityWatch Stacked Line Chart View");
        const container = this.containerEl.children[1];
        container.empty();
        this.root = createRoot(container as HTMLElement);
        await this.loadChartState();
        await this.renderChart();
    }

    async loadChartState() {
        const savedState = await this.plugin.loadData("stackedlinechart-view-state");
        if (savedState) {
            this.chartState = savedState;
            console.log("Loaded chart state:", this.chartState);
        }
    }

    async saveChartState() {
        await this.plugin.saveData("stackedlinechart-view-state", this.chartState);
        console.log("Saved chart state:", this.chartState);
    }

    private handleTimeframeChange = async (hours: number, bucket: string, from?: Date, to?: Date): Promise<{ data: StochasticData; prev_data: StochasticData }> => {
        // We're using a fixed timeframeDays value here. You might want to make this configurable.
        return fetchStocahsticTimeframeData(bucket, hours, 14, from, to);
    }

    async renderChart() {
        console.log("Starting renderChart method");
        try {
            console.log("Fetching initial data...");
            const { from, to } = this.chartState.dateRange || {};
            const data = await fetchStocahsticTimeframeData("aw-watcher-window_Kikis", 24, 14, from, to);
            console.log("Fetched initial data:", data);
            
            this.root?.render(
                React.createElement(
                    React.StrictMode,
                    null,
                    React.createElement(StackedLineChartComponent, {
                        data: data.data,
                        prev_data: data.prev_data,
                        onTimeframeChange: this.handleTimeframeChange.bind(this),
                        settings: this.settings,
                        initialState: this.chartState,
                        onStateChange: this.handleStateChange.bind(this),
                        useDateRange: true
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