'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { FolderCreator } from './FolderCreator';
const Uri = vscode.Uri;
const window = vscode.window;

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('main.createNewFolders', main);
    context.subscriptions.push(disposable);
}

export async function main(uri: vscode.Uri) {
    let {wsName, filePath} = await getWorkspaceNameAndEditorFilePath(uri);
    if (!wsName) {
        return console.error('Could not find a workspace name.');
    }
    // inputBox
    // createFolder
    return new FolderCreator().main(wsName, filePath);  // filePath can be undefined
}

export async function getWorkspaceNameAndEditorFilePath(uri?: vscode.Uri): Promise<{wsName: string, filePath: string | undefined} | undefined> {
    if (isLaunchedByContextMenu(uri)) {
        let wsName: string = await __getWorkspaceFolderName(uri);
        return await {wsName, filePath: uri.fsPath};
    }

    else {    // launched by shortcut
        let editor = window.activeTextEditor;
        let wsName: string;
        let filePath: string;
        if (editor) { // active editor found --> use folder of that editor
            let doc = editor.document;
            wsName = await __getWorkspaceFolderName(doc.uri);
            filePath = doc.uri.fsPath;
        } 
        else {  // no active editor found --> try to use workspace root folder
            wsName = await __getWorkspaceFolderName();
            filePath = undefined;
        }

        return {wsName, filePath};
    }
};

function isLaunchedByContextMenu(inputPath: { path: string }): boolean {
    return (inputPath && !!inputPath.path);
}

function __getWorkspaceFolderName(editorUri?: vscode.Uri): Promise<string | undefined> {
    if (editorUri) {
        return getWorkspaceNameFromDoc(editorUri);
    } else {
        return getWorkspaceNameWithoutDoc();
    }
}

async function getWorkspaceNameWithoutDoc(): Promise<string | undefined> {
    if (!vscode.workspace.workspaceFolders) {
        return undefined; // neither editor nor folder open
    }

    else {  // no editor but folder open
        let wsFolderName: string | undefined = await pickWorkspaceName()
        return wsFolderName;
    }
}

async function pickWorkspaceName(): Promise<string | undefined> {
    let wsFolder: vscode.WorkspaceFolder;
    let folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length === 1) {
        wsFolder = folders[0];  // no need to show user a picker
    } else {
        wsFolder = await vscode.window.showWorkspaceFolderPick();   // user picks ws folder
    }

    return wsFolder ? wsFolder.name : undefined;
}

async function getWorkspaceNameFromDoc(editorUri: vscode.Uri): Promise<string | undefined> {
    if (editorUri.scheme === 'file') {
        let folder = vscode.workspace.getWorkspaceFolder(editorUri);
        if (folder) {
            return folder.name;
        }
        else {  // file not in currently opened workspace
            let wsName = path.dirname(editorUri.fsPath);    // no workspace open, create @ file location
            return wsName;
        }
    }
    else {
        console.error('editorUri.scheme !== "file"');
        return undefined;
    }
}
