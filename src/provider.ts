import * as vscode from 'vscode';
import { SuggestionsByFileMap } from './suggestion-loader';
import { Configuration } from './configuration';

export const documentLinkProvider = (config: Configuration, suggestionsByFile: SuggestionsByFileMap): vscode.DocumentLinkProvider => {
    return {
        provideDocumentLinks(document, token) {
            const result: vscode.DocumentLink[] = []
            const regex = new RegExp(/'([\w\-\.]+?)'|"([\w\-\.]+?)"/, 'gi')

            for (let n = 0; n < document.lineCount; n++) {
                const line = document.lineAt(n)
                const matches = Array.from(line.text.matchAll(regex))

                if (matches.length === 0) {
                    continue
                }

                matches.forEach(matches => {
                    const theMatch = matches?.at(1) ?? matches?.at(2) ?? ""

                    if (theMatch === "") {
                        return
                    }

                    for (const [file, suggestions] of suggestionsByFile) {
                        const suggestion = suggestions.get(theMatch)

                        if (suggestion === undefined) {
                            continue
                        }

                        const startPosition = line.text.lastIndexOf(theMatch)
                        const endPosition = startPosition + theMatch.length
                        const range = new vscode.Range(
                            new vscode.Position(n, startPosition),
                            new vscode.Position(n, endPosition)
                        )
                        const link = new vscode.DocumentLink(
                            range,
                            file.with({ fragment: `L${suggestion.line}, 1` })
                        );

                        const fileName = file.fsPath.slice(config.workspacePath.length + 1)
                        link.tooltip = `${suggestion.text} <${fileName}>`

                        result.push(link);
                    }
                })
            }

            return result
        },
        resolveDocumentLink(link, token) {
            return link
        },
    }
}

export const completionProvider = (config: Configuration, suggestionsByFile: SuggestionsByFileMap): vscode.CompletionItemProvider => {
    return {
        provideCompletionItems: (document, position, token, context) => {
            const range = document.getWordRangeAtPosition(position)
            const input = document.getText(range)

            if (input.length < 2) {
                return []
            }

            const result = [];
            for (const [file, suggestions] of suggestionsByFile) {
                const fileName = file.fsPath.slice(config.workspacePath.length + 1)

                result.push(
                    ...Array
                    .from(suggestions.entries())
                    .filter(([key, value]) => key.startsWith(input))
                    .map(([key, value]) => {
                        const result = new vscode.CompletionItem(
                            {
                                label: key,
                                description: value.text,
                            },
                            vscode.CompletionItemKind.Text
                        )

                        const posStart = new vscode.Position(position.line, range?.start.character ?? 1)
                        result.range = new vscode.Range(posStart, position)
                        result.insertText = key

                        const documentation = new vscode.MarkdownString(`${value.text}<br><br>*${fileName}*`);
                        documentation.supportHtml = true

                        result.documentation = documentation

                        return result
                    })
                )
            }

            return result
        },
        resolveCompletionItem: (item, token) => {
            return new Promise((resolve) => {
                resolve(item)
                return new vscode.Hover((item.label as vscode.CompletionItemLabel).description ?? "")
            })
        },
    }
}
