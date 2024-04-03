import * as vscode from 'vscode';
import { CONFIG_CACHE_KEY } from './constants';
import { cache } from './cache';

export type Configuration = {
    workspacePath: string
}

export const getConfiguration = (context: vscode.ExtensionContext): Configuration => {
    const cachePool = cache(context)
    let configuration = cachePool.get<Configuration>(CONFIG_CACHE_KEY)

    if (typeof configuration !== 'undefined') {
        return configuration
    }

    configuration = {
        workspacePath: vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? "",
    }

    cachePool.set(CONFIG_CACHE_KEY, configuration)

    return configuration
}