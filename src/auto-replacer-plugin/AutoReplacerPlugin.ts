import { Editor, EditorChange, TFile } from "obsidian";
import { normalize } from "../utils/normalize";
import AutoReplacer from "src/main";
import { 
	Rule, 
	Match, 
	MatchGroup, 
	IgnoredRange, 
	IgnoredRanges, 
	ProcessedRule, 
	FrontmatterRuleConfig,
	MAIN_RULE_PLACEHOLDER,
	FRONTMATTER_STRING_PLACEHOLDER
} from "src/types";

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
		const frontmatterConfig = this.parseFrontmatterRules(file);
		const processedRules = this.mergeRulesWithFrontmatter(rules, frontmatterConfig, editor, file);

		const allIgnoredRanges = {
			frontmatter: this.getFrontmatterRanges(text),
			tildeBlocks: this.getTildeBlockRanges(text),
			backQuoteBlocks: this.getBackQuoteRanges(text),
			titles: this.getTitleRanges(text)
		};

		for (const rule of processedRules) {
			const matches: Match[] = [];
			const patternsToUse = rule.patterns || [
				new RegExp(
					this.resolveDynamicPlaceholders(rule.regex.pattern, editor, file),
					rule.regex.flags
				)
			];

			for (const regex of patternsToUse) {
				for (const match of normalizedText.matchAll(regex)) {
					if (typeof match.index !== "number") continue;
					const startCaret = match.index;
					const endCaret = startCaret + match[0].length;
					const matchLength = match[0].length;

					if (this.shouldIgnoreMatch(startCaret, matchLength, rule, allIgnoredRanges)) {
						continue;
					}

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
		return inputString.replace(/{{(.*?)}}/g, (match, path) => {
			const trimmedPath = path.trim();
			
			if (!trimmedPath.startsWith('file.') && !trimmedPath.startsWith('editor.')) {
				return match;
			}
			
			const value = this.resolvePathTemplate(trimmedPath, editor, file);
			
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



	private getFrontmatterRanges = (text: string): IgnoredRange[] => {
		const ranges: IgnoredRange[] = [];
		const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*$/m;
		const match = text.match(frontmatterRegex);
		
		if (match && match.index !== undefined) {
			ranges.push({
				start: match.index,
				end: match.index + match[0].length
			});
		}
		
		return ranges;
	};

	private getTildeBlockRanges = (text: string): IgnoredRange[] => {
		const ranges: IgnoredRange[] = [];
		const tildeBlockRegex = /^~~~[^\n]*\n[\s\S]*?\n~~~\s*$/gm;
		let match;
		
		while ((match = tildeBlockRegex.exec(text)) !== null) {
			ranges.push({
				start: match.index,
				end: match.index + match[0].length
			});
		}
		
		return ranges;
	};

	private getBackQuoteRanges = (text: string): IgnoredRange[] => {
		const ranges: IgnoredRange[] = [];
		const backQuoteBlockRegex = /^```[^\n]*\n[\s\S]*?\n```\s*$/gm;
		let match;
		
		while ((match = backQuoteBlockRegex.exec(text)) !== null) {
			ranges.push({
				start: match.index,
				end: match.index + match[0].length
			});
		}

		return ranges;
	};

	private getTitleRanges = (text: string): IgnoredRange[] => {
		const ranges: IgnoredRange[] = [];
		const titleRegex = /^(#{1,6}\s+.*?)$/gm;
		let match;
		
		while ((match = titleRegex.exec(text)) !== null) {
			ranges.push({
				start: match.index,
				end: match.index + match[0].length
			});
		}

		return ranges;
	};

	private shouldIgnoreMatch = (
		position: number, 
		length: number, 
		rule: Rule, 
		allIgnoredRanges: IgnoredRanges
	): boolean => {
		const matchStart = position;
		const matchEnd = position + length;
		
		const rangesToCheck = [];
		
		if (rule.ignoreFrontmatter) {
			rangesToCheck.push(...allIgnoredRanges.frontmatter);
		}
		if (rule.ignoreTildeBlocks) {
			rangesToCheck.push(...allIgnoredRanges.tildeBlocks);
		}
		if (rule.ignoreBackQuoteBlocks) {
			rangesToCheck.push(...allIgnoredRanges.backQuoteBlocks);
		}
		if (rule.ignoreTitles) {
			rangesToCheck.push(...allIgnoredRanges.titles);
		}
		
		for (const range of rangesToCheck) {
			if (matchStart >= range.start && matchEnd <= range.end) {
				return true;
			}
		}
		
		return false;
	};

	private escapeNonTemplates = (pattern: string): string => {
		const parts = pattern.split(/({{[^}]+}})/);
		
		return parts.map(part => {
			if (/^{{[^}]+}}$/.test(part)) {
				return part;
			}

			return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		}).join('');
	};

	private normalizeToRegexFormat = (pattern: string, defaultFlags?: string): string => {
		if (/^\/(.+?)\/([gimsy]*)$/.test(pattern)) {
			return pattern;
		}
		
		const flags = defaultFlags || 'g';
		const normalizedFlags = flags.includes('g') ? flags : flags + 'g';
		return `/${pattern}/${normalizedFlags}`;
	};

	private resolvePlaceholders = (pattern: string, originalRule: Rule): string => {
		if (pattern === MAIN_RULE_PLACEHOLDER) {
			return this.normalizeToRegexFormat(originalRule.regex.pattern, originalRule.regex.flags);
		}

		const isRegexPattern = /^\/(.+?)\/([gimsy]*)$/.test(pattern);
		if (isRegexPattern) {
			return pattern;
		}

		if (originalRule.regex.pattern.includes(FRONTMATTER_STRING_PLACEHOLDER)) {
			const processedPattern = this.escapeNonTemplates(pattern);
			return this.normalizeToRegexFormat(originalRule.regex.pattern.replace(
				FRONTMATTER_STRING_PLACEHOLDER,
				processedPattern
			), originalRule.regex.flags);
		}

		return this.normalizeToRegexFormat(pattern, originalRule.regex.flags);
	};

	private parseRulePattern = (
		pattern: string,
		originalRule: Rule,
		editor: Editor,
		file: TFile
	): RegExp => {
		const resolvedPlaceholders = this.resolvePlaceholders(pattern, originalRule);
		const resolvedPattern = this.resolveDynamicPlaceholders(
			resolvedPlaceholders,
			editor,
			file
		);

		const regexMatch = resolvedPattern.match(/^\/(.+?)\/([gimsy]*)$/);
		console.log('Resolved Pattern:', resolvedPattern);
		console.log('Regex Match:', regexMatch);
		if (regexMatch) {
			try {
				const [, regexPattern, flags] = regexMatch;
				const validFlags = this.validateFlags(flags);
				console.log(regexPattern)
				console.log(flags)
				console.log('--------------------------')
				return new RegExp(regexPattern, validFlags);
			} catch (e) {
				console.log(e)
				console.log('--------------------------')
				return this.createLiteralRegex(resolvedPattern);
			}
		}

		return this.createLiteralRegex(resolvedPattern);
	};

	private validateFlags = (flags: string): string => {
		if (!flags) return 'g';
		
		if (!flags.includes('g')) {
			console.warn("Auto Replacer: Regex flags must include 'g'. Automatically adding 'g' flag.");
			flags += 'g';
		}
		
		return flags;
	};

	private createLiteralRegex = (pattern: string): RegExp => {
		const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		return new RegExp(`\\b${escaped}\\b`, 'g');
	};

	private parseFrontmatterRules = (file: TFile): FrontmatterRuleConfig => {
		const cache = this.plugin.app.metadataCache.getFileCache(file);
		const frontmatter = cache?.frontmatter;
		return frontmatter?.['auto-replacer'] || {};
	};
	
	private mergeRulesWithFrontmatter = (
		globalRules: Rule[], 
		frontmatterConfig: FrontmatterRuleConfig,
		editor: Editor,
		file: TFile
	): ProcessedRule[] => {
		return globalRules.map(rule => {
			const override = frontmatterConfig[rule.key];

			if (override === false || (Array.isArray(override) && override.length === 0)) {
				return { ...rule, enabled: false };
			}

			if (!override || override === true) {
				return { ...rule, enabled: true };
			}
			
			if (Array.isArray(override)) {
				try {
					const patterns = override.map(pattern => this.parseRulePattern(pattern, rule, editor, file));
					return { ...rule, enabled: true, patterns };
				} catch (e) {
					console.warn(`Auto Replacer: Invalid pattern in rule '${rule.key}':`, e);
					return { ...rule, enabled: false };
				}
			}
			
			return { ...rule, enabled: true };
		}).filter(rule => rule.enabled);
	};
}
