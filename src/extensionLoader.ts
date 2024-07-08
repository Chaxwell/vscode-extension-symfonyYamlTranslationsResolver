import * as vscode from 'vscode'
import { completionProvider, documentLinkProvider } from './provider'
import { createCache } from './cache'
import { getConfiguration } from './configuration'
import { SuggestionsByFileMap, extractData } from './data-fetcher'
import { createExtensionLogger } from './util'
import { clearCache } from './command'
import { createOnDidChangeTextDocument, createOnDidCreateFiles, createOnDidRenameFiles } from './event'
import { OUTPUT_CHANNEL } from './constant'

export const loadExtension = async (context: vscode.ExtensionContext) => {
    const logger = createExtensionLogger(
        vscode.window.createOutputChannel(OUTPUT_CHANNEL, {log: true})
    )
    logger.debugLog('symfonyYamlTranslationsResolver BETA VERSION - Initialization..')

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
		vscode.commands.registerCommand(
			'symfonyYamlTranslationsResolver.clearCache',
			clearCache
		),
		vscode.workspace.onDidChangeTextDocument(
			debounce(
				createOnDidChangeTextDocument(
					context,
					translationsFiles,
					cachePool,
					logger
				),
				3000
			)
		),
		// Only works either on file creation through VSCODE or, through a drag and drop.
		vscode.workspace.onDidCreateFiles(
			createOnDidCreateFiles(
				context,
				config,
				logger
			)
		),
		vscode.workspace.onDidRenameFiles(
			createOnDidRenameFiles(
				context,
				config,
				logger,
				cachePool
			)
		),
	]

	context.subscriptions.push(...suggestionsProviderDisposables)
}

export const reloadExtension = (context: vscode.ExtensionContext) => {
    const logger = createExtensionLogger(
        vscode.window.createOutputChannel(OUTPUT_CHANNEL, {log: true})
    )
    logger.debugLog('symfonyYamlTranslationsResolver BETA VERSION - Reloading..')

    context.subscriptions.forEach(disposable => disposable.dispose())
    loadExtension(context)
}

const debounce = <T extends Function>(callback: T, delay: number) => {
	let timer: NodeJS.Timeout

	const callable = (...args: any) => {
		clearTimeout(timer)
		timer = setTimeout(() => callback(...args), delay)
	}

	return <T>(<any>callable)
}