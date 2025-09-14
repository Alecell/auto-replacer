import { Occurrence } from "src/types";

export const mockOccurrence: Occurrence = {
	match: new RegExp("example", "g").exec(
		"This is an example text"
	) as RegExpExecArray,
	original: "example",
	normalized: "example",
};
