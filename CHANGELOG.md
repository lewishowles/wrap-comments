# Changelog

## 0.0.1 - 2024-08-14

The initial version of the plugin wraps comments to 80 characters in length.

When activated on a comment block, it extends the selection to include the entire comment, excluding any @param or @return lines, and then re-flows the resulting lines.

The plugin currently works with single-line style (`//`) and multi-line style (` * `) Javascript comments.

Any gaps in the comment—that is, lines that contain just a comment marker and no text—are treated as paragraph delimiters, and each paragraph is wrapped separately.
