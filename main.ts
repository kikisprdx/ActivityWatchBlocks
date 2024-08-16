import { Plugin, WorkspaceLeaf } from "obsidian";
import { ActivityWatchBarChartView, VIEW_TYPE_BARCHART } from "./charts/BarChartView";
import { ActivityWatchBarChartViewBlock } from "./charts/BarChartMarkdownBlock";
import { ActivityWatchSettingTab, ActivityWatchPluginSettings, DEFAULT_SETTINGS } from "./ActivityWatchPluginSettings";
import { ActivityWatchStackedLineChartViewBlock } from "./charts/StackedLineChartMarkdownBlock";
import { ActivityWatchStackedLineChartView, VIEW_TYPE_STACKEDLINECHART } from "./charts/StackedLineChartView";
import { ActivityWatchContourMap } from "charts/ContourMapMarkdownBlock";

export default class ActivityWatchPlugin extends Plugin {
    settings!: ActivityWatchPluginSettings;

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new ActivityWatchSettingTab(this.app, this));

        this.registerView(
            VIEW_TYPE_BARCHART,
            (leaf: WorkspaceLeaf) => new ActivityWatchBarChartView(leaf, this.settings, this)
        );

        this.registerView(
            VIEW_TYPE_STACKEDLINECHART,
            (leaf: WorkspaceLeaf) => new ActivityWatchStackedLineChartView(leaf, this.settings, this)
        );
        

        this.registerMarkdownCodeBlockProcessor(
            "activitywatch-barchart",
            (source, el, ctx) => {
                const rootEl = el.createDiv();
                ctx.addChild(
                    new ActivityWatchBarChartViewBlock(rootEl, source, this.settings, ctx, this)
                );
            }
        );

        this.registerMarkdownCodeBlockProcessor(
            "activitywatch-stackedlinechart",
            (source, el, ctx) => {
                const rootEl = el.createDiv();
                ctx.addChild(
                    new ActivityWatchStackedLineChartViewBlock(rootEl, source, this.settings, ctx, this)
                );
            }
        );

        this.registerMarkdownCodeBlockProcessor(
            "activitywatch-contourmap",
            (source, el, ctx) => {
                const rootEl = el.createDiv();
                ctx.addChild(
                    new ActivityWatchContourMap(rootEl, source, this.settings, ctx, this)
                );
            }
        );
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async activateView(viewType: string) {
        this.app.workspace.detachLeavesOfType(viewType);
    
        const leaf = this.app.workspace.getRightLeaf(false);
        if (leaf) {
            await leaf.setViewState({
                type: viewType,
                active: true,
            });
    
            this.app.workspace.revealLeaf(leaf);
        } else {
            console.error("Failed to create a new leaf");
        }
    }

    onunload() {
        console.log("Unloading ActivityWatch Plugin");
    }
}