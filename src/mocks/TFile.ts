import { TFile } from "obsidian";

export const mockTFile: Partial<TFile> = {
	name: "example.md",
	path: "notes/example.md",
	basename: "example",
	extension: "md",
	stat: {
		ctime: 1620000000000,
		mtime: 1620000000000,
		size: 2048,
	},
};
