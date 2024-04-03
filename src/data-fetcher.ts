import * as vscode from 'vscode'
import * as cp from 'child_process'
import { Cache } from './cache'
import { DATA_CACHE_KEY } from './constants'

const l = console.log
// const yq = cp.execSync(`yq -o=json --expression="(.. | select(tag == \\"!!str\\")) |= . + \\"-_+[\\" + line + \\"]+_-\\"" ./resources/sample.yaml`)
// const json = JSON.parse(yq.toString())

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

export type Suggestion = {line: number, text: string}
export type SuggestionMap = Map<string, Suggestion>
type SuggestionEntries = [string, Suggestion][]

export const extractData = (cache: Cache, filePath: vscode.Uri): SuggestionMap => {
    const data = cache.get<SuggestionEntries>(DATA_CACHE_KEY)

    if (typeof data !== 'undefined') {
        return new Map<string, Suggestion>(data)
    }

    const yq = cp.execSync(`yq -o=json --expression="(.. | select(tag == \\"!!str\\")) |= . + \\"-_+[\\" + line + \\"]+_-\\"" ${filePath.fsPath}`)
    // const yq = cp.execSync(`yq -o=json ${filePath.fsPath}`)
    const json = JSON.parse(yq.toString())

    let result: Map<string, Suggestion> = new Map()
    for (const [k, v] of Object.entries<object|string>(json)) {
        result = new Map([...result, ...createKeys(k, v)])
    }

    cache.set(DATA_CACHE_KEY, Array.from(result.entries()))

    return result
}