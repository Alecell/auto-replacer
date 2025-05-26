import { App, Modal, PluginSettingTab } from "obsidian";
import AutoReplacer from "src/main";
import { Rule } from "src/types";

const createRuleSetting = (ruleList: HTMLElement): void => {
	const wrapper = ruleList.createEl("div", {
		cls: "auto-replacer__rule-setting__rule",
	});

	const upperContainer = wrapper.createEl("div", {
		cls: "auto-replacer__rule-setting__upper-container",
	});
	upperContainer.createEl("input", {
		type: "text",
		placeholder: "Rule Name",
		cls: "auto-replacer__rule-setting__rule-input",
	});

	upperContainer.createEl("input", {
		type: "text",
		placeholder: "Rule ID",
		cls: "auto-replacer__rule-setting__rule-input",
	});

	const bottomContainer = wrapper.createEl("div", {
		cls: "auto-replacer__rule-setting__bottom-container",
	});
	bottomContainer.createEl("input", {
		type: "text",
		placeholder: "Regex Pattern",
		cls: "auto-replacer__rule-setting__rule-input",
	});

	const textarea = bottomContainer.createEl("textarea", {
		cls: "auto-replacer__rule-setting__rule-textarea",
	});

	textarea.setAttribute("placeholder", "Replacement Code");
};
export class RuleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "Add your rule" });

		createRuleSetting(contentEl);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty(); // limpa o conteúdo ao fechar
	}
}

export class AutoReplacerSettingsTab extends PluginSettingTab {
	rules: Rule[];
	modal: RuleModal;

	constructor(plugin: AutoReplacer) {
		super(plugin.app, plugin);
	}

	display = (): void => {
		const { containerEl } = this;
		// FAZER UM QUICK ACCESS NO TOPO IGUAL O META BIND COM DOCS, FAQ (QUE NAO TEM AINDA), GIUTHUB E REPORT ISSUE
		containerEl.empty();

		containerEl.createEl("h1", {
			text: "Auto Replacer",
		});

		containerEl.createEl("p", {
			text: "This plugin automatically replaces text in your notes based on defined rules.",
		});

		const addRuleButton = containerEl.createEl("button", {
			text: "Add Custom Rule",
			cls: "mod-cta",
		});
		addRuleButton.addEventListener("click", () => {
			new RuleModal(this.app).open();
		});

		const ruleList = containerEl.createEl("div", {
			cls: "auto-replacer__rule-list",
		});

		ruleList.createEl("h2", {
			text: "Custom Rules",
		});

		this.rules?.forEach((rule) => {
			/**
			 * colocar a parada em formato card com todas as informaçòes
			 * os 2 botoeszinho de editar e remover
			 * e tambem colocar o texto do codigo em pre tag
			 */
		});
	};
}
