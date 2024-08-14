const globals = require("globals");
const pluginJs = require("@eslint/js");
const stylistic = require("./config/eslint/stylistic.cjs");

module.exports = [
	{
		ignores: ["**/dist/*"],
	},
	{
		files: ["**/*.{js,vue}"],
	},
	{
		languageOptions: {
			globals: globals.browser,
			sourceType: "commonjs",
		},
	},
	pluginJs.configs.recommended,
	stylistic,
];
