import { App, PluginSettingTab, Setting, DropdownComponent } from "obsidian";
import ActivityWatchPlugin from "./main";

export interface ActivityWatchPluginSettings {
    // Chart dimensions
    chartHeight: number;
    chartWidth: string;

    // Colors
    backgroundColor: string;
    textColor: string;
    currentBarColor: string;
    previousBarColor: string;
    gridColor: string;

    // Fonts
    titleFontSize: number;
    labelFontSize: number;
    legendFontSize: number;

    // Spacing and margins
    cardPadding: number;
    titleMarginBottom: number;
    controlsMarginBottom: number;
    chartMarginTop: number;
    footerMarginTop: number;

    // Chart specific
    barGap: number;
    categoryCount: number;
    xAxisAngle: number;

    // Tooltip
    tooltipBackgroundColor: string;
    tooltipTextColor: string;
    tooltipBorderColor: string;

    // Legend
    legendPosition: 'top';
}

export const DEFAULT_SETTINGS: ActivityWatchPluginSettings = {
    chartHeight: 380,
    chartWidth: '100%',
    backgroundColor: '#2f3136',
    textColor: '#dcddde',
    currentBarColor: '#00ff00',
    previousBarColor: '#0088FE',
    gridColor: '#4f545c',
    titleFontSize: 24,
    labelFontSize: 12,
    legendFontSize: 14,
    cardPadding: 20,
    titleMarginBottom: 10,
    controlsMarginBottom: 20,
    chartMarginTop: 10,
    footerMarginTop: 20,
    barGap: 4,
    categoryCount: 10,
    xAxisAngle: -45,
    tooltipBackgroundColor: 'rgba(47, 49, 54, 0.8)',
    tooltipTextColor: '#ffffff',
    tooltipBorderColor: 'rgba(255, 255, 255, 0.1)',
    legendPosition: 'top'
};

export class ActivityWatchSettingTab extends PluginSettingTab {
    plugin: ActivityWatchPlugin;

    constructor(app: App, plugin: ActivityWatchPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'ActivityWatch Bar Chart Settings' });

        // Chart Dimensions
        new Setting(containerEl)
            .setName('Chart Height')
            .setDesc('Height of the chart in pixels')
            .addText(text => text
                .setPlaceholder('380')
                .setValue(this.plugin.settings.chartHeight.toString())
                .onChange(async (value) => {
                    this.plugin.settings.chartHeight = Number(value);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Chart Width')
            .setDesc('Width of the chart (e.g., 100%, 500px)')
            .addText(text => text
                .setPlaceholder('100%')
                .setValue(this.plugin.settings.chartWidth)
                .onChange(async (value) => {
                    this.plugin.settings.chartWidth = value;
                    await this.plugin.saveSettings();
                }));

        // Colors
        new Setting(containerEl)
            .setName('Background Color')
            .setDesc('Background color of the chart area')
            .addText(text => text
                .setPlaceholder('#2f3136')
                .setValue(this.plugin.settings.backgroundColor)
                .onChange(async (value) => {
                    this.plugin.settings.backgroundColor = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Text Color')
            .setDesc('Color of the text in the chart')
            .addText(text => text
                .setPlaceholder('#dcddde')
                .setValue(this.plugin.settings.textColor)
                .onChange(async (value) => {
                    this.plugin.settings.textColor = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Current Bar Color')
            .setDesc('Color of the bars for the current period')
            .addText(text => text
                .setPlaceholder('#00ff00')
                .setValue(this.plugin.settings.currentBarColor)
                .onChange(async (value) => {
                    this.plugin.settings.currentBarColor = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Previous Bar Color')
            .setDesc('Color of the bars for the previous period')
            .addText(text => text
                .setPlaceholder('#0088FE')
                .setValue(this.plugin.settings.previousBarColor)
                .onChange(async (value) => {
                    this.plugin.settings.previousBarColor = value;
                    await this.plugin.saveSettings();
                }));

        // Fonts
        new Setting(containerEl)
            .setName('Title Font Size')
            .setDesc('Font size of the chart title in pixels')
            .addText(text => text
                .setPlaceholder('24')
                .setValue(this.plugin.settings.titleFontSize.toString())
                .onChange(async (value) => {
                    this.plugin.settings.titleFontSize = Number(value);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Label Font Size')
            .setDesc('Font size of the axis labels in pixels')
            .addText(text => text
                .setPlaceholder('12')
                .setValue(this.plugin.settings.labelFontSize.toString())
                .onChange(async (value) => {
                    this.plugin.settings.labelFontSize = Number(value);
                    await this.plugin.saveSettings();
                }));

        // Spacing and Margins
        new Setting(containerEl)
            .setName('Card Padding')
            .setDesc('Padding around the entire chart card in pixels')
            .addText(text => text
                .setPlaceholder('20')
                .setValue(this.plugin.settings.cardPadding.toString())
                .onChange(async (value) => {
                    this.plugin.settings.cardPadding = Number(value);
                    await this.plugin.saveSettings();
                }));

        // Chart Specific
        new Setting(containerEl)
            .setName('Category Count')
            .setDesc('Default number of categories to display')
            .addText(text => text
                .setPlaceholder('10')
                .setValue(this.plugin.settings.categoryCount.toString())
                .onChange(async (value) => {
                    this.plugin.settings.categoryCount = Number(value);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('X-Axis Angle')
            .setDesc('Angle of x-axis labels in degrees')
            .addText(text => text
                .setPlaceholder('-45')
                .setValue(this.plugin.settings.xAxisAngle.toString())
                .onChange(async (value) => {
                    this.plugin.settings.xAxisAngle = Number(value);
                    await this.plugin.saveSettings();
                }));

        // Legend
        new Setting(containerEl)
            .setName('Legend Position')
            .setDesc('Position of the chart legend')
            .addDropdown((dropdown: DropdownComponent) => dropdown
                .addOption('top', 'Top')
                .addOption('bottom', 'Bottom')
                .addOption('left', 'Left')
                .addOption('right', 'Right')
                .setValue(this.plugin.settings.legendPosition)
                .onChange(async (value) => {
                    this.plugin.settings.legendPosition = "top";
                    await this.plugin.saveSettings();
                })
            );
    }
}