import * as vscode from 'vscode'
import * as cp from 'child_process'
import { Cache, createDataCacheKey } from './cache'

export type Suggestion = {line: number, text: string}
export type SuggestionMap = Map<string, Suggestion>
export type SuggestionsByFileMap = Map<vscode.Uri, SuggestionMap>
type SuggestionEntries = [string, Suggestion][]

const createKeys = (k: string, v: string|object): Map<string, {line: number, text: string}> => {
    if (typeof v === 'object') {
        const result: Map<string, {line: number, text: string}> = new Map()

        for (const [k1, v1] of Object.entries(v)) {
            const map = createKeys(k1, v1)

            map.forEach((a, b) => {
                result.set(`${k}.${b}`, a);
            })
        }

        return result
    }

    return new Map().set(k, extractTextAndLine(v));
}
const extractTextAndLine = (extractionSet: string): {line: number, text: string} => {
    const match = extractionSet.match(/(.*?)-_\+\[(\d+)\]\+_-/)
    const text = match?.at(1) ?? ""
    const line = Number(match?.at(2) ?? 0)

    return {line, text}
}

export const extractData = (cache: Cache, filePath: vscode.Uri): SuggestionMap => {
    const cacheKey = createDataCacheKey(filePath)
    const data = cache.get<SuggestionEntries>(cacheKey)

    if (typeof data !== 'undefined') {
        return new Map(data)
    }

    const yq = cp.execSync(`yq -o=json --expression="(.. | select(tag == \\"!!str\\")) |= . + \\"-_+[\\" + line + \\"]+_-\\"" ${filePath.fsPath}`)
    const json: {[key: string]: any} = JSON.parse(yq.toString()) ?? {}

    let result: SuggestionMap = new Map()
    for (const [k, v] of Object.entries<object|string>(json)) {
        result = new Map([...result, ...createKeys(k, v)])
    }

    cache.set(cacheKey, Array.from(result.entries()))

    return result
}