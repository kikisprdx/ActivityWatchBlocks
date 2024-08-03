import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import React from "react";
import { ActivityWatchBarChart } from "./ActivityWatchBarChart";
import { ActivityWatchPluginSettings } from "./ActivityWatchPluginSettings";
import {
	fetchCategoryData,
	fetchBuckets,
	CategoryData,
} from "./activityWatchUtils";

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
			const buckets = await fetchBuckets();
			console.log("Fetched buckets:", buckets);

			if (buckets.length === 0) {
				throw new Error("No buckets available");
			}

			const defaultBucket = buckets[0];
			console.log("Using default bucket:", defaultBucket);

			const currentData = await fetchCategoryData(defaultBucket, 24);
			const previousData = await fetchCategoryData(defaultBucket, 48);
			console.log("Fetched initial data:", currentData, previousData);

			this.root?.render(
				React.createElement(
					React.StrictMode,
					null,
					React.createElement(ActivityWatchBarChart, {
						data: currentData,
						prev_data: previousData,
						onTimeframeChange:
							this.handleTimeframeChange.bind(this),
						settings: this.settings,
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
		console.log(
			`Handling timeframe change: ${hours} hours, bucket: ${bucket}`,
		);
		const data = await fetchCategoryData(bucket, hours);
		const prev_data = await fetchCategoryData(bucket, hours * 2);
		return { data, prev_data };
	}
}
