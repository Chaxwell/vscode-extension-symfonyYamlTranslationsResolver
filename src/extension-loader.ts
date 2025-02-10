import * as vscode from 'vscode'
import { completionProvider, documentLinkProvider } from './provider'
import { createCache } from './cache'
import { getConfiguration } from './configuration'
import { loadFromFiles } from './suggestion-loader'
import { createExtensionLogger } from './util'
import { createClearCacheCommand } from './command'
import { createOnDidChangeTextDocument, createOnDidCreateFiles, createOnDidRenameFiles } from './event'
import { OUTPUT_CHANNEL } from './constant'

export const loadExtension = async (context: vscode.ExtensionContext) => {
    const logger = createExtensionLogger(
        vscode.window.createOutputChannel(OUTPUT_CHANNEL, {log: true})
    )
    logger.debugLog('symfonyYamlTranslationsResolver BETA VERSION - Initialization..')

	const cachePool = createCache(context)
	const config = getConfiguration(context)
	const translationsFiles = await vscode.workspace.findFiles(config.translationsFilePattern)
	const suggestionsByFile = await loadFromFiles(translationsFiles, cachePool, config)

	const suggestionsProviderDisposables = [
		vscode.languages.registerDocumentLinkProvider(
			{ pattern: '**' },
			documentLinkProvider(config, suggestionsByFile)
		),
		vscode.commands.registerCommand(
			'symfonyYamlTranslationsResolver.clearCache',
			createClearCacheCommand(cachePool, logger)
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

	if (config.enableAutocomplete) {
		suggestionsProviderDisposables.push(
			vscode.languages.registerCompletionItemProvider(
				[{ pattern: '**' }],
				completionProvider(config, suggestionsByFile),
				"'"
			)
		)
	}

	context.subscriptions.push(...suggestionsProviderDisposables)

    logger.debugLog('symfonyYamlTranslationsResolver BETA VERSION - Initialized..')
}

export const reloadExtension = (context: vscode.ExtensionContext) => {
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
