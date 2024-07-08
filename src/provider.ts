import * as vscode from 'vscode';
import { Suggestion, SuggestionsByFileMap } from './suggestion-loader';
import { Configuration } from './configuration';

export const documentLinkProvider = (config: Configuration, suggestionsByFile: SuggestionsByFileMap): vscode.DocumentLinkProvider => {
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

                for (const [file, suggestions] of suggestionsByFile) {
                    if (! suggestions.has(match)) {
                        continue
                    }

                    const suggestion = suggestions.get(match) as Suggestion
                    const range = new vscode.Range(
                        new vscode.Position(line.lineNumber, charactersTillMatch.length + 1),
                        new vscode.Position(line.lineNumber, charactersTillMatch.length + match.length + 1)
                    )
                    const link = new vscode.DocumentLink(
                        range,
                        file.with({ fragment: `L${suggestion.line}, 1` })
                    );

                    const fileName = file.fsPath.slice(config.workspacePath.length + 1)
                    link.tooltip = `${suggestion.text} <<${fileName}>>`

                    result.push(link);
                }
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
            const range = document.lineAt(position).range
            let input = document.getText(range)
            const matches = input.match(/(.*?')(.+?)['"]/);
            const charactersTillMatch = matches?.at(1) ?? ""
            const match = matches?.at(2) ?? ""

            if (match === "") {
                return []
            }

            const result = [];
            for (const [file, suggestions] of suggestionsByFile) {
                const fileName = file.fsPath.slice(config.workspacePath.length + 1)

                result.push(
                    ...Array
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
