import { EditorPosition, Editor } from "obsidian";

export const mockEditor: Partial<Editor> = {
	getValue: () => "Texto de exemplo no editor.",
	setValue: (text: string) => {},
	getSelection: () => "seleção",
	replaceSelection: (replacement: string) => {},
	getCursor: () => ({ line: 0, ch: 5 } as EditorPosition),
	setCursor: (pos: EditorPosition) => {},
	getLine: (line: number) => `Conteúdo da linha ${line}`,
	lastLine: () => 5,
	lineCount: () => 6,
	somethingSelected: () => true,
	getRange: (from: EditorPosition, to: EditorPosition) =>
		"Texto entre posições",
	replaceRange: (
		replacement: string,
		from: EditorPosition,
		to?: EditorPosition
	) => {},
	posToOffset: (pos: EditorPosition) => pos.line * 100 + pos.ch,
	offsetToPos: (offset: number) => ({
		line: Math.floor(offset / 100),
		ch: offset % 100,
	}),
	getScrollInfo: () => ({ top: 0, left: 0, height: 500, width: 300 }),
	scrollTo: (x: number, y: number) => {},
	transaction: (spec: {
		changes: { from: EditorPosition; to: EditorPosition; text: string }[];
	}) => {},
} as const;
