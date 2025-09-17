export const MAIN_RULE_PLACEHOLDER = "{{mainRule}}";
export const FRONTMATTER_STRING_PLACEHOLDER = "{{frontmatterString}}";

export interface Occurrence {
	match: RegExpMatchArray;
	original: string;
	normalized: string;
}

export interface Match {
	occurrence: Occurrence;
	startCaret: number;
	endCaret: number;
	result?: string;
}

export type MatchGroup = {
	[key: string]: Match[];
};

export interface Rule {
	name: string;
	key: string;
	description?: string;
	regex: {
		pattern: string;
		flags: string;
	};
	ignoreFrontmatter?: boolean;
	ignoreTildeBlocks?: boolean;
	ignoreBackQuoteBlocks?: boolean;
	ignoreTitles?: boolean;
	/**
	 * @type {transform}
	 * @param {match} Match
	 * @param {editor} Editor
	 * @param {file} TFile
	 * @description The transformation code that will be applied to the matched text.
	 * its a string that can contain JavaScript code that will be parsed and executed.
	 * the function receives three parameters:
	 * - match: The matched text.
	 * - editor: The editor instance where the match was found.
	 * - file: The file where the match was found.
	 * @example
	 * ```javascript
	 * function transform(match, editor, file) {
	 *   return match.toUpperCase();
	 * }
	 * ```
	 */
	transform: string;
}

export interface IgnoredRange {
	start: number;
	end: number;
}

export interface IgnoredRanges {
	frontmatter: IgnoredRange[];
	tildeBlocks: IgnoredRange[];
	backQuoteBlocks: IgnoredRange[];
	titles: IgnoredRange[];
}

export interface FrontmatterRuleConfig {
	[ruleKey: string]: string[] | boolean;
}

export interface ProcessedRule extends Rule {
	patterns?: RegExp[];        
	frontmatterStrings?: string[];  
	enabled?: boolean;         
}
