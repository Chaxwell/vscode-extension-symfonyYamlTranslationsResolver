import * as vscode from 'vscode'
import { extractNodes } from './parser'
import { Cache, createDataCacheKey } from './cache'
import { Configuration } from './configuration'

export type Suggestion = {line?: number, text: string}
export type SuggestionMap = Map<string, Suggestion>
export type SuggestionsByFileMap = Map<vscode.Uri, SuggestionMap>

export const loadFromFiles = async (files: vscode.Uri[], cache: Cache, config: Configuration): Promise<SuggestionsByFileMap> => {
    const result: SuggestionsByFileMap = new Map()

    for (const fileUri of sortWithFilesFromLocaleFirst(files, config)) {
        const cachedSuggestionsForFile = cache.get<SuggestionMap>(fileUri.fsPath)

        if (cachedSuggestionsForFile === undefined) {
            await cache.set(createDataCacheKey(fileUri), extractNodes(fileUri.fsPath))
        }

		result.set(fileUri, cache.get(createDataCacheKey(fileUri)) as SuggestionMap)
	}

    return result
}

const sortWithFilesFromLocaleFirst = (files: vscode.Uri[], config: Configuration): vscode.Uri[] => {
    const result = []

    for (const file of files) {
        const matches = file.fsPath.match(/\.([a-z]+)\./i)

        if (matches?.at(1) === config.locale) {
            result.unshift(file)
        } else {
            result.push(file)
        }
    }

    return result
}
