import { Editor, EditorChange, TFile } from "obsidian";
import { normalize } from "../utils/normalize";
import AutoReplacer from "src/main";
import { Rule, MatchGroup, Match } from "src/types";

export class AutoReplacerPlugin {
	constructor(private plugin: AutoReplacer) {}

	findAndReplace = (editor: Editor): void => {
		const content = editor.getValue();
		const file = this.plugin.app.workspace.getActiveFile();

		if (!file) throw new Error("No active file found");

		const matches = this.findRegexMatches(
			content,
			this.plugin.rules,
			editor,
			file
		);

		if (Object.keys(matches).length > 0) {
			const transforms = this.applyTransformsFromRules(
				matches,
				this.plugin.rules,
				editor,
				file
			);
			const changes = this.getEditorChangesFromTransforms(
				transforms,
				editor
			);

			editor.transaction({
				changes,
			});
		}
	};

	findRegexMatches = (
		text: string,
		rules: Rule[],
		editor: Editor,
		file: TFile
	): MatchGroup => {
		const result: MatchGroup = {};
		const normalizedText = normalize(text);

		for (const rule of rules) {
			const matches: Match[] = [];

			const resolvedSource = this.resolveDynamicPlaceholders(
				rule.regex.pattern,
				editor,
				file
			);
			const regex = new RegExp(resolvedSource, rule.regex.flags);

			for (const match of normalizedText.matchAll(regex)) {
				if (typeof match.index !== "number") continue;

				const startCaret = match.index;
				const endCaret = startCaret + match[0].length;
				const original = text.slice(startCaret, endCaret);
				const normalized = normalizedText.slice(startCaret, endCaret);

				matches.push({
					occurrence: {
						match,
						original,
						normalized,
					},
					startCaret,
					endCaret,
				});
			}

			if (matches.length > 0) {
				result[rule.key] = matches;
			}
		}

		return result;
	};

	resolveDynamicPlaceholders = (
		inputString: string,
		editor: Editor,
		file: TFile
	) => {
		return inputString.replace(/{{(.*?)}}/g, (_, path) => {
			const value = this.resolvePathTemplate(path.trim(), editor, file);

			if (typeof value === "string") return value;
			if (typeof value === "number") return value.toString();

			throw new Error(
				"Unsupported variable type: " +
					typeof value +
					". You can only use strings or numbers in {{}} placeholders."
			);
		});
	};

	resolvePathTemplate = (
		path: string,
		editor: Editor,
		file: TFile
	): unknown => {
		const parts = path.split(".");
		let current: unknown;

		if (parts[0] === "editor") {
			current = editor;
		} else if (parts[0] === "file") {
			current = file;
		} else {
			throw new Error(
				`Unsupported variable root or path not found. Looking for ${parts[0]} in ${path}`
			);
		}

		parts.shift();

		for (const part of parts) {
			if (current && typeof current === "object" && part in current) {
				current = (current as Record<string, unknown>)[part];
			} else {
				return undefined;
			}
		}

		return current;
	};

	applyTransformsFromRules = (
		matchesByKey: MatchGroup,
		rules: Rule[],
		editor: Editor,
		file: TFile
	) => {
		const result: MatchGroup = {};

		for (const key in matchesByKey) {
			const rule = rules.find((r) => r.key === key);
			if (!rule) continue;

			result[key] = matchesByKey[key].map(({ occurrence, ...rest }) => {
				const fn = new Function(
					"occurrence",
					"editor",
					"file",
					`return (${rule.transform})(occurrence, editor, file)`
				);

				return {
					...rest,
					occurrence,
					result: fn(occurrence, editor, file),
				};
			});
		}

		return result;
	};

	getEditorChangesFromTransforms = (
		transforms: MatchGroup,
		editor: Editor
	): EditorChange[] => {
		const changes = [];

		for (const transformArray of Object.values(transforms)) {
			for (const item of transformArray) {
				if (!item.result) continue;

				changes.push({
					text: item.result,
					from: editor.offsetToPos(item.startCaret),
					to: editor.offsetToPos(item.endCaret),
				});
			}
		}

		return changes;
	};
}
