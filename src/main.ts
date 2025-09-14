import { debounce, Plugin, MarkdownView } from "obsidian";
import { AutoReplacerPlugin } from "./auto-replacer-plugin/AutoReplacerPlugin";
import { AutoReplacerSettingsTab } from "./settings/AutoReplacerSettings";
import { Rule } from "./types";

const TERMINATION_CHARS = [' ', 'Enter', '.', ',', ';', ':', '!', '?', ')', ']', '}'];
const NAVIGATION_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
const ALL_TRIGGER_KEYS = [...TERMINATION_CHARS, ...NAVIGATION_KEYS];

export default class AutoReplacer extends Plugin {
	rules: Rule[] = [];
	private debouncedFindAndReplace: ReturnType<typeof debounce>;
	private fallbackDebounce: ReturnType<typeof debounce>;

	onload = async () => {
		const data = await this.loadData();
		this.rules = data?.rules || [];

		const plugin = new AutoReplacerPlugin(this);
		const settings = new AutoReplacerSettingsTab(this);

		this.addSettingTab(settings);
		this.debouncedFindAndReplace = debounce(plugin.findAndReplace, 100);
		this.fallbackDebounce = debounce(plugin.findAndReplace, 5000);
		
		this.setupGlobalKeyListener();
		
		this.registerEvent(
			this.app.workspace.on("editor-change", (editor) => {
				this.fallbackDebounce(editor);
			})
		);
	};

	private setupGlobalKeyListener = () => {
		this.registerDomEvent(document, 'keyup', (event: KeyboardEvent) => {
			if (!(event.target instanceof HTMLElement)) return;
			
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) return;

			// @ts-ignore - Acessando DOM do CodeMirror
			if (!view.editor.cm.dom.contains(event.target)) return;

			if (ALL_TRIGGER_KEYS.includes(event.key)) {
				this.fallbackDebounce.cancel();
				this.debouncedFindAndReplace(view.editor);
			}
		});
	};

	onunload = () => {
		this.debouncedFindAndReplace?.cancel();
		this.fallbackDebounce?.cancel();
	};
}
