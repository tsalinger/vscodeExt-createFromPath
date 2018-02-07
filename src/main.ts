'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { FolderCreator } from './FolderCreator';
const Uri = vscode.Uri;
const window = vscode.window;

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('main.createNewFolders', newFoldersCommand);
    context.subscriptions.push(disposable);
}

export async function newFoldersCommand(uri: vscode.Uri): Promise<void> {
    if (isLaunchedByContextMenu(uri)) {
        let wsPath: string = getWorkspaceFolderPathFromDoc(uri);
        return new FolderCreator().main(wsPath, uri.fsPath);
    }

    else {    // launched by shortcut
        let editor = window.activeTextEditor;
        
        if (editor) { // active editor found --> use folder of that editor
            let doc = editor.document;
            let wsPath: string = getWorkspaceFolderPathFromDoc(editor.document.uri);
            if (!wsPath) return;
            return new FolderCreator().main(wsPath, doc.uri.fsPath);
        }

        else {  // no active editor found --> try to use workspace root folder

            if (!vscode.workspace.workspaceFolders) {
                return; // neither editor nor folder open
            }

            else {  // no editor but folder open
                let folders = vscode.workspace.workspaceFolders;
                let wsFolder: vscode.WorkspaceFolder;
                if (folders.length === 1) {
                    wsFolder = folders[0];
                } else {
                    wsFolder = await vscode.window.showWorkspaceFolderPick();   // user picks ws folder
                }
                return new FolderCreator().main(wsFolder.uri.fsPath);
            }
        }
    }
};

// adapted from official basic-multi-root-sample
function getWorkspaceFolderPathFromDoc(editorUri: vscode.Uri): string | undefined {
    let text: string;
    if (editorUri.scheme === 'file') {
        const folder = vscode.workspace.getWorkspaceFolder(editorUri);
        if (!folder) {
            window.showErrorMessage(`File '${path.basename(editorUri.fsPath)}' is not in an opened workspace folder.`);
            return;
        }
        return folder.uri.fsPath;
    }
}

function isLaunchedByContextMenu(inputPath: { path: string }): boolean {
    return (!!inputPath && !!inputPath.path);
}