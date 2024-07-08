import * as vscode from 'vscode'
import { extractNodes } from './parser'

export type Suggestion = {line?: number, text: string}
export type SuggestionMap = Map<string, Suggestion>
export type SuggestionsByFileMap = Map<vscode.Uri, SuggestionMap>

export const loadFromFiles = (files: vscode.Uri[]): SuggestionsByFileMap => {
    const result: SuggestionsByFileMap = new Map()

    // TODO Add cache
    for (const fileUri of files) {
		result.set(fileUri, extractNodes(fileUri.fsPath))
	}

    return result
}