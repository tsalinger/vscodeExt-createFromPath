'use strict';

import * as vscode from 'vscode';
import { Uri } from 'vscode';
import * as path from 'path';
import { InputBox } from './InputBox';
import * as Creator from './PathCreator';
import * as FileSystem from './FileSystem';
import * as WsSelector from './WorkspaceSelector';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('main.createNewFolders', main);
    context.subscriptions.push(disposable);
}

export async function main(editorUri: Uri) {
    try {

        let { wsFolder, filePath }: WsSelector.WorkspaceAndFilePath = await WsSelector.getWorkspaceNameAndEditorFilePath(editorUri);
        if (!wsFolder) {
            if (!editorUri) {
                vscode.window.showErrorMessage('No file or workspace open. Cannot derive base path to create from.');   // TODO: improve?
                return undefined;
            } else {
                vscode.window.showErrorMessage('Active file is not saved and no workspace open. Cannot derive base path to create from.');
                return undefined;
            }
        }

        let absBasePath: string = filePath ? await convertFileToFolderPath(filePath) : wsFolder.uri.fsPath;
        
        let inputBox: InputBox = new InputBox();
        let userInput: string | undefined = await inputBox.getUserInput(absBasePath, wsFolder.name);
        if (!userInput) return undefined;

        let absFilePath: string | undefined = await Creator.createPath(absBasePath, userInput);
        if (absFilePath) {
            await vscode.workspace.openTextDocument(Uri.file(absFilePath)).then(doc => vscode.window.showTextDocument(doc));
        }

    } catch (e) {
        console.error(e);
        vscode.window.showErrorMessage('An error occured while creating the folders. Please check the logs for more information.');
    }
}

// if path contains a file --> convert to dirPath
async function convertFileToFolderPath(inputPath: string): Promise<string> {
    let stats = await FileSystem.lstat(inputPath);
    return stats.isFile() ? path.dirname(inputPath) : inputPath;
}