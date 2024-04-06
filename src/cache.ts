import * as vscode from 'vscode'
import * as hashing from 'crypto'
import { DATA_CACHE_KEY } from './constants'

export type Cache = ReturnType<typeof createCache>

export const createCache = (context: vscode.ExtensionContext) => {
    return {
        get: <T>(key: string) => {
            return context.globalState.get<T>(key)
        },
        set: (key: string, value: any) => {
            return context.globalState.update(key, value)
        },
        clear: (key: string) => {
            return context.globalState.update(key, undefined)
        },
        clearAll: () => {
            context.globalState.keys().forEach(key => {
                context.globalState.update(key, undefined)
            })
        }
    }
}

export const createDataCacheKey = (filePath: vscode.Uri): string => {
    return DATA_CACHE_KEY + hashing.createHash('sha1').update(filePath.path).digest('base64');
}