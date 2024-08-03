import { Plugin, WorkspaceLeaf } from "obsidian";
import {
	ActivityWatchBarChartView,
	VIEW_TYPE_BARCHART,
} from "./ActivityWatchBarChartView";
import {
	ActivityWatchSettingTab,
	ActivityWatchPluginSettings,
	DEFAULT_SETTINGS,
} from "./ActivityWatchPluginSettings";

export default class ActivityWatchPlugin extends Plugin {
	settings!: ActivityWatchPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new ActivityWatchSettingTab(this.app, this));

		this.registerView(
			VIEW_TYPE_BARCHART,
			(leaf: WorkspaceLeaf) =>
				new ActivityWatchBarChartView(leaf, this.settings),
		);

		this.addRibbonIcon(
			"bar-chart-2",
			"Open ActivityWatch Bar Chart",
			() => {
				this.activateView(VIEW_TYPE_BARCHART);
			},
		);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
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
