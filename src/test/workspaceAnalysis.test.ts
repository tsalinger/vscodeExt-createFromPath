"use strict";

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as main from '../main';


function createDummyWorkspaceFolder(customName?: string): main.SimpleWorkspaceFolder {
    const randomName = 'ws' + Math.floor(Math.random() * 90000) + 10000;
    const wsPath = customName || path.normalize('c:\\' + randomName);
    const workspaceUri: vscode.Uri = vscode.Uri.file(wsPath);
    const expectedWsFolder: main.SimpleWorkspaceFolder = {
        uri: workspaceUri,
        name: customName || randomName
    };
    return expectedWsFolder;
}

function createVsWorkspaceMock(openWsFolders: Array<main.SimpleWorkspaceFolder> | 0, getWsReturnValue: main.SimpleWorkspaceFolder | 0) {
    const workspace = {
        workspaceFolders: openWsFolders || undefined,
        getWorkspaceFolder: (() => getWsReturnValue || undefined)
    }
    return workspace;
}

function createVsWindowMock(activeTextEditorUri: vscode.Uri | 0, wsFolderPickReturnValue: main.SimpleWorkspaceFolder | 0) {
    let txtEditor = undefined;
    if (activeTextEditorUri) {
        txtEditor = {
            document: {
                uri: activeTextEditorUri
            }
        }
    }

    return {
        showWorkspaceFolderPick: (() => wsFolderPickReturnValue || undefined),
        activeTextEditor: txtEditor
    }
}

suite('Workspace Analysis', () => {
    const NO_OPEN_WORKSPACES: 0 = 0;
    const FILE_NOT_IN_WORKSPACE: 0 = 0;
    const DOESNT_SHOW_WSFOLDERPICK: 0 = 0;
    const NO_ACTIVE_TEXTEDITOR: 0 = 0;

    test('Launched via context menu -> workspace name and editorURI provided by api', async () => {
        const expectedFileUri = vscode.Uri.file('c:\\testWS\\test.ts');
        const expectedWsFolder: main.SimpleWorkspaceFolder = createDummyWorkspaceFolder();

        const workspaceMock = createVsWorkspaceMock(NO_OPEN_WORKSPACES, expectedWsFolder)
        main.debugOverride(workspaceMock, '');

        let { wsFolder, filePath } = await main.getWorkspaceNameAndEditorFilePath(expectedFileUri);

        assert.deepEqual(wsFolder, expectedWsFolder);
        assert.equal(filePath, expectedFileUri.fsPath);
    });

    test('Launched via shortcut - active editor - file in workspace -> editorUri and ws name', async () => {
        const expectedFileUri = vscode.Uri.file('c:\\testWS\\test.ts');
        const expectedWsFolder: main.SimpleWorkspaceFolder = createDummyWorkspaceFolder();

        const workspaceMock = createVsWorkspaceMock(NO_OPEN_WORKSPACES, expectedWsFolder);
        const windowMock = createVsWindowMock(expectedFileUri, DOESNT_SHOW_WSFOLDERPICK);
        main.debugOverride(workspaceMock, windowMock);

        let { wsFolder, filePath } = await main.getWorkspaceNameAndEditorFilePath();

        assert.deepEqual(wsFolder, expectedWsFolder);
        assert.equal(filePath, expectedFileUri.fsPath);
    });

    test('Launched via shortcut - active editor - not in workspace -> takes editorUri & ws calculated from absPath', async () => {
        const expectedWsFolder: main.SimpleWorkspaceFolder = createDummyWorkspaceFolder('c:\\testWS');
        const expectedFileUri = vscode.Uri.file(path.normalize('c:\\testWS\\test.ts'));

        const workspaceMock = createVsWorkspaceMock(NO_OPEN_WORKSPACES, FILE_NOT_IN_WORKSPACE);
        const windowMock = createVsWindowMock(expectedFileUri, DOESNT_SHOW_WSFOLDERPICK);
        main.debugOverride(workspaceMock, windowMock);

        let { wsFolder, filePath } = await main.getWorkspaceNameAndEditorFilePath();

        assert.deepEqual(wsFolder, expectedWsFolder);
        assert.equal(filePath, expectedFileUri.fsPath);
    });

    test('Launched via shortcut - no active editor - no workspace open -> no action', async () => {
        const workspaceMock = createVsWorkspaceMock(NO_OPEN_WORKSPACES, FILE_NOT_IN_WORKSPACE);
        const windowMock = createVsWindowMock(NO_ACTIVE_TEXTEDITOR, DOESNT_SHOW_WSFOLDERPICK);
        main.debugOverride(workspaceMock, windowMock);

        let { wsFolder, filePath } = await main.getWorkspaceNameAndEditorFilePath();

        assert.equal(wsFolder, undefined);
        assert.equal(filePath, undefined);
    });

    test('Launched via shortcut - no active editor - single workspace open -> pick ws automatically, no editorPath', async () => {
        const expectedWsFolder: main.SimpleWorkspaceFolder = createDummyWorkspaceFolder();
        
        const workspaceMock = createVsWorkspaceMock([expectedWsFolder], FILE_NOT_IN_WORKSPACE);
        const windowMock = createVsWindowMock(NO_ACTIVE_TEXTEDITOR, DOESNT_SHOW_WSFOLDERPICK);
        main.debugOverride(workspaceMock, windowMock);

        let { wsFolder, filePath } = await main.getWorkspaceNameAndEditorFilePath();

        assert.deepEqual(wsFolder, expectedWsFolder);
        assert.equal(filePath, undefined);
    });

    test('Launched via shortcut - no active editor - multiple workspaces open -> user picks ws, no editorPath', async () => {
        const wsFolder1: main.SimpleWorkspaceFolder = createDummyWorkspaceFolder();
        const wsFolder2: main.SimpleWorkspaceFolder = createDummyWorkspaceFolder();
        const expectedWsFolder: main.SimpleWorkspaceFolder = createDummyWorkspaceFolder();
        
        const workspaceMock = createVsWorkspaceMock([wsFolder1, expectedWsFolder, wsFolder2], FILE_NOT_IN_WORKSPACE);
        const windowMock = createVsWindowMock(NO_ACTIVE_TEXTEDITOR, expectedWsFolder);
        main.debugOverride(workspaceMock, windowMock);

        let { wsFolder, filePath } = await main.getWorkspaceNameAndEditorFilePath();

        assert.deepEqual(wsFolder, expectedWsFolder);
        assert.equal(filePath, undefined);
    });
});