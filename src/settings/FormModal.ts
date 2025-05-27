import { Modal, App } from "obsidian";
import { AutoReplacerSettingsTab } from "./AutoReplacerSettings";
import { RuleForm } from "./Form";
import AutoReplacer from "src/main";
import { Rule } from "src/types";

export class RuleModal extends Modal {
	ruleForm: RuleForm;
	formData: Rule | null = null;

	constructor(
		public app: App,
		private settingsRoot: AutoReplacerSettingsTab,
		private plugin: AutoReplacer
	) {
		super(app);
	}

	setFormData = (rule: Rule | null): void => {
		this.formData = rule;
	};

	onOpen = () => {
		const { contentEl } = this;

		console.log(this.formData);
		contentEl.createEl("h2", {
			text: this.formData ? "Edit your rule" : "Add your rule",
		});

		new RuleForm(
			contentEl,
			this.plugin,
			this.close.bind(this),
			this.formData
		);

		const submitButton = contentEl.createEl("button", {
			text: this.formData ? "Save Rule Changes" : "Add Rule",
			cls: "mod-cta auto-replacer__rule-setting__add-rule-button",
		});
		submitButton.setAttribute("type", "submit");
		submitButton.setAttribute("form", "rule-settings-form");
	};

	onClose = () => {
		const { contentEl } = this;
		contentEl.empty();
		this.settingsRoot.renderRules();
		this.setFormData(null);
	};
}
