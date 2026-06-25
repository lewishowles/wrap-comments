// Language-specific comment configuration
const languageConfiguration = {
	javascript: {
		languages: ["javascript", "javascriptreact", "typescript", "typescriptreact"],
		markers: ["//", "/**", "/*", "*"],
		jsDocTags: {
			preserveLine: ["category", "helper", "param", "return", "returns", "signature"],
			preserveSection: ["example"],
			wrapSection: ["description", "note"],
		},
	},
	bash: {
		languages: ["shell", "shellscript", "bash", "sh", "zsh", "properties", "ignore", "dotenv"],
		markers: ["#"],
		jsDocTags: null,
	},
};

/**
 * Get the comment configuration for a given language ID.
 *
 * @param  {string}  languageId
 *     The VS Code language ID.
 */
function getLanguageConfigForId(languageId) {
	for (const config of Object.values(languageConfiguration)) {
		if (config.languages.includes(languageId)) {
			return config;
		}
	}

	return {
		languages: [],
		markers: ["//", "/**", "/*", "*", "#"],
		jsDocTags: {
			preserveLine: ["category", "helper", "param", "return", "returns", "signature"],
			preserveSection: ["example"],
			wrapSection: ["description", "note"],
		},
	};
}

/**
 * Escape special regex characters in a string.
 *
 * @param  {string}  text
 *     The text to escape.
 */
function escapeRegex(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Determine whether the given text represents a comment.
 *
 * @param  {string}  text
 *     The text to check.
 * @param  {object}  config
 *     The language configuration.
 */
function isComment(text, config) {
	const trimmedText = text.trim();

	return config.markers.some((marker) => trimmedText.startsWith(marker));
}

/**
 * Given a string of text, determine the starting comment marker with optional leading space.
 *
 * @param  {string}  text
 *     The text to test.
 * @param  {object}  config
 *     The language configuration.
 */
function getCommentMarker(text, config) {
	const patterns = config.markers.map((marker) => {
		const escaped = escapeRegex(marker);

		return new RegExp(`^\\s*${escaped}`);
	});

	for (const pattern of patterns) {
		const match = text.match(pattern);

		if (match) {
			return match[0];
		}
	}

	return null;
}

/**
 * Get the JSDoc tag at the beginning of a comment line.
 *
 * @param  {string}  line
 *     The comment line to inspect.
 * @param  {object}  config
 *     The language configuration.
 */
function getJsDocTag(line, config) {
	if (!config.jsDocTags) {
		return null;
	}

	const commentMarker = getCommentMarker(line, config);

	if (!commentMarker) {
		return null;
	}

	const content = line.slice(commentMarker.length).trim();
	const match = content.match(/^@([a-zA-Z][\w-]*)\b/);

	return match ? match[1] : null;
}

/**
 * Get the configured behaviour for a JSDoc tag.
 *
 * @param  {string}  tag
 *     The JSDoc tag to classify.
 * @param  {object}  config
 *     The language configuration.
 */
function getJsDocTagBehaviour(tag, config) {
	if (!tag || !config.jsDocTags) {
		return null;
	}

	if (config.jsDocTags.preserveLine.includes(tag)) {
		return "preserve-line";
	}

	if (config.jsDocTags.preserveSection.includes(tag)) {
		return "preserve-section";
	}

	if (config.jsDocTags.wrapSection.includes(tag)) {
		return "wrap-section";
	}

	return "preserve-section";
}

/**
 * Wrap the given text to the provided maximum length, taking into account any
 * indentation and comment marker that exists.
 *
 * JSDoc prose sections are wrapped paragraph by paragraph, while code examples
 * and metadata tags are preserved.
 *
 * @param  {string}  text
 *     The text to wrap.
 * @param  {number}  maxLength
 *     The line-length to wrap the comment to.
 * @param  {object}  config
 *     The language configuration.
 * @param  {Function}  calculateLengthFunction
 *     Function to calculate text length accounting for tabs.
 */
function wrapCommentText(text, maxLength, config, calculateLengthFunction) {
	const textLines = text.split("\n");
	const wrappedLines = [];

	let currentParagraph = [];
	let sectionBehaviour = null;

	/**
	 * Wrap and append the current paragraph, then reset it.
	 */
	function flushParagraph() {
		if (currentParagraph.length === 0) {
			return;
		}

		wrappedLines.push(
			...wrapParagraph(currentParagraph, maxLength, config, calculateLengthFunction),
		);

		currentParagraph = [];
	}

	textLines.forEach((line) => {
		const trimmedLine = line.trim();
		const jsDocTag = getJsDocTag(line, config);
		const jsDocTagBehaviour = getJsDocTagBehaviour(jsDocTag, config);

		// A JSDoc tag begins a new section. Preserve the tag line itself and
		// use its configured behaviour for the following content.
		if (jsDocTag) {
			flushParagraph();
			wrappedLines.push(line);

			sectionBehaviour = jsDocTagBehaviour === "preserve-line" ? null : jsDocTagBehaviour;

			return;
		}

		// Preserve block-comment boundaries without treating them as prose.
		if (trimmedLine === "/**" || trimmedLine === "/*" || trimmedLine === "*/") {
			flushParagraph();
			wrappedLines.push(line);
			sectionBehaviour = null;

			return;
		}

		// Preserve every line in sections such as @example.
		if (sectionBehaviour === "preserve-section") {
			wrappedLines.push(line);

			return;
		}

		// Empty comment lines separate prose paragraphs.
		if (config.markers.includes(trimmedLine)) {
			flushParagraph();
			wrappedLines.push(line);

			return;
		}

		currentParagraph.push(line);
	});

	flushParagraph();

	return wrappedLines.join("\n");
}

/**
 * Wrap the given paragraph.
 *
 * @param  {array}  lines
 *     The text lines to wrap.
 * @param  {number}  width
 *     The line-length to wrap to.
 * @param  {object}  config
 *     The language configuration.
 * @param  {Function}  calculateLengthFunction
 *     Function to calculate text length accounting for tabs.
 */
function wrapParagraph(lines, width, config, calculateLengthFunction) {
	// Our comment marker for this comment. This includes any leading
	// whitespace, so we don't need to account for it separately.
	const commentMarker = getCommentMarker(lines[0], config);

	// If we can't find a comment marker, we can't continue.
	if (!commentMarker) {
		return lines;
	}

	// Determine the length of the comment marker, accounting for tabs.
	const commentMarkerLength = calculateLengthFunction(commentMarker);
	// Remove the comment markers from the lines, ready for wrapping.
	const strippedLines = lines.map((line) => line.slice(commentMarker.length));
	// Create a single paragraph from the lines.
	const paragraph = strippedLines.join(" ").trim();
	// Begin the wrapping process.
	const wrappedLines = [];

	paragraph.split(" ").reduce((currentLine, word, index, array) => {
		if (!word.length) {
			return currentLine;
		}

		// Determine the length of the line if we add this word to it.
		const potentialNewLineLength =
			calculateLengthFunction(currentLine) +
			calculateLengthFunction(word) +
			commentMarkerLength +
			1;

		if (potentialNewLineLength > width) {
			// Finish the current line and create a new one.
			wrappedLines.push(currentLine.trim());

			currentLine = `${word} `;
		} else {
			currentLine += `${word} `;
		}

		// If we're on the last word, add our last line to our collection.
		if (index === array.length - 1) {
			wrappedLines.push(currentLine.trim());
		}

		return currentLine;
	}, "");

	// Re-add the comment markers and preserve indentation
	return wrappedLines.map((line) => `${commentMarker} ${line}`);
}

module.exports = {
	escapeRegex,
	getCommentMarker,
	getJsDocTag,
	getJsDocTagBehaviour,
	getLanguageConfigForId,
	isComment,
	wrapCommentText,
	wrapParagraph,
};
