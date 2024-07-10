import * as vscode from 'vscode'
import { extractNodes } from './parser'
import { Cache, createDataCacheKey } from './cache'

export type Suggestion = {line?: number, text: string}
export type SuggestionMap = Map<string, Suggestion>
export type SuggestionsByFileMap = Map<vscode.Uri, SuggestionMap>

export const loadFromFiles = async (files: vscode.Uri[], cache: Cache): Promise<SuggestionsByFileMap> => {
    const result: SuggestionsByFileMap = new Map()

    for (const fileUri of files) {
        const cachedSuggestionsForFile = cache.get<SuggestionMap>(fileUri.fsPath)

        if (cachedSuggestionsForFile === undefined) {
            await cache.set(createDataCacheKey(fileUri), extractNodes(fileUri.fsPath))
        }

		result.set(fileUri, cache.get(createDataCacheKey(fileUri)) as SuggestionMap)
	}

    return result
}