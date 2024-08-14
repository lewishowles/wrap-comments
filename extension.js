const vscode = require("vscode");
const wrapComment = require("./src/wrap-comment");

function activate(context) {
	const disposable = vscode.commands.registerCommand("wrap-comments.wrapComment", wrapComment);

	context.subscriptions.push(disposable);
}

module.exports = {
	activate,
};
