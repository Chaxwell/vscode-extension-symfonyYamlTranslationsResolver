import * as vscode from 'vscode'
import { extractNodes } from './parser'
import { Cache, createDataCacheKey } from './cache'
import { Configuration } from './configuration'
import { mapParser, mapStringifier } from './string'

export type Suggestion = {line?: number, text: string}
export type SuggestionMap = Map<string, Suggestion>
export type SuggestionsByFileMap = Map<vscode.Uri, SuggestionMap>

export const loadFromFiles = async (files: vscode.Uri[], cache: Cache, config: Configuration): Promise<SuggestionsByFileMap> => {
    const result: SuggestionsByFileMap = new Map()

    for (const fileUri of sortWithFilesFromLocaleFirst(files, config)) {
        const nodesAsString = cache.get<string>(createDataCacheKey(fileUri))
        let nodes: SuggestionMap;

        if (nodesAsString === undefined) {
            nodes = extractNodes(fileUri.fsPath)
            await cache.set(createDataCacheKey(fileUri), JSON.stringify(nodes, mapStringifier))
        } else {
            nodes = JSON.parse(nodesAsString, mapParser)
        }

		result.set(fileUri, nodes)
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
