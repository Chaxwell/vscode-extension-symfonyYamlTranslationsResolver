import * as vscode from 'vscode';

export type Configuration = {
    workspacePath: string
    translationsFilePattern: vscode.GlobPattern
}

export const getConfiguration = (context: vscode.ExtensionContext): Configuration => {
    const result = {
        workspacePath: vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? "",
        translationsFilePattern: `translations/**/*.{yml,yaml}`
    }

    return result
}