'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { FolderCreator} from './FolderCreator';
const Uri = vscode.Uri;
const window = vscode.window;
const fldercreator = FolderCreator;

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('main.createNewFolders', newFoldersCommand);
    context.subscriptions.push(disposable);
}

/**
 *  1. by context menu --> newFoldersCommand(uri)
    2. by shortcut
        2.1 active editor
            2.1.1 file in workspace -> pick it
            2.1.2 file not in workspace
                2.1.2.1 workspace folder chosen -> pick it
                2.1.2.2 workspace folder not chosen -> from file loc
        2.2 no active editor
            2.2.1 neither editor nor folder open -> return
            2.2.2 no editor but folder open
                2.2.2.1 if only one folder open --> pick it
                2.2.2.2 if multiple folders --> let user pick, might cancel
 */

export async function newFoldersCommand(uri: vscode.Uri, __activateFuncSuppliedArr: Array<any>, FolderCreator: { new(): FolderCreator } = fldercreator): Promise<void> {
    if (isLaunchedByContextMenu(uri)) {
        let wsPath: string = getWorkspaceFolderPathFromDoc(uri);
        return new FolderCreator().main(wsPath, uri.fsPath);
    }

    else {    // launched by shortcut
        let editor = window.activeTextEditor;

        if (editor) { // active editor found --> use folder of that editor
            let doc = editor.document;
            let wsPath: string = getWorkspaceFolderPathFromDoc(doc.uri);

            if (!wsPath) {  // file not in workspace
                let wsFolder: vscode.WorkspaceFolder = await vscode.window.showWorkspaceFolderPick();
                if (wsFolder) {
                    wsPath = wsFolder.uri.fsPath;   // user picks ws folder
                } else {
                    wsPath = path.basename(doc.uri.fsPath);    // no workspace open, create @ file location
                }
            }
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
                    if (!wsFolder) {
                        return;
                    }
                }
                return new FolderCreator().main(wsFolder.uri.fsPath);
            }
        }
    }
};

function getWorkspaceFolder(editorUri?: vscode.Uri) {
    if (editorUri) {
        return getWorkspaceFolderPathFromDoc(editorUri);
    }

}
// adapted from official basic-multi-root-sample
function getWorkspaceFolderPathFromDoc(editorUri: vscode.Uri): string | undefined {
    let text: string;
    if (editorUri.scheme === 'file') {
        const folder = vscode.workspace.getWorkspaceFolder(editorUri);
        if (!folder) {
            return undefined;
        }
        return folder.uri.fsPath;
    }
    return undefined;
}

function isLaunchedByContextMenu(inputPath: { path: string }): boolean {
    return (!!inputPath && !!inputPath.path);
}