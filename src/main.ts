import { debounce, Plugin } from "obsidian";
import { AutoReplacerPlugin } from "./auto-replacer-plugin/AutoReplacerPlugin";
import { AutoReplacerSettingsTab } from "./settings/AutoReplacerSettings";

export default class AutoReplacer extends Plugin {
	onload = () => {
		const plugin = new AutoReplacerPlugin(this);
		const settings = new AutoReplacerSettingsTab(this);

		this.addSettingTab(settings);

		this.app.workspace.on(
			"editor-change",
			debounce(plugin.findAndReplace, 300)
		);
	};
}
