import { describe, it, expect } from "vitest";
import utilities from "./utilities";

const {
	escapeRegex,
	getCommentMarker,
	getJsDocTag,
	getJsDocTagBehaviour,
	getLanguageConfigForId,
	isComment,
	wrapCommentText,
	wrapParagraph,
} = utilities;

// Mock calculateLength for testing
function mockCalculateLength(text) {
	if (typeof text !== "string") {
		return 0;
	}

	// Assume tab size of 4 for testing
	return text.replace(/\t/g, "	").length;
}

describe("escapeRegex", () => {
	it("does not escape forward slashes", () => {
		expect(escapeRegex("//")).toBe("//");
	});

	it("escapes asterisks", () => {
		expect(escapeRegex("*")).toBe("\\*");
	});

	it("escapes special regex characters", () => {
		expect(escapeRegex(".+?")).toBe("\\.\\+\\?");
	});

	it("does not escape hash", () => {
		expect(escapeRegex("#")).toBe("#");
	});
});

describe("getLanguageConfigForId", () => {
	it("returns JavaScript config for JavaScript", () => {
		const config = getLanguageConfigForId("javascript");

		expect(config.markers).toContain("//");
		expect(config.markers).toContain("*");
		expect(config.jsDocTags.preserveLine).toContain("param");
		expect(config.jsDocTags.preserveSection).toContain("example");
		expect(config.jsDocTags.wrapSection).toContain("description");
	});

	it("returns Bash config for shell", () => {
		const config = getLanguageConfigForId("shell");

		expect(config.markers).toContain("#");
		expect(config.jsDocTags).toBeNull();
	});

	it("returns fallback for unknown language", () => {
		const config = getLanguageConfigForId("unknown");

		expect(config.markers).toContain("//");
		expect(config.markers).toContain("*");
		expect(config.markers).toContain("#");
		expect(config.jsDocTags.preserveLine).toContain("param");
		expect(config.jsDocTags.preserveSection).toContain("example");
		expect(config.jsDocTags.wrapSection).toContain("note");
	});
});

describe("getCommentMarker", () => {
	const jsConfig = {
		languages: ["javascript"],
		markers: ["//", "/**", "/*", "*"],
		jsDocTags: null,
	};

	const bashConfig = {
		languages: ["shell"],
		markers: ["#"],
		jsDocTags: null,
	};

	it("extracts // marker", () => {
		expect(getCommentMarker("// comment", jsConfig)).toBe("//");
	});

	it("extracts * marker", () => {
		expect(getCommentMarker("* comment", jsConfig)).toBe("*");
	});

	it("extracts marker with leading spaces", () => {
		expect(getCommentMarker("  // comment", jsConfig)).toBe("  //");
	});

	it("extracts marker with leading tab", () => {
		expect(getCommentMarker("\t// comment", jsConfig)).toBe("\t//");
	});

	it("extracts # marker for bash", () => {
		expect(getCommentMarker("# comment", bashConfig)).toBe("#");
	});

	it("returns null when marker is not at start of line", () => {
		expect(getCommentMarker("code(); // comment", jsConfig)).toBeNull();
	});

	it("returns null for non-comment text", () => {
		expect(getCommentMarker("regular text", jsConfig)).toBeNull();
	});

	it("extracts a JSDoc opening marker", () => {
		expect(getCommentMarker("/**", jsConfig)).toBe("/**");
	});

	it("extracts a block comment opening marker", () => {
		expect(getCommentMarker("/* comment", jsConfig)).toBe("/*");
	});
});

describe("getJsDocTag", () => {
	const jsConfig = getLanguageConfigForId("javascript");

	it("gets a JSDoc tag from a block comment line", () => {
		expect(getJsDocTag(" * @description", jsConfig)).toBe("description");
	});

	it("gets a JSDoc tag from an indented block comment line", () => {
		expect(getJsDocTag("\t * @example", jsConfig)).toBe("example");
	});

	it("returns null for ordinary comment text", () => {
		expect(getJsDocTag(" * This is ordinary prose.", jsConfig)).toBeNull();
	});

	it("returns null when JSDoc tags are not configured", () => {
		const bashConfig = getLanguageConfigForId("shell");

		expect(getJsDocTag("# @example", bashConfig)).toBeNull();
	});
});

describe("getJsDocTagBehaviour", () => {
	const jsConfig = getLanguageConfigForId("javascript");

	it("classifies preserved tag lines", () => {
		expect(getJsDocTagBehaviour("signature", jsConfig)).toBe("preserve-line");
	});

	it("classifies preserved sections", () => {
		expect(getJsDocTagBehaviour("example", jsConfig)).toBe("preserve-section");
	});

	it("classifies wrapped sections", () => {
		expect(getJsDocTagBehaviour("note", jsConfig)).toBe("wrap-section");
	});

	it("preserves unknown tag sections", () => {
		expect(getJsDocTagBehaviour("customTag", jsConfig)).toBe("preserve-section");
	});

	it("returns null without a tag", () => {
		expect(getJsDocTagBehaviour(null, jsConfig)).toBeNull();
	});
});

describe("isComment", () => {
	const jsConfig = {
		languages: ["javascript"],
		markers: ["//", "/**", "/*", "*"],
		jsDocTags: null,
	};

	const bashConfig = {
		languages: ["shell"],
		markers: ["#"],
		jsDocTags: null,
	};

	it("identifies JavaScript single-line comments", () => {
		expect(isComment("// comment", jsConfig)).toBe(true);
	});

	it("identifies JSDoc tag lines as comments", () => {
		expect(isComment("// @param test", jsConfig)).toBe(true);
	});

	it("identifies a JSDoc opening marker as a comment", () => {
		const config = getLanguageConfigForId("javascript");

		expect(isComment("/**", config)).toBe(true);
	});

	it("identifies a block comment opening marker as a comment", () => {
		const config = getLanguageConfigForId("javascript");

		expect(isComment("/*", config)).toBe(true);
	});

	it("identifies a block comment closing marker as a comment", () => {
		expect(isComment(" */", jsConfig)).toBe(true);
	});

	it("identifies bash comments", () => {
		expect(isComment("# comment", bashConfig)).toBe(true);
	});
});

describe("wrapCommentText", () => {
	const jsConfig = {
		languages: ["javascript"],
		markers: ["//"],
		jsDocTags: null,
	};

	it("wraps text to the specified maximum width", () => {
		const input = "// This is a very long comment that should be wrapped properly";
		const result = wrapCommentText(input, 40, jsConfig, mockCalculateLength);

		result.split("\n").forEach((line) => {
			expect(mockCalculateLength(line)).toBeLessThanOrEqual(40);
		});
	});

	it("preserves paragraph breaks", () => {
		const input = [
			"// First paragraph that should wrap",
			"//",
			"// Second paragraph that should also wrap",
		].join("\n");

		const result = wrapCommentText(input, 40, jsConfig, mockCalculateLength);

		expect(result).toContain("\n//\n");
	});

	it("preserves indentation when wrapping", () => {
		const input = "\t// This is a long comment that needs wrapping";
		const result = wrapCommentText(input, 40, jsConfig, mockCalculateLength);

		result.split("\n").forEach((line) => {
			expect(line.startsWith("\t//")).toBe(true);
		});
	});

	it("leaves short comments unchanged", () => {
		const input = "// Short comment";
		const result = wrapCommentText(input, 80, jsConfig, mockCalculateLength);

		expect(result).toBe(input);
	});

	it("preserves metadata tags and wraps description and note paragraphs", () => {
		const jsDocConfig = getLanguageConfigForId("javascript");

		const input = [
			"/**",
			" * @helper validateForm",
			" * @category Form",
			" * @signature validateForm(fields: object, formData: object)",
			" * @description",
			" * Validate multiple fields at once, delegating to validateField for each field's rules.",
			" *",
			" * Cross-field rules work naturally because the full form data is passed through.",
			" *",
			" * @note",
			" * Returns a result containing valid, validated, and results properties for the form.",
			" */",
		].join("\n");

		const result = wrapCommentText(input, 60, jsDocConfig, mockCalculateLength);

		expect(result).toContain(" * @helper validateForm");
		expect(result).toContain(" * @category Form");
		expect(result).toContain(" * @signature validateForm(fields: object, formData: object)");
		expect(result).toContain(" * @description");
		expect(result).toContain(" * @note");
		expect(result).toContain("\n *\n");

		result.split("\n").forEach((line) => {
			if (line.includes("@signature")) {
				return;
			}

			expect(mockCalculateLength(line)).toBeLessThanOrEqual(60);
		});
	});

	it("wraps JSDoc prose paragraphs independently", () => {
		const jsDocConfig = getLanguageConfigForId("javascript");
		const input = [
			"/**",
			" * @description",
			" * The first paragraph contains enough text that it needs to wrap onto more than one line.",
			" *",
			" * The second paragraph must remain separate from the first paragraph when it is wrapped.",
			" */",
		].join("\n");
		const result = wrapCommentText(input, 50, jsDocConfig, mockCalculateLength);
		const paragraphs = result.split("\n *\n");

		expect(paragraphs).toHaveLength(2);
		expect(paragraphs[0]).toContain("@description");
		expect(paragraphs[0]).toContain("first paragraph");
		expect(paragraphs[1]).toContain("second paragraph");
	});

	it("preserves every line in a JSDoc example section", () => {
		const jsDocConfig = getLanguageConfigForId("javascript");
		const example = [
			" * @example",
			" * validateForm({",
			' * \tusername: [{ rule: "required", message: "Enter a username" }],',
			" * \temail: [",
			' * \t\t{ rule: "required", message: "Enter your email" },',
			' * \t\t(value) => value.includes("@") || "Enter a valid email address",',
			" * \t],",
			' * }, { username: "jack", email: "not-an-email" });',
			" * // {",
			" * //   valid: false,",
			" * // }",
		].join("\n");
		const input = [
			"/**",
			" * @description",
			" * A description before the example that should be wrapped normally.",
			" *",
			example,
			" */",
		].join("\n");
		const result = wrapCommentText(input, 40, jsDocConfig, mockCalculateLength);

		expect(result).toContain(example);
	});

	it("ends example preservation when another JSDoc tag begins", () => {
		const jsDocConfig = getLanguageConfigForId("javascript");
		const input = [
			"/**",
			" * @example",
			" * const result = validateForm(fields, formData);",
			" * @note",
			" * This note contains enough prose that it should wrap onto multiple comment lines.",
			" */",
		].join("\n");
		const result = wrapCommentText(input, 45, jsDocConfig, mockCalculateLength);
		const resultLines = result.split("\n");
		const noteIndex = resultLines.indexOf(" * @note");
		const noteLines = resultLines.slice(noteIndex + 1, -1);

		expect(result).toContain(" * const result = validateForm(fields, formData);");
		expect(noteIndex).toBeGreaterThan(-1);
		expect(noteLines.length).toBeGreaterThan(1);

		noteLines.forEach((line) => {
			expect(mockCalculateLength(line)).toBeLessThanOrEqual(45);
		});
	});

	it("preserves a JavaScript block comment closing marker", () => {
		const blockCommentConfig = {
			languages: ["javascript"],
			markers: ["//", "/**", "/*", "*"],
			jsDocTags: null,
		};

		const input = [
			"\t * Whether the dialog should open itself immediately. This is true by",
			"\t * default for use with `modal-controller`, but will likely need to be set",
			"\t * to false if used directly.",
			"\t */",
		].join("\n");

		const expected = [
			"\t * Whether the dialog should open itself immediately. This is true by default",
			"\t * for use with `modal-controller`, but will likely need to be set to false if",
			"\t * used directly.",
			"\t */",
		].join("\n");

		const result = wrapCommentText(input, 80, blockCommentConfig, mockCalculateLength);

		expect(result).toBe(expected);
	});

	it("preserves a block comment closing marker for fallback languages", () => {
		const fallbackConfig = getLanguageConfigForId("unknown");
		const input = [
			"\t * Whether the dialog should open itself immediately. This is true by",
			"\t * default for use with `modal-controller`, but will likely need to be set",
			"\t * to false if used directly.",
			"\t */",
		].join("\n");
		const expected = [
			"\t * Whether the dialog should open itself immediately. This is true by default",
			"\t * for use with `modal-controller`, but will likely need to be set to false if",
			"\t * used directly.",
			"\t */",
		].join("\n");
		const result = wrapCommentText(input, 80, fallbackConfig, mockCalculateLength);

		expect(result).toBe(expected);
	});
});

describe("wrapParagraph", () => {
	const jsConfig = {
		languages: ["javascript"],
		markers: ["//"],
		jsDocTags: null,
	};

	it("wraps paragraph preserving marker", () => {
		const lines = ["// This is a very long comment that needs wrapping"];
		const result = wrapParagraph(lines, 40, jsConfig, mockCalculateLength);

		result.forEach((line) => {
			expect(line.startsWith("//")).toBe(true);
		});
	});
});
