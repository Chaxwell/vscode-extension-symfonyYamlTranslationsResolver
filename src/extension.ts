import * as vscode from 'vscode'
import { minimatch } from 'minimatch'
import { completionProvider, documentLinkProvider } from './provider'
import { createCache, createDataCacheKey } from './cache'
import { getConfiguration } from './configuration'
import { SuggestionsByFileMap, extractData } from './data-fetcher'
import { createExtensionLog } from './utils'

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
				return
			}

			extensionLog.debugLog("Translation file changed, reloading suggestions...")
			cachePool.clear(createDataCacheKey(evt.document.uri))

			context.subscriptions.forEach(disposable => disposable.dispose())
			loadDisposables(context)
		}, 3000)),
		// Only works either on file creation through VSCODE or, through a drag and drop.
		vscode.workspace.onDidCreateFiles(evt => {
			evt.files.forEach(async (file) => {
				const filename = file.path.slice(config.workspacePath.length + 1)

				if (! minimatch(filename, config.translationsFilePattern)) {
					return
				}

				extensionLog.debugLog("New translation file, adding to suggestions...")

				context.subscriptions.forEach(disposable => disposable.dispose())
				loadDisposables(context)
			})
		}),
	]

	context.subscriptions.push(...suggestionsProviderDisposables)
}

export async function activate(context: vscode.ExtensionContext) {
	console.log('symfonyYamlTranslationsResolver initialization - ALPHA VERSION')

	loadDisposables(context)
}

// This method is called when your extension is deactivated
export function deactivate() {}
