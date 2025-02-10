import * as vscode from 'vscode';
import { EXTENSION_NAME } from './constant';

export type Configuration = {
    workspacePath: string
    translationsFilePattern: string
    locale: string
    enableAutocomplete: boolean
    languageFilters: {
        autocomplete: string[],
        links: string[]
    }
}

export const getConfiguration = (context: vscode.ExtensionContext): Configuration => {
    const configResolver = vscode.workspace.getConfiguration(EXTENSION_NAME)

    const result: Configuration = {
        workspacePath: vscode.workspace.workspaceFolders?.[0].uri.path ?? "",
        translationsFilePattern: `translations/**/*.{yml,yaml}`,
        locale: extractFileExtensionFromLocale(configResolver.get('locale') ?? vscode.env.language),
        enableAutocomplete: new Boolean(configResolver.get('enableAutocomplete') ?? true).valueOf(),
        languageFilters: {
            autocomplete: configResolver.get('languageFilters.autocomplete') ?? [],
            links: configResolver.get('languageFilters.links') ?? []
        }
    }

    return result
}

const extractFileExtensionFromLocale = (locale: string): string => {
    return locale.split('-')[0]
}
