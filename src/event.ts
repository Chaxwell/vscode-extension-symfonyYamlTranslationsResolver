import * as vscode from 'vscode'
import { minimatch } from 'minimatch'
import { Cache, createDataCacheKey } from './cache'
import { ExtensionLogger } from './util'
import { reloadExtension } from './extension-loader'
import { Configuration } from './configuration'

export const createOnDidChangeTextDocument = (
    context: vscode.ExtensionContext,
    translationsFiles: vscode.Uri[],
    cachePool: Cache,
    logger: ExtensionLogger
) => {
    return (evt: vscode.TextDocumentChangeEvent) => {
        if (! translationsFiles.map(uri => uri.fsPath).includes(evt.document.fileName)) {
            return
        }

        logger.debugLog("Translation file changed, reloading suggestions...")
        cachePool.clear(createDataCacheKey(evt.document.uri))
        reloadExtension(context)
    }
}

export const createOnDidCreateFiles = (
    context: vscode.ExtensionContext,
    config: Configuration,
    logger: ExtensionLogger
) => {
    return (evt: vscode.FileCreateEvent) => {
        evt.files.forEach(async (file) => {
            const filename = file.path.slice(config.workspacePath.length + 1)

            if (! minimatch(filename, config.translationsFilePattern)) {
                return
            }

            logger.debugLog("New translation file, adding to suggestions...")
            reloadExtension(context)
        })
    }
}

export const createOnDidRenameFiles = (
    context: vscode.ExtensionContext,
    config: Configuration,
    logger: ExtensionLogger,
    cachePool: Cache,
) => {
    return (evt: vscode.FileRenameEvent) => {
        evt.files.forEach(file => {
            const oldFilename = file.oldUri.path.slice(config.workspacePath.length + 1)

            // TODO Does not clear the cache
            if (! minimatch(oldFilename, config.translationsFilePattern)) {
                logger.debugLog("Translation file renamed (1/2), old filename does not match pattern, skipping...")
            } else {
                logger.debugLog("Translation file renamed (1/2), clearing cache...");
                cachePool.clear(createDataCacheKey(file.oldUri))
            }

            const newFilename = file.newUri.path.slice(config.workspacePath.length + 1)

            if (! minimatch(newFilename, config.translationsFilePattern)) {
                logger.debugLog("Translation file renamed (2/2), new filename does not match pattern, skipping...")
                return
            }

            logger.debugLog("Translation file renamed (2/2), adding to suggestions...")
            reloadExtension(context)
        })
    }
}