import { PluginSettingTab } from "obsidian";
import AutoReplacer from "src/main";

export class AutoReplacerSettingsTab extends PluginSettingTab {
	constructor(plugin: AutoReplacer) {
		super(plugin.app, plugin);
	}

	display(): void {
		throw new Error("Method not implemented.");
	}
}
