import { Editor, EditorChange, TFile } from "obsidian";
import { normalize } from "path";
import AutoReplacer from "src/main";
import { Rule, MatchGroup, Occurrence } from "src/types";

// Format Rules
function transformNoteTitle(
	occurrence: Occurrence,
	editor: Editor,
	file: TFile
): string {
	const noteName = file?.basename;

	if (!noteName) return occurrence.original;

	const lowercaseWords = [
		// Português
		"de",
		"da",
		"do",
		"das",
		"dos",
		"e",
		"em",
		"com",
		"sem",
		"por",
		"para",
		"no",
		"na",
		"nos",
		"nas",
		"ao",
		"aos",
		"às",
		// Inglês
		"of",
		"the",
		"and",
		"in",
		"on",
		"at",
		"to",
		"for",
		"with",
		"from",
		"by",
		"as",
	];

	const capitalized = noteName
		.split(" ")
		.map((word, i) => {
			const isFirst = i === 0;
			const lower = word.toLowerCase();

			if (isFirst || !lowercaseWords.includes(lower)) {
				return lower.charAt(0).toUpperCase() + lower.slice(1);
			}

			return lower;
		})
		.join(" ");

	return `**${capitalized}**`;
}

// Obsidian Layer
const rules: Rule[] = [
	{
		name: "Adjust Note Title",
		key: "adjustNoteTitle",
		regex: {
			pattern: "(?<!\\*\\*)\\b{{file.basename}}\\b(?!\\*\\*)",
			flags: "gi",
		},
		transform: transformNoteTitle,
	},
];

export class AutoReplacerPlugin {
	constructor(private plugin: AutoReplacer) {}

	findAndReplace = (editor: Editor): void => {
		const content = editor.getValue();
		const file = this.plugin.app.workspace.getActiveFile();

		if (!file) throw new Error("No active file found");

		const matches = this.findRegexMatches(content, rules, editor, file);

		if (Object.keys(matches).length > 0) {
			const transforms = this.applyTransformsFromRules(
				matches,
				rules,
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
	) => {
		const result: MatchGroup = {};
		const normalizedText = normalize(text);

		for (const rule of rules) {
			const matches = [];

			const resolvedSource = this.resolveDynamicPlaceholders(
				rule.regex.pattern,
				editor,
				file
			);
			const regex = new RegExp(resolvedSource, rule.regex.flags);

			let match;
			while ((match = regex.exec(normalizedText)) !== null) {
				const startCaret = match.index;
				const endCaret = regex.lastIndex;
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
			const value = this.resolvePathFromEditor(path.trim(), editor, file);

			if (typeof value === "string") return value;
			if (typeof value === "number") return value.toString();

			throw new Error(
				"Unsupported variable type: " +
					typeof value +
					". You can only use strings or numbers in {{}} placeholders."
			);
		});
	};

	resolvePathFromEditor = (
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

		parts.shift(); // Remove o prefixo

		for (const part of parts) {
			if (current && typeof current === "object" && part in current) {
				// Faz cast seguro, pois acabamos de verificar com `in`
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
			if (!rule || typeof rule.transform !== "function") continue;

			result[key] = matchesByKey[key].map(({ occurrence, ...rest }) => ({
				...rest,
				occurrence,
				result: rule.transform(occurrence, editor, file),
			}));
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
