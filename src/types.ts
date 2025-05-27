export interface Occurrence {
	match: RegExpExecArray;
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
