import * as vscode from 'vscode'
import { loadExtension, reloadExtension } from './extension-loader'
import { EXTENSION_NAME } from './constant';

export async function activate(context: vscode.ExtensionContext) {
	loadExtension(context)

    vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
        if (! e.affectsConfiguration(EXTENSION_NAME)) {
            return;
        }

		reloadExtension(context)
    });
}

// This method is called when your extension is deactivated
export function deactivate() {
	// empty
}
