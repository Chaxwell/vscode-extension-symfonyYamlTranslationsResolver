import * as vscode from 'vscode'

export const createExtensionLog = (outputChannel?: vscode.LogOutputChannel) => {
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