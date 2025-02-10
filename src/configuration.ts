import * as vscode from 'vscode';
import { EXTENSION_NAME } from './constant';

export type Configuration = {
    workspacePath: string
    translationsFilePattern: string
    locale: string
}

export const getConfiguration = (context: vscode.ExtensionContext): Configuration => {
    const configResolver = vscode.workspace.getConfiguration(EXTENSION_NAME)

    const result = {
        workspacePath: vscode.workspace.workspaceFolders?.[0].uri.path ?? "",
        translationsFilePattern: `translations/**/*.{yml,yaml}`,
        locale: extractFileExtensionFromLocale(configResolver.get('locale') ?? vscode.env.language)
    }

    return result
}

const extractFileExtensionFromLocale = (locale: string): string => {
    return locale.split('-')[0]
}
