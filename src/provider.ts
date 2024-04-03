import * as vscode from 'vscode';
import { Suggestion, SuggestionMap, extractData } from './data-fetcher';
import { Configuration, getConfiguration } from './configuration';
import { cache } from './cache';

export const documentLinkProvider = (config: Configuration, suggestions: SuggestionMap): vscode.DocumentLinkProvider => {
    return {
        provideDocumentLinks(document, token) {
            const result: vscode.DocumentLink[] = []

            for (let n = 0; n < document.lineCount; n++) {
                const line = document.lineAt(n)
                const matches = line.text.match(/(.*?)['"](.*?)['"]/)
                const charactersTillMatch = matches?.at(1) ?? ""
                const match = matches?.at(2) ?? ""

                if (match === "") {
                    continue
                }

                if (! suggestions.has(match)) {
                    continue
                }

                const suggestion = suggestions.get(match) as Suggestion
                const range = new vscode.Range(
                    new vscode.Position(line.lineNumber, charactersTillMatch.length + 1),
                    new vscode.Position(line.lineNumber, charactersTillMatch.length + match.length + 1)
                )
                const uri = vscode
                    .Uri
                    .file(
                        `${config.workspacePath}/translations/messages.fr.yaml`
                    )
                    .with({ fragment: `L${suggestion.line}, 1` })

                const link = new vscode.DocumentLink(
                    range,
                    uri
                );
                link.tooltip = suggestion.text

                result.push(link);
            }

            return result
        },
        resolveDocumentLink(link, token) {
            return link
        },
    }
}

export const completionProvider = (suggestions: SuggestionMap): vscode.CompletionItemProvider => {
    return {
        provideCompletionItems: (document, position, token, context) => {
            const range = document.lineAt(position).range
            let input = document.getText(range)
            const matches = input.match(/(.*?')(.+?)['"]/);
            const charactersTillMatch = matches?.at(1) ?? ""
            const match = matches?.at(2) ?? ""

            if (match === "") {
                return []
            }

            return Array
                .from(suggestions.entries())
                .filter(([key, value]) => key.startsWith(match))
                .map(([key, value]) => {
                    const result = new vscode.CompletionItem(
                        {
                            label: key,
                            description: value.text,
                        },
                        vscode.CompletionItemKind.Text
                    )

                    const posStart = new vscode.Position(position.line, charactersTillMatch.length)
                    result.range = new vscode.Range(posStart, position)
                    result.insertText = key
                    result.documentation = value.text

                    return result
                })
        },
        resolveCompletionItem: (item, token) => {
            return new Promise((resolve) => {
                resolve(item)
                return new vscode.Hover((item.label as vscode.CompletionItemLabel).description ?? "")
            })
        },
    }
}
