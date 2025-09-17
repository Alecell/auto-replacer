import { PluginSettingTab, setIcon, Setting } from "obsidian";
import AutoReplacer from "src/main";
import { RuleModal } from "./FormModal";
import { ConfirmModal } from "./ConfirmationModal";
export class AutoReplacerSettingsTab extends PluginSettingTab {
	modal: RuleModal;

	constructor(private plugin: AutoReplacer) {
		super(plugin.app, plugin);
		this.modal = new RuleModal(plugin.app, this, plugin);
	}

	display = (): void => {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Quick access")
			.addButton((cb) => {
				cb.setCta();
				cb.setButtonText("Docs");
				cb.onClick(() => {
					window.open(
						"https://github.com/Alecell/auto-replacer/blob/master/DOCUMENTATION.md",
						"_blank"
					);
				});
			})
			.addButton((cb) => {
				cb.setButtonText("GitHub");
				cb.onClick(() => {
					window.open(
						"https://github.com/Alecell/auto-replacer",
						"_blank"
					);
				});
			})
			.addButton((cb) => {
				cb.setButtonText("Report issue");
				cb.onClick(() => {
					window.open(
						"https://github.com/Alecell/auto-replacer/issues/new",
						"_blank"
					);
				});
			});

		containerEl.createEl("p", {
			text: "This plugin automatically replaces text in your notes using custom regex rules and JavaScript. Use it to format, correct, or transform content in real time while writing.",
		});

		const addRuleButton = containerEl.createEl("button", {
			text: "Add custom rule",
			cls: "mod-cta",
		});
		addRuleButton.addEventListener("click", () => {
			this.modal.open();
		});

		const listContainer = containerEl.createEl("div", {
			cls: "auto-replacer__list-container",
		});

		listContainer.createEl("h2", {
			text: "Custom rules",
		});

		listContainer.createEl("div", {
			cls: "auto-replacer__list-container_rule-list",
		});

		this.renderRules();
	};

	renderRules = (): void => {
		const ruleList = this.containerEl.querySelector(
			".auto-replacer__list-container_rule-list"
		);
		ruleList?.empty();

		if (ruleList && this.plugin.rules.length === 0) {
			ruleList.createEl("p", {
				text: "No custom rules defined yet. Click Add custom rule to create one.",
				cls: "auto-replacer__no-rules-message",
			});
		}

		if (ruleList) {
			this.plugin.rules?.forEach((rule) => {
				const ruleItem = ruleList.createEl("div", {
					cls: "auto-replacer__rule-setting__rule",
				});

				const ruleHeader = ruleItem.createEl("div", {
					cls: "auto-replacer__rule-setting__rule-header",
				});
				const titleContainer = ruleHeader.createEl("div", {
					cls: "auto-replacer__rule-setting__rule-header__title-container",
				});
				titleContainer.createEl("h3", { text: rule.name });
				const editButton = titleContainer.createEl("button", {
					cls: "mod-cta",
					text: "Edit",
				});
				const deleteButton = titleContainer.createEl("button", {
					cls: "auto-replacer__rule-setting__rule-header__delete-button",
					text: "Edit",
				});
				setIcon(deleteButton, "trash");
				deleteButton.addEventListener("click", () => {
					new ConfirmModal(this.plugin.app, rule.name, () => {
						this.plugin.rules = this.plugin.rules.filter(
							(r) => r.key !== rule.key
						);
						this.plugin.saveData({ rules: this.plugin.rules });
						this.renderRules();
					}).open();
				});
				setIcon(editButton, "pencil");
				editButton.addEventListener("click", () => {
					this.modal.setFormData(rule);
					this.modal.open();
				});
				ruleHeader.createEl("span", {
					text: `#${rule.key}`,
				});

				const searchesFor = ruleItem.createEl("div", {
					cls: "auto-replacer__rule-setting__rule-searches-for",
				});
				searchesFor.createEl("h6", { text: "Searches for" });
				const regexWrapper = searchesFor.createDiv(
					"auto-replacer__rule-setting__rule-searches-for__regex"
				);
				regexWrapper.createEl("span", {
					cls: "auto-replacer__rule-setting__rule-searches-for__regex-pattern",
					text: rule.regex.pattern,
				});
				regexWrapper.createEl("span", {
					text: rule.regex.flags,
					cls: "auto-replacer__rule-setting__rule-searches-for__regex-flags",
				});

				const whatItDoes = ruleItem.createEl("div", {
					cls: "auto-replacer__rule-setting__rule-what-it-does",
				});
				const preTitleWrapper = whatItDoes.createEl("div", {
					cls: "auto-replacer__rule-setting__rule-what-it-does__wrapper",
				});
				preTitleWrapper.createEl("h6", { text: "Replace with" });
				const preWrapper = preTitleWrapper.createEl("div", {
					cls: "auto-replacer__rule-setting__rule-what-it-does__code",
				});
				preWrapper.createEl("pre", {
					text: rule.transform,
				});

				const desc = whatItDoes.createEl("div", {
					cls: "auto-replacer__rule-setting__rule-what-it-does__description",
				});

				desc.createEl("h6", { text: "What this rule does?" });
				desc.createEl("p", {
					text: rule.description || "No description provided.",
				});

				const ignoreFlags = ruleItem.createEl("div", {
					cls: "auto-replacer__rule-setting__rule-ignore-flags",
				});
				ignoreFlags.createEl("h6", { 
					text: "Ignore Settings", 
					cls: "auto-replacer__rule-setting__rule-ignore-flags__title" 
				});
				
				const flagsContainer = ignoreFlags.createEl("div", {
					cls: "auto-replacer__rule-setting__rule-ignore-flags__container",
				});

				const createFlagIndicator = (label: string, isActive?: boolean) => {
					const flagEl = flagsContainer.createEl("span", {
						cls: `auto-replacer__rule-setting__rule-ignore-flags__flag ${isActive ? 'active' : 'inactive'}`,
						text: label,
					});
					flagEl.setAttribute("title", `${label}: ${isActive ? 'Enabled' : 'Disabled'}`);
				};

				createFlagIndicator("Frontmatter", rule.ignoreFrontmatter);
				createFlagIndicator("Tilde Blocks", rule.ignoreTildeBlocks);
				createFlagIndicator("Code Blocks", rule.ignoreBackQuoteBlocks);
				createFlagIndicator("Titles", rule.ignoreTitles);
			});
		}
	};
}
