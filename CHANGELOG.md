# Changelog

## 1.0.0 - 2026-06-25

### Features

- Add support for structured JSDoc sections.
- Preserve `@helper`, `@category`, `@signature`, `@param`, `@return`, and `@returns` tag lines.
- Wrap prose beneath `@description` and `@note` one paragraph at a time.
- Preserve all content beneath `@example`, including indentation, long lines, and commented output.
- Preserve additional indentation when wrapping parameter and return descriptions.
- Include JavaScript and JSDoc block-comment opening markers when detecting the full comment range.

### Fixes

- Prevent structured JSDoc tags and examples from being merged into ordinary comment paragraphs.
- Prevent block-comment boundaries from being altered during wrapping.

## 0.2.1 - 2026-05-18

### Fixes

- Fix an issue where Javascript comment block end tags (\*/) were being incorrectly wrapped.

## 0.2.0 - 2026-05-01

### Features

- Add support for Bash comments
- Add new `wrapComments.lineLength` preference.

## 0.1.0 - 2024-08-14

The initial version of the plugin wraps comments to 80 characters in length.

When activated on a comment block, it extends the selection to include the entire comment, excluding any @param or @return lines, and then re-flows the resulting lines.

The plugin currently works with single-line style (`//`) and multi-line style (`*`) Javascript comments.

Any gaps in the comment—that is, lines that contain just a comment marker and no text—are treated as paragraph delimiters, and each paragraph is wrapped separately.
