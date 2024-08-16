import { MarkdownRenderChild, MarkdownPostProcessorContext, TFile } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import { StackedLineChartComponent } from "./StackedLineChartComponent";
import { ActivityWatchPluginSettings } from "../ActivityWatchPluginSettings";
import { fetchStochasticData, ChartState, fetchStocahsticTimeframeData } from "../ActivityWatchUtils";
import * as path from 'path';

const DEFAULT_CHART_STATE: Partial<ChartState> = {
    selectedTimeframe: "24",
    selectedBucket: "aw-watcher-window_Kikis",
    categoryCount: 2,
    dateRange: { 
        from: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), 
        to: new Date() 
    }
};

export class ActivityWatchStackedLineChartViewBlock extends MarkdownRenderChild {
    private root: Root | null = null;
    private settings: ActivityWatchPluginSettings;
    private blockId: string;
    private plugin: any; // Replace 'any' with your actual plugin type
    private chartState: Partial<ChartState> = DEFAULT_CHART_STATE;

    constructor(
        containerEl: HTMLElement,
        private source: string,
        settings: ActivityWatchPluginSettings,
        private ctx: MarkdownPostProcessorContext,
        plugin: any
    ) {
        super(containerEl);
        this.settings = settings;
        this.plugin = plugin;
        this.blockId = this.generateBlockId();
    }

    private generateBlockId(): string {
        const file = this.plugin.app.vault.getAbstractFileByPath(this.ctx.sourcePath) as TFile;
        const position = this.ctx.getSectionInfo(this.containerEl)?.lineStart || 0;
        return this.hashString(`${file.path}-${position}`);
    }

    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36); // Convert to base 36 (alphanumeric)
    }

    private getStateFilePath(): string {
        const filePath = `states/${this.blockId}.json`;
        console.log(`State file path: ${filePath}`);
        return filePath;
    }

    private async loadChartState() {
        const filePath = this.getStateFilePath();
        try {
            const content = await this.plugin.app.vault.adapter.read(filePath);
            const loadedState = JSON.parse(content);
            this.chartState = { ...DEFAULT_CHART_STATE, ...loadedState };
            if (this.chartState.dateRange) {
                this.chartState.dateRange.from = this.chartState.dateRange.from ? new Date(this.chartState.dateRange.from) : undefined;
                this.chartState.dateRange.to = this.chartState.dateRange.to ? new Date(this.chartState.dateRange.to) : undefined;
            }
        } catch (error) {
            console.log(`No saved state found for block ${this.blockId}, using default state`);
            this.chartState = { ...DEFAULT_CHART_STATE };
        }
        console.log(`Loaded state for block ${this.blockId}:`, this.chartState);
    }

    private async saveChartState() {
        const filePath = this.getStateFilePath();
        const content = JSON.stringify(this.chartState);
        try {
            const statesDir = this.plugin.app.vault.getAbstractFileByPath('states');
            if (!statesDir) {
                await this.plugin.app.vault.createFolder('states');
            }
            await this.plugin.app.vault.adapter.write(filePath, content);
            console.log(`Saved state for block ${this.blockId}:`, this.chartState);
        } catch (error) {
            console.error(`Error saving state for block ${this.blockId}:`, error);
        }
    }

    async onload() {
        console.log(`Loading ActivityWatchStackedLineChartViewBlock ${this.blockId}`);
        await this.loadChartState();
        try {
            const timeframe = this.chartState.selectedTimeframe || DEFAULT_CHART_STATE.selectedTimeframe || "24";
            const bucket = this.chartState.selectedBucket || DEFAULT_CHART_STATE.selectedBucket || "aw-watcher-window_Kikis";
            const from = this.chartState.dateRange?.from || DEFAULT_CHART_STATE.dateRange?.from;
            const to = this.chartState.dateRange?.to || DEFAULT_CHART_STATE.dateRange?.to;

            if (!from || !to) {
                throw new Error("Invalid date range");
            }

            console.log(`Fetching data for timeframe: ${timeframe}, bucket: ${bucket}, from: ${from.toISOString()}, to: ${to.toISOString()}`);
            const { data, prev_data } = await fetchStocahsticTimeframeData(bucket, parseInt(timeframe), from, to);

            this.root = createRoot(this.containerEl);
            this.root.render(
                React.createElement(
                    React.StrictMode,
                    null,
                    React.createElement(StackedLineChartComponent, { 
                        data: data,
                        prev_data: prev_data,
                        onTimeframeChange: this.handleTimeframeChange.bind(this),
                        settings: this.settings,
                        initialState: this.chartState,
                        onStateChange: this.handleStateChange.bind(this),
                        useDateRange: true
                    }),
                ),
            );
        } catch (error) {
            console.error(`Error rendering chart for block ${this.blockId}:`, error);
            this.containerEl.setText(`Error: ${error instanceof Error ? error.message : "An unknown error occurred"}`);
        }
    }

    private async handleTimeframeChange(hours: number, bucket: string, from: Date | undefined, to: Date | undefined): Promise<any> {
        console.log(`Timeframe changed for block ${this.blockId}: ${hours} hours, bucket: ${bucket}, from: ${from?.toISOString()}, to: ${to?.toISOString()}`);
        if (!from || !to) {
            throw new Error("Invalid date range");
        }
        const data = await fetchStocahsticTimeframeData(bucket, hours, from, to);
        this.chartState = {
            ...this.chartState,
            selectedTimeframe: hours.toString(),
            selectedBucket: bucket,
            dateRange: { from, to }
        };
        await this.saveChartState();
        return data;
    }

    private async handleStateChange(newState: Partial<ChartState>) {
        this.chartState = { ...this.chartState, ...newState };
        if (this.chartState.dateRange) {
            this.chartState.dateRange.from = this.chartState.dateRange.from ? new Date(this.chartState.dateRange.from) : undefined;
            this.chartState.dateRange.to = this.chartState.dateRange.to ? new Date(this.chartState.dateRange.to) : undefined;
        }
        await this.saveChartState();
        console.log(`State changed for block ${this.blockId}:`, this.chartState);
    }

    async onunload() {
        console.log(`Unloading ActivityWatchStackedLineChartViewBlock ${this.blockId}`);
        if (this.root) {
            this.root.unmount();
        }
        await this.saveChartState();
    }
}