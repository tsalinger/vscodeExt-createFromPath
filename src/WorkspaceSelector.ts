import * as vscode from 'vscode';
import { Uri, WorkspaceFolder } from 'vscode';
import * as path from 'path';


let window = vscode.window;
let workspace = vscode.workspace;

export function debugOverride(debugWorkspace: any, debugWindow: any) {
    if (debugWorkspace) workspace = debugWorkspace;
    if (debugWindow) window = debugWindow;
}

export async function getWorkspaceNameAndEditorFilePath(editorUri?: Uri): Promise<WorkspaceAndFilePath> {
    if (editorUri) { // launched via context menu
        let wsFolder: WorkspaceFolder | undefined = await getWorkspaceFolderName(editorUri);
        return await { wsFolder, filePath: editorUri.fsPath };
    }

    else {    // launched via shortcut
        let wsFolder: WorkspaceFolder | undefined;
        let filePath: string | undefined;
        let editor = window.activeTextEditor;
        if (editor) { // active editor found --> use folder of that editor
            let doc = editor.document;
            wsFolder = await getWorkspaceFolderName(doc.uri);
            filePath = doc.uri.fsPath;
        }
        else {  // no active editor found --> try to use workspace root folder
            wsFolder = await getWorkspaceFolderName();
            filePath = undefined;
        }

        return { wsFolder, filePath };
    }
};

async function getWorkspaceFolderName(editorUri?: Uri): Promise<WorkspaceFolder | undefined> {
    if (editorUri) {
        return await getWorkspaceNameFromDoc(editorUri);
    } else {
        return await getWorkspaceNameWithoutDoc();
    }
}

async function getWorkspaceNameFromDoc(editorUri: Uri): Promise<WorkspaceFolder | undefined> {
    let folder: WorkspaceFolder | undefined = workspace.getWorkspaceFolder(editorUri);
    if (folder) {
        return folder;
    }
    else {  // file not in currently opened workspace
        if (editorUri.scheme === 'file') {
            let wsName = path.dirname(editorUri.fsPath);    // no workspace open, create @ file location
            let uri = Uri.file(wsName);
            return createWorkspaceFolder(uri, wsName);
        } else {    // no workspace open, untitled file
            return undefined;
        }
    }
}

async function getWorkspaceNameWithoutDoc(): Promise<WorkspaceFolder | undefined> {
    if (!workspace.workspaceFolders) {
        return undefined; // neither editor nor folder open
    }

    else {  // no editor but folder open
        return await pickWorkspaceName()
    }
}

async function pickWorkspaceName(): Promise<WorkspaceFolder | undefined> {
    let wsFolder: WorkspaceFolder | undefined;
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

function createWorkspaceFolder(uri: Uri, name: string, idx?: number): WorkspaceFolder {
    return {
        uri: uri,
        name: name,
        index: idx || 0
    }
}

export interface WorkspaceAndFilePath {
    wsFolder: WorkspaceFolder | undefined,
    filePath: string | undefined
}