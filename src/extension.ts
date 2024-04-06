import * as vscode from 'vscode';
import { completionProvider, documentLinkProvider } from './provider';
import { cache } from './cache';
import { getConfiguration } from './configuration';
import { SuggestionsByFileMap, extractData } from './data-fetcher';

export async function activate(context: vscode.ExtensionContext) {
	console.log('symfonyYamlTranslationsResolver initialization - ALPHA VERSION')

	const outputChannel = vscode.window.createOutputChannel("Symfony YAML Translations Resolver");
	const cachePool = cache(context)
	const config = getConfiguration(context)
	const suggestionsByFile: SuggestionsByFileMap = new Map()
	const translationsFiles = await vscode.workspace.findFiles(config.translationsFilePattern)

	for (const fileUri of translationsFiles) {
		suggestionsByFile.set(fileUri, extractData(cachePool, fileUri))
	}

	context.subscriptions.push(
		vscode.languages.registerDocumentLinkProvider(
			{ pattern: '**' },
			documentLinkProvider(config, suggestionsByFile)
		)
	)
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			[{ pattern: '**' }],
			completionProvider(config, suggestionsByFile),
			"'"
		)
	)
	context.subscriptions.push(
		vscode.commands.registerCommand('symfonyYamlTranslationsResolver.clearCache', () => {
			cachePool.clearAll()
			console.log("Cache cleared!")
			vscode.window.showInformationMessage("Cache cleared!")
			outputChannel.appendLine("Cache cleared!")
		})
	)
}

// This method is called when your extension is deactivated
export function deactivate() {}
