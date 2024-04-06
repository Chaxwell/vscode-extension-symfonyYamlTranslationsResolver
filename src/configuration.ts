import * as vscode from 'vscode';

export type Configuration = {
    workspacePath: string
    translationsFilePattern: string
}

export const getConfiguration = (context: vscode.ExtensionContext): Configuration => {
    const result = {
        workspacePath: vscode.workspace.workspaceFolders?.[0].uri.path ?? "",
        translationsFilePattern: `translations/**/*.{yml,yaml}`
    }

    return result
}