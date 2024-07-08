import * as vscode from 'vscode'

export type ExtensionLogger = {
    userLog: (message: string) => void
    debugLog: (message: string) => void
}

export const createExtensionLogger = (outputChannel?: vscode.LogOutputChannel): ExtensionLogger => {
    return {
        userLog: (message: string) => {
            console.log(message)
            vscode.window.showInformationMessage(message)
            outputChannel?.appendLine(message)
        },
        debugLog: (message: string) => {
            console.log(message)
            outputChannel?.appendLine(message)
        },
    }
}