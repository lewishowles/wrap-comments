const stylistic = require("@stylistic/eslint-plugin");

module.exports = {
	plugins: {
		"@stylistic": stylistic,
	},
	rules: {
		"@stylistic/array-bracket-newline": ["error", { multiline: true }],
		"@stylistic/array-bracket-spacing": ["error", "never"],
		"@stylistic/array-element-newline": ["error", { multiline: true, consistent: true }],
		"@stylistic/comma-dangle": ["error", "always-multiline"],
		"@stylistic/comma-style": ["error", "last"],
		"@stylistic/indent": ["error", "tab"],
		"@stylistic/no-confusing-arrow": "error",
		"@stylistic/no-mixed-spaces-and-tabs": "error",
		"@stylistic/no-trailing-spaces": "error",
		"@stylistic/object-curly-newline": [
			"error",
			{
				multiline: true,
				minProperties: 4,
				consistent: true,
			},
		],
		"@stylistic/object-curly-spacing": ["error", "always"],
		"@stylistic/object-property-newline": ["error", { allowAllPropertiesOnSameLine: true }],
		"@stylistic/padded-blocks": ["error", "never"],
		"@stylistic/padding-line-between-statements": [
			"error",
			{ blankLine: "always", prev: "const", next: "let" },
			{ blankLine: "always", prev: "let", next: "const" },
			{ blankLine: "always", prev: "*", next: "break" },
			{ blankLine: "always", prev: ["const", "let"], next: "*" },
			{ blankLine: "always", prev: "*", next: "return" },
			{ blankLine: "any", prev: "const", next: "const" },
			{ blankLine: "any", prev: "let", next: "let" },
		],
		"@stylistic/semi": ["error", "always"],
		"@stylistic/quote-props": ["error", "consistent-as-needed"],
		"@stylistic/quotes": ["error", "double"],
	},
};
