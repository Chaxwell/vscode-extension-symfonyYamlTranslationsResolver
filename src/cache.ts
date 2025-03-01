import * as vscode from 'vscode'
import * as hashing from 'crypto'
import { DATA_CACHE_KEY } from './constant'
import { JsonStringifyable } from './string'

export type Cache = {
    get: <T extends JsonStringifyable>(key: string) => T | undefined
    set: (key: string, value: JsonStringifyable) => Thenable<void>
    clear: (key: string) => Thenable<void>
    clearAll: () => void
}

export const createCache = (context: vscode.ExtensionContext): Cache => {
    return {
        get: <T>(key: string) => {
            return context.workspaceState.get<T>(key)
        },
        set: (key: string, value: JsonStringifyable) => {
            return context.workspaceState.update(key, value)
        },
        clear: (key: string) => {
            return context.workspaceState.update(key, undefined)
        },
        clearAll: () => {
            context.workspaceState.keys().forEach(key => {
                if (! key.startsWith(DATA_CACHE_KEY)) {
                    return
                }

                context.workspaceState.update(key, undefined)
            })
        }
    }
}

export const createDataCacheKey = (filePath: vscode.Uri): string => {
    return DATA_CACHE_KEY + hashing.createHash('sha1').update(filePath.path).digest('base64');
}
