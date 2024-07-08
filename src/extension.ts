import * as vscode from 'vscode'
import { loadExtension } from './extension-loader'

export async function activate(context: vscode.ExtensionContext) {
	loadExtension(context)
}

// This method is called when your extension is deactivated
export function deactivate() {}
