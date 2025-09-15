import { Editor, EditorChange, TFile } from "obsidian";
import { normalize } from "../utils/normalize";
import AutoReplacer from "src/main";
import { 
	Rule, 
	MatchGroup, 
	Match, 
	IgnoredRange, 
	IgnoredRanges, 
	MAIN_RULE_PLACEHOLDER, 
	FrontmatterRuleConfig, 
	ProcessedRule 
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
console.log(frontmatterConfig)
		for (const rule of processedRules) {
			const matches: Match[] = [];
			const ignoredRanges = this.calculateIgnoredRanges(text, rule);
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

					if (this.isInIgnoredRange(startCaret, matchLength, ignoredRanges)) {
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
			// TODO: Pra evitar infinite loops, talvez é legal colocar um dynamic placeholder que representa a regex dinamica do frontmatter, ai a pessoa pode fazer uma regex tipo /(?<!\*\*|\/)\b{{frontmatterRegex}}\b(?!\*\*|\/)/g, assim damos a dinamicidade do frontmatter mas evitamos ter q colocar no frontmatter a rule de exclusao do que ela tem q evitar. isso faz ainda mais sentido pensando que regra e a regex andam de maos dadas
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

	private calculateIgnoredRanges = (text: string, rule: Rule): IgnoredRanges => {
		return {
			frontmatter: rule.ignoreFrontmatter ? this.getFrontmatterRanges(text) : [],
			tildeBlocks: rule.ignoreTildeBlocks ? this.getTildeBlockRanges(text) : [],
			backQuoteBlocks: rule.ignoreBackQuoteBlocks ? this.getBackQuoteRanges(text) : [],
			titles: rule.ignoreTitles ? this.getTitleRanges(text) : []
		};
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
	// TODO: No caso agora seria interessante permitir rules sem regex que se baseiam apenas nos parametros da pagina e nao na config global. 
	private isInIgnoredRange = (position: number, length: number, ignoredRanges: IgnoredRanges): boolean => {
		const matchStart = position;
		const matchEnd = position + length;
		
		const allRanges = [
			...ignoredRanges.frontmatter,
			...ignoredRanges.tildeBlocks,
			...ignoredRanges.backQuoteBlocks,
			...ignoredRanges.titles
		];
		
		for (const range of allRanges) {
			if (matchStart >= range.start && matchEnd <= range.end) {
				return true;
			}
		}
		
		return false;
	};

	private parseRulePattern = (pattern: string, originalRule: Rule, editor: Editor, file: TFile): RegExp => {
		if (pattern === MAIN_RULE_PLACEHOLDER) {
			return new RegExp(originalRule.regex.pattern, originalRule.regex.flags);
		}
		
		const resolvedPattern = this.resolveDynamicPlaceholders(pattern, editor, file);
		
		const regexMatch = resolvedPattern.match(/^\/(.+?)\/([gimsy]*)$/);
		if (regexMatch) {
			try {
				const [, regexPattern, flags] = regexMatch;
				const validFlags = this.validateFlags(flags);
				return new RegExp(regexPattern, validFlags);
			} catch (e) {
				return this.createLiteralRegex(resolvedPattern);
				// TODO: nao concordo com isso aqui, se parece regex mas n vai, n é pra funcionar, duplo padrao gera confusao, é esquisito pra UX, confunde o usuario, mas nao sei, talvez isso seja util pra lidar com casos que a pessoa tenha um path tipo sim/nao/ali/aqui
			}
		}
		
		return this.createLiteralRegex(resolvedPattern);
	};

	private validateFlags = (flags: string): string => {
		if (!flags) return 'g';
		
		if (!flags.includes('g')) {
			throw new Error("Regex flags must include 'g'");
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
