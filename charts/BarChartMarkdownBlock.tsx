import { MarkdownRenderChild } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import { BarChartComponent } from "./BarChartComponent";
import { ActivityWatchPluginSettings } from "../ActivityWatchPluginSettings";
import { fetchCategoryData, fetchTimeframeData} from "../ActivityWatchUtils";

export class ActivityWatchBarChartViewBlock extends MarkdownRenderChild {
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
        console.log("Loading ActivityWatchBarChartViewBlock");
        try {
            const data = await fetchCategoryData("aw-watcher-window_Kikis", 24);
            const prev_data = await fetchCategoryData("aw-watcher-window_Kikis", 48);
            this.root = createRoot(this.containerEl);
            this.root.render(
                React.createElement(
                    React.StrictMode,
                    null,
                    React.createElement(BarChartComponent, { 
                        data: data, 
                        prev_data: prev_data,
                        onTimeframeChange: fetchTimeframeData.bind(this),
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
        console.log("Unloading ActivityWatchBarChartViewBlock");
        if (this.root) {
            this.root.unmount();
        }
    }
}