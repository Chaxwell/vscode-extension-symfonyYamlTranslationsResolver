import * as vscode from 'vscode';
import { completionProvider, documentLinkProvider } from './provider';
import { CONFIG_CACHE_KEY, DATA_CACHE_KEY } from './constants';
import { cache } from './cache';
import { getConfiguration } from './configuration';
import { extractData } from './data-fetcher';

export function activate(context: vscode.ExtensionContext) {
	console.log('symfonyYamlTranslationsResolver initialization - ALPHA VERSION')

	const cachePool = cache(context)
    const config = getConfiguration(context)
    const suggestions = extractData(
        cachePool,
        vscode.Uri.file(`${config.workspacePath}/translations/messages.fr.yaml`)
    )

	context.subscriptions.push(
		vscode.languages.registerDocumentLinkProvider(
			{ pattern: '**' },
			documentLinkProvider(config, suggestions)
		)
	)
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			[{ pattern: '**' }],
			completionProvider(suggestions),
			"'"
		)
	)
	context.subscriptions.push(
		vscode.commands.registerCommand('symfonyYamlTranslationsResolver.clearCache', () => {
			cachePool.clear(CONFIG_CACHE_KEY)
			cachePool.clear(DATA_CACHE_KEY)
			console.log("Cache cleared!")
			vscode.window.showInformationMessage("Cache cleared!")
			vscode.window.createOutputChannel("YAML Link Resolver").append("Cache cleared!")
		})
	)
}

// This method is called when your extension is deactivated
export function deactivate() {}
