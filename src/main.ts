'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { InputBox } from './InputBox';
import * as Creator from './FolderCreator';
import * as FileSystem from './FileSystem';
const Uri = vscode.Uri;
let window = vscode.window;
let workspace = vscode.workspace;

export function debugOverride(debugWorkspace, debugWindow) {
    if (debugWorkspace) workspace = debugWorkspace;
    if (debugWindow) window = debugWindow;
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('main.createNewFolders', main);
    context.subscriptions.push(disposable);
}

export async function main(editorUri: vscode.Uri) {
    let { wsFolder, filePath } = await getWorkspaceNameAndEditorFilePath(editorUri);
    if (!wsFolder) {
        return console.error('Could not find a workspace name.');
    }

    try {
        let dirPath: string = filePath ? await convertFileToFolderPath(filePath) : wsFolder.uri.fsPath;
        let inputBox: InputBox = new InputBox();
        let userInput: string = await inputBox.getUserInput(dirPath, wsFolder.name);
        if (!userInput) return;

        let { absFolderPath, filename } = await Creator.createFolders(userInput, dirPath);
        let absFilePath: string | undefined = await Creator.createFile(filename, absFolderPath);
        if (absFilePath) {
            await workspace.openTextDocument(vscode.Uri.file(absFilePath)).then(doc => window.showTextDocument(doc));
        }

    } catch (e) {
        console.error(e);
        window.showErrorMessage('An error occured while creating the folders. Please check the logs for more information.');
    }
}

async function convertFileToFolderPath(inputPath: string): Promise<string> {
    let stats = await FileSystem.lstat(inputPath);
    return stats.isFile() ? path.dirname(inputPath) : inputPath;
}

export async function getWorkspaceNameAndEditorFilePath(editorUri?: vscode.Uri): Promise<{ wsFolder: SimpleWorkspaceFolder, filePath: string | undefined } | undefined> {
    if (isLaunchedViaContextMenu(editorUri)) {
        let wsFolder: SimpleWorkspaceFolder = await __getWorkspaceFolderName(editorUri);
        return await { wsFolder, filePath: editorUri.fsPath };
    }

    else {    // launched via shortcut
        let wsFolder: SimpleWorkspaceFolder, filePath: string;
        let editor = window.activeTextEditor;
        if (editor) { // active editor found --> use folder of that editor
            let doc = editor.document;
            wsFolder = await __getWorkspaceFolderName(doc.uri);
            filePath = doc.uri.fsPath;
        }
        else {  // no active editor found --> try to use workspace root folder
            wsFolder = await __getWorkspaceFolderName();
            filePath = undefined;
        }

        return { wsFolder, filePath };
    }
};

function isLaunchedViaContextMenu(inputPath: { path: string }): boolean {
    return (inputPath && !!inputPath.path);
}

async function __getWorkspaceFolderName(editorUri?: vscode.Uri): Promise<SimpleWorkspaceFolder | undefined> {
    if (editorUri) {
        return await getWorkspaceNameFromDoc(editorUri);
    } else {
        return await getWorkspaceNameWithoutDoc();
    }
}

async function getWorkspaceNameFromDoc(editorUri: vscode.Uri): Promise<SimpleWorkspaceFolder | undefined> {
    if (editorUri.scheme === 'file') {
        let folder: vscode.WorkspaceFolder = workspace.getWorkspaceFolder(editorUri);
        if (folder) {
            return folder;
        }
        else {  // file not in currently opened workspace
            try {
                let wsName = path.dirname(editorUri.fsPath);    // no workspace open, create @ file location
                let uri = vscode.Uri.file(wsName);
                return { name: wsName, uri };

            } catch (e) {
                console.error(e);
                return undefined;
            }
        }
    }
    else {
        console.error('editorUri.scheme !== "file"');
        return undefined;
    }
}

async function getWorkspaceNameWithoutDoc(): Promise<SimpleWorkspaceFolder | undefined> {
    if (!workspace.workspaceFolders) {
        return undefined; // neither editor nor folder open
    }

    else {  // no editor but folder open
        return await pickWorkspaceName()
    }
}

async function pickWorkspaceName(): Promise<SimpleWorkspaceFolder | undefined> {
    let wsFolder: vscode.WorkspaceFolder;
    let folders = workspace.workspaceFolders;
    if (folders) {
        if (folders.length === 1) {
            wsFolder = folders[0];  // no need to show user a picker
        } else {
            wsFolder = await window.showWorkspaceFolderPick();   // user picks ws folder
        }
    }

    return wsFolder ? wsFolder : undefined;
}

export interface SimpleWorkspaceFolder {
    name: string,
    uri: vscode.Uri
}