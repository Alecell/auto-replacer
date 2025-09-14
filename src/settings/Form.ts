import { Notice } from "obsidian";
import AutoReplacer from "src/main";
import { mockEditor } from "src/mocks/Editor";
import { mockOccurrence } from "src/mocks/Occurrence";
import { mockTFile } from "src/mocks/TFile";
import { Rule } from "src/types";

export class RuleForm {
	form: HTMLFormElement;
	rules: Rule[];
	closeModal: () => void;

	constructor(
		ruleList: HTMLElement,
		private plugin: AutoReplacer,
		closeModal: () => void,
		private formData: Rule | null
	) {
		this.rules = plugin.rules;
		this.closeModal = closeModal;
		this.form = this.buildForm(ruleList, formData);
	}

	private validate(): boolean {
		const fields = this.form.elements as typeof this.form.elements & {
			ruleName: HTMLInputElement;
			ruleId: HTMLInputElement;
			description?: HTMLTextAreaElement;
			regexPattern: HTMLInputElement;
			regexFlags?: HTMLInputElement;
			replacementCode: HTMLTextAreaElement;
			ignoreFrontmatter?: HTMLInputElement;
			ignoreTildeBlocks?: HTMLInputElement;
			ignoreBackQuoteBlocks?: HTMLInputElement;
		};

		const errors: string[] = [];
		const key = fields.ruleId.value.trim();
		const pattern = fields.regexPattern.value.trim();
		const code = fields.replacementCode.value.trim();

		if (
			this.formData?.key !== key &&
			this.rules.some((r) => r.key === key)
		) {
			errors.push(`A rule with ID "${key}" already exists.`);
		}

		try {
			new RegExp(pattern);
		} catch (e) {
			errors.push("Invalid regex pattern: " + (e as Error).message);
		}

		if (
			fields.regexFlags?.value &&
			!fields.regexFlags?.value.contains("g")
		) {
			errors.push("Regex flags must include 'g'.");
		}

		try {
			const fn = new Function(
				"match",
				"editor",
				"file",
				`return (${code})(match, editor, file)`
			);

			fn(mockOccurrence, mockEditor, mockTFile);
			if (typeof fn !== "function")
				throw new Error("Code is not a function");
		} catch (e) {
			errors.push("Invalid JavaScript code: " + (e as Error).message);
		}

		if (errors.length > 0) {
			new Notice("Rule validation failed:\n" + errors.join("\n"));
			return false;
		}

		return true;
	}

	public buildForm(
		ruleList: HTMLElement,
		formData: Rule | null
	): HTMLFormElement {
		const wrapper = ruleList.createEl("form", {
			cls: "auto-replacer__rule-setting__rule",
		});
		wrapper.setAttribute("id", "rule-settings-form");
		wrapper.addEventListener("submit", async (e) => {
			e.preventDefault();
			if (!this.validate()) return;

			const fields = wrapper.elements as typeof wrapper.elements & {
				ruleName: HTMLInputElement;
				ruleId: HTMLInputElement;
				regexPattern: HTMLInputElement;
				replacementCode: HTMLTextAreaElement;
				description?: HTMLTextAreaElement;
				regexFlags?: HTMLInputElement;
				ignoreFrontmatter?: HTMLInputElement;
				ignoreTildeBlocks?: HTMLInputElement;
				ignoreBackQuoteBlocks?: HTMLInputElement;
				ignoreTitles?: HTMLInputElement;
			};

			const newRule = {
				name: fields.ruleName.value.trim(),
				key: fields.ruleId.value.trim(),
				description: fields?.description?.value?.trim() || undefined,
				regex: {
					pattern: fields.regexPattern.value.trim(),
					flags: fields.regexFlags?.value?.trim() || "g",
				},
				transform: fields.replacementCode.value.trim(),
				ignoreFrontmatter: fields.ignoreFrontmatter?.checked,
				ignoreTildeBlocks: fields.ignoreTildeBlocks?.checked,
				ignoreBackQuoteBlocks: fields.ignoreBackQuoteBlocks?.checked,
				ignoreTitles: fields.ignoreTitles?.checked,
			};

			if (this.formData) {
				const index = this.rules.findIndex(
					(r) => r.key === this.formData?.key
				);
				if (index !== -1) {
					this.rules[index] = newRule;
				} else {
					this.rules.unshift(newRule);
				}
			} else {
				this.rules.unshift(newRule);
			}

			new Notice(
				`Rule "${fields.ruleName.value}" ${
					this.formData ? "updated" : "added"
				} successfully!`
			);
			wrapper.reset();
			this.closeModal();
			await this.plugin.saveData({ rules: this.rules });
		});

		const upperContainer = wrapper.createEl("div", {
			cls: "auto-replacer__rule-setting__upper-container",
		});

		upperContainer.createEl("input", {
			type: "text",
			placeholder: "Rule name",
			cls: "auto-replacer__rule-setting__rule-input",
			value: formData?.name || "",
			attr: {
				name: "ruleName",
				required: true,
				pattern: "^[a-zA-ZÀ-ÿ0-9 ]+$",
				title: "Only letters, numbers, and spaces are allowed",
			},
		});

		upperContainer.createEl("input", {
			type: "text",
			placeholder: "Rule ID",
			cls: "auto-replacer__rule-setting__rule-input",
			value: formData?.key || "",
			attr: {
				name: "ruleId",
				required: true,
				pattern: "^[a-z0-9_\\-]+$",
				title: "Only lowercase letters, numbers, dashes and underscores are allowed",
			},
		});

		const bottomContainer = wrapper.createEl("div", {
			cls: "auto-replacer__rule-setting__bottom-container",
		});

		const regexContainer = bottomContainer.createEl("div", {
			cls: "auto-replacer__rule-setting__rule-regex-container",
		});

		regexContainer.createEl("input", {
			type: "text",
			placeholder: "Regex pattern",
			cls: "auto-replacer__rule-setting__rule-input",
			value: formData?.regex?.pattern || "",
			attr: {
				name: "regexPattern",
				required: true,
				title: "Only letters, numbers, and underscores are allowed",
			},
		});

		regexContainer.createEl("input", {
			type: "text",
			placeholder: "Flags",
			cls: "auto-replacer__rule-setting__rule-input",
			value: formData?.regex?.flags || "",
			attr: {
				name: "regexFlags",
				title: "Regex flags (optional). Defaults to global.",
			},
		});

		const codeTextarea = bottomContainer.createEl("textarea", {
			cls: "auto-replacer__rule-setting__rule-textarea",
			attr: {
				placeholder: "Replacement code",
				name: "replacementCode",
				required: true,
				title: "Enter the replacement javascript code here. You can use {{variable}} syntax for dynamic variables.",
			},
		});
		codeTextarea.value = formData?.transform || "";

		const checkboxContainer = bottomContainer.createEl("div", {
			cls: "auto-replacer__rule-setting__checkbox-container",
		});

		const frontmatterCheckboxContainer = checkboxContainer.createEl(
			"label",
			{
				cls: "auto-replacer__rule-setting__checkbox-label",
			}
		);
		const frontmatterCheckbox = frontmatterCheckboxContainer.createEl("input", {
			type: "checkbox",
			cls: "auto-replacer__rule-setting__checkbox",
			attr: {
				name: "ignoreFrontmatter",
			},
		});
		frontmatterCheckbox.checked = formData?.ignoreFrontmatter || false;
		frontmatterCheckboxContainer.createEl("span", {
			text: "Ignore frontmatter",
		});

		const tildeCheckboxContainer = checkboxContainer.createEl("label", {
			cls: "auto-replacer__rule-setting__checkbox-label",
		});
		const tildeCheckbox = tildeCheckboxContainer.createEl("input", {
			type: "checkbox",
			cls: "auto-replacer__rule-setting__checkbox",
			attr: {
				name: "ignoreTildeBlocks",
			},
		});
		tildeCheckbox.checked = formData?.ignoreTildeBlocks || false;
		tildeCheckboxContainer.createEl("span", {
			text: "Ignore tilde blocks",
		});

		// Checkbox para Ignore back quote blocks
		const backQuoteCheckboxContainer = checkboxContainer.createEl("label", {
			cls: "auto-replacer__rule-setting__checkbox-label",
		});
		const backQuoteCheckbox = backQuoteCheckboxContainer.createEl("input", {
			type: "checkbox",
			cls: "auto-replacer__rule-setting__checkbox",
			attr: {
				name: "ignoreBackQuoteBlocks",
			},
		});
		backQuoteCheckbox.checked = formData?.ignoreBackQuoteBlocks || false;
		backQuoteCheckboxContainer.createEl("span", {
			text: "Ignore back quote blocks",
		});

		// Checkbox para Ignore titles
		const titlesCheckboxContainer = checkboxContainer.createEl("label", {
			cls: "auto-replacer__rule-setting__checkbox-label",
		});
		const titlesCheckbox = titlesCheckboxContainer.createEl("input", {
			type: "checkbox",
			cls: "auto-replacer__rule-setting__checkbox",
			attr: {
				name: "ignoreTitles",
			},
		});
		titlesCheckbox.checked = formData?.ignoreTitles || false;
		titlesCheckboxContainer.createEl("span", {
			text: "Ignore titles",
		});

		const descTextarea = bottomContainer.createEl("textarea", {
			cls: "auto-replacer__rule-setting__rule-textarea",
			attr: {
				placeholder: "Description (optional)",
				name: "description",
				title: "Enter a description for this rule. This is optional.",
			},
		});
		descTextarea.value = formData?.description || "";

		return wrapper;
	}
}
