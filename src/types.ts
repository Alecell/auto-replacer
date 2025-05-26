import { Editor, TFile } from "obsidian";

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
	regex: {
		pattern: string;
		flags: string;
	};
	transform: (match: Occurrence, editor: Editor, file: TFile) => string;
}
