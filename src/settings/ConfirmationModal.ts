import { App, Modal, Setting } from "obsidian";

export class ConfirmModal extends Modal {
	ruleName: string;
	onConfirm: () => void;

	constructor(app: App, ruleName: string, onConfirm: () => void) {
		super(app);
		this.onConfirm = onConfirm;
		this.ruleName = ruleName.trim();
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", {
			text: `Do you really want to delete the rule ${this.ruleName}?`,
		});

		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => this.close())
			)
			.addButton((btn) =>
				btn
					.setButtonText("Confirm")
					.setCta()
					.onClick(() => {
						this.onConfirm();
						this.close();
					})
			);
	}

	onClose() {
		this.contentEl.empty();
	}
}
