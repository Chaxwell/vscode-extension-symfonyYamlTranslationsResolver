import * as vscode from 'vscode';

export type Cache = ReturnType<typeof cache>

export const cache = (context: vscode.ExtensionContext) => {
    return {
        get: <T>(key: string) => {
            return context.globalState.get<T>(key)
        },
        set: (key: string, value: any) => {
            return context.globalState.update(key, value)
        },
        clear: (key: string) => {
            return context.globalState.update(key, undefined)
        }
    }
}