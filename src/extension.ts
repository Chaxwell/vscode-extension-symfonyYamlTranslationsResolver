import * as vscode from 'vscode';
import { completionProvider, documentLinkProvider } from './provider';
import { createCache, createDataCacheKey } from './cache';
import { getConfiguration } from './configuration';
import { SuggestionsByFileMap, extractData } from './data-fetcher';
import { createExtensionLog } from './utils';

const debounce = <T extends Function>(callback: T, delay: number) => {
	let timer: NodeJS.Timeout

	const callable = (...args: any) => {
		clearTimeout(timer)
		timer = setTimeout(() => callback(...args), delay)
	}

	return <T>(<any>callable)
}

const loadDisposables = async (context: vscode.ExtensionContext) => {
	const outputChannel = vscode.window.createOutputChannel("Symfony YAML Translations Resolver", {log: true})
	const extensionLog = createExtensionLog(outputChannel)
	const cachePool = createCache(context)
	const config = getConfiguration(context)
	const suggestionsByFile: SuggestionsByFileMap = new Map()
	const translationsFiles = await vscode.workspace.findFiles(config.translationsFilePattern)

	for (const fileUri of translationsFiles) {
		suggestionsByFile.set(fileUri, extractData(cachePool, fileUri))
	}

	const suggestionsProviderDisposables = [
		vscode.languages.registerDocumentLinkProvider(
			{ pattern: '**' },
			documentLinkProvider(config, suggestionsByFile)
		),
		vscode.languages.registerCompletionItemProvider(
			[{ pattern: '**' }],
			completionProvider(config, suggestionsByFile),
			"'"
		),
		vscode.commands.registerCommand('symfonyYamlTranslationsResolver.clearCache', () => {
			cachePool.clearAll()
			extensionLog.userLog("Cache cleared!")
		}),
		vscode.workspace.onDidChangeTextDocument(debounce((evt) => {
			if (! translationsFiles.map(uri => uri.fsPath).includes(evt.document.fileName)) {
				return;
			}

			const cachePool = createCache(context)
			cachePool.clear(createDataCacheKey(vscode.Uri.file(evt.document.fileName)))

			context.subscriptions.forEach(disposable => disposable.dispose())
			loadDisposables(context)
		}, 3000)),
	];

	context.subscriptions.push(...suggestionsProviderDisposables)
}

export async function activate(context: vscode.ExtensionContext) {
	console.log('symfonyYamlTranslationsResolver initialization - ALPHA VERSION')

	loadDisposables(context)
}

// This method is called when your extension is deactivated
export function deactivate() {}
