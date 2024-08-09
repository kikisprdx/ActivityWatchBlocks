import { MarkdownRenderChild, MarkdownPostProcessorContext, TFile } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import { BarChartComponent } from "./BarChartComponent";
import { ActivityWatchPluginSettings } from "../ActivityWatchPluginSettings";
import { fetchCategoryData, fetchTimeframeData, ChartState, CategoryData } from "../ActivityWatchUtils";
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_CHART_STATE: Partial<ChartState> = {
    selectedTimeframe: "24",
    selectedBucket: "aw-watcher-window_Kikis",
    categoryCount: 10  // Assuming you want to show top 10 categories by default
};

export class ActivityWatchBarChartViewBlock extends MarkdownRenderChild {
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
        plugin: any // Replace 'any' with your actual plugin type
    ) {
        super(containerEl);
        this.settings = settings;
        this.plugin = plugin;
        this.blockId = this.generateBlockId();
    }

    private generateBlockId(): string {
        const file = this.plugin.app.vault.getAbstractFileByPath(this.ctx.sourcePath) as TFile;
        const position = this.ctx.getSectionInfo(this.containerEl)?.lineStart || 0;
        return `${file.path}-${position}`;
    }

    private getStateFilePath(): string {
        const statesDir = path.join(this.plugin.app.vault.adapter.basePath, 'states');
        if (!fs.existsSync(statesDir)) {
            fs.mkdirSync(statesDir, { recursive: true });
        }
        return path.join(statesDir, `${this.blockId}.bin`);
    }

    private serializeState(state: Partial<ChartState>): Buffer {
        const jsonString = JSON.stringify(state);
        return Buffer.from(jsonString, 'utf-8');
    }

    private deserializeState(buffer: Buffer): Partial<ChartState> {
        const jsonString = buffer.toString('utf-8');
        return JSON.parse(jsonString);
    }

    async onload() {
        console.log(`Loading ActivityWatchBarChartViewBlock ${this.blockId}`);
        await this.loadChartState();
        try {
            const timeframe = this.chartState.selectedTimeframe || DEFAULT_CHART_STATE.selectedTimeframe;
            const bucket = this.chartState.selectedBucket || DEFAULT_CHART_STATE.selectedBucket;

            console.log(`Fetching data for timeframe: ${timeframe}, bucket: ${bucket}`);
            const { data, prev_data } = await fetchTimeframeData(parseInt(timeframe), bucket);

            this.root = createRoot(this.containerEl);
            this.root.render(
                React.createElement(
                    React.StrictMode,
                    null,
                    React.createElement(BarChartComponent, { 
                        data: data, 
                        prev_data: prev_data,
                        onTimeframeChange: this.handleTimeframeChange.bind(this),
                        settings: this.settings,
                        initialState: this.chartState,
                        onStateChange: this.handleStateChange.bind(this)
                    }),
                ),
            );
        } catch (error) {
            console.error(`Error rendering chart for block ${this.blockId}:`, error);
            this.containerEl.setText(`Error: ${error instanceof Error ? error.message : "An unknown error occurred"}`);
        }
    }

    private async loadChartState() {
        const filePath = this.getStateFilePath();
        if (fs.existsSync(filePath)) {
            try {
                const buffer = await fs.promises.readFile(filePath);
                const loadedState = this.deserializeState(buffer);
                // Merge loaded state with default state, preferring loaded values
                this.chartState = { ...DEFAULT_CHART_STATE, ...loadedState };
            } catch (error) {
                console.error(`Error loading state for block ${this.blockId}:`, error);
                this.chartState = { ...DEFAULT_CHART_STATE };
            }
        } else {
            this.chartState = { ...DEFAULT_CHART_STATE };
        }
        console.log(`Loaded state for block ${this.blockId}:`, this.chartState);
    }

    private async saveChartState() {
        const filePath = this.getStateFilePath();
        const buffer = this.serializeState(this.chartState);
        try {
            await fs.promises.writeFile(filePath, buffer);
            console.log(`Saved state for block ${this.blockId}:`, this.chartState);
        } catch (error) {
            console.error(`Error saving state for block ${this.blockId}:`, error);
        }
    }

    private async handleTimeframeChange(hours: number, bucket: string): Promise<{ data: CategoryData; prev_data: CategoryData }> {
        console.log(`Timeframe changed for block ${this.blockId}: ${hours} hours, bucket: ${bucket}`);
        const result = await fetchTimeframeData(hours, bucket);
        this.chartState = {
            ...this.chartState,
            selectedTimeframe: hours.toString(),
            selectedBucket: bucket
        };
        await this.saveChartState();
        return result;
    }

    private async handleStateChange(newState: Partial<ChartState>) {
        this.chartState = { ...this.chartState, ...newState };
        await this.saveChartState();
        console.log(`State changed for block ${this.blockId}:`, this.chartState);
    }

    async onunload() {
        console.log(`Unloading ActivityWatchBarChartViewBlock ${this.blockId}`);
        if (this.root) {
            this.root.unmount();
        }
        await this.saveChartState();
    }
}