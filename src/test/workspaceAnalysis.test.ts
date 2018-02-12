"use strict";

import * as assert from 'assert';
import * as vscode from 'vscode';
import {WorkspaceFolder} from 'vscode';
import * as path from 'path';
import * as wsSelector from '../WorkspaceSelector'
import { getWorkspaceNameAndEditorFilePath } from '../WorkspaceSelector'

function createDummyWorkspaceFolder(customName?: string): WorkspaceFolder {
    const randomName = 'ws' + Math.floor(Math.random() * 90000) + 10000;
    const wsPath = customName || path.normalize('c:\\' + randomName);
    const workspaceUri: vscode.Uri = vscode.Uri.file(wsPath);
    const expectedWsFolder: WorkspaceFolder = {
        uri: workspaceUri,
        name: customName || randomName,
        index: 0
    };
    return expectedWsFolder;
}

function createVsWorkspaceMock(openWsFolders: Array<WorkspaceFolder> | 0, getWsReturnValue: WorkspaceFolder | 0) {
    const workspace = {
        workspaceFolders: openWsFolders || undefined,
        getWorkspaceFolder: (() => getWsReturnValue || undefined)
    }
    return workspace;
}

function createVsWindowMock(activeTextEditorUri: vscode.Uri | 0, wsFolderPickReturnValue: WorkspaceFolder | 0) {
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
        activeTextEditor: txtEditor,
        showErrorMessage: (() => { })
    }
}

suite('Workspace Analysis', () => {
    const NO_OPEN_WORKSPACES: 0 = 0;
    const FILE_NOT_IN_WORKSPACE: 0 = 0;
    const DOESNT_SHOW_WSFOLDERPICK: 0 = 0;
    const NO_ACTIVE_TEXTEDITOR: 0 = 0;

    test('Launched via context menu -> workspace name and editorURI provided by api', async () => {
        const expectedWsFolder: WorkspaceFolder = createDummyWorkspaceFolder();
        const expectedFileUri = vscode.Uri.file(path.join(expectedWsFolder.uri.fsPath, 'test.ts'));

        const workspaceMock = createVsWorkspaceMock([expectedWsFolder], expectedWsFolder)
        wsSelector.debugOverride(workspaceMock, '');

        let { wsFolder, filePath } = await getWorkspaceNameAndEditorFilePath(expectedFileUri);

        assert.deepEqual(wsFolder, expectedWsFolder);
        assert.equal(filePath, expectedFileUri.fsPath);
    });

    test('Launched via shortcut - active editor - file in workspace -> editorUri and ws name', async () => {
        const expectedWsFolder: WorkspaceFolder = createDummyWorkspaceFolder();
        const expectedFileUri = vscode.Uri.file(path.join(expectedWsFolder.uri.fsPath, 'test.ts'));

        const workspaceMock = createVsWorkspaceMock(NO_OPEN_WORKSPACES, expectedWsFolder);
        const windowMock = createVsWindowMock(expectedFileUri, DOESNT_SHOW_WSFOLDERPICK);
        wsSelector.debugOverride(workspaceMock, windowMock);

        let { wsFolder, filePath } = await getWorkspaceNameAndEditorFilePath();

        assert.deepEqual(wsFolder, expectedWsFolder);
        assert.equal(filePath, expectedFileUri.fsPath);
    });

    test('Launched via shortcut - active editor - not in workspace -> takes editorUri & ws calculated from absPath', async () => {
        const expectedWsFolder: WorkspaceFolder = createDummyWorkspaceFolder('c:\\testWS');
        const expectedFileUri = vscode.Uri.file(path.join(expectedWsFolder.uri.fsPath, 'test.ts'));

        const workspaceMock = createVsWorkspaceMock(NO_OPEN_WORKSPACES, FILE_NOT_IN_WORKSPACE);
        const windowMock = createVsWindowMock(expectedFileUri, DOESNT_SHOW_WSFOLDERPICK);
        wsSelector.debugOverride(workspaceMock, windowMock);

        let { wsFolder, filePath } = await getWorkspaceNameAndEditorFilePath();

        if (!wsFolder || !filePath) {
            throw new assert.AssertionError({ message: `Workspace: ${wsFolder} or filePath ${filePath} could not be retrieved.` })
        } else {
            assert.equal(wsFolder.name, expectedWsFolder.name);
            assert.equal(wsFolder.uri.fsPath, expectedWsFolder.uri.fsPath);
            assert.equal(filePath, expectedFileUri.fsPath);
        }
    });

    test('Launched via shortcut - no active editor - no workspace open -> no action', async () => {
        const workspaceMock = createVsWorkspaceMock(NO_OPEN_WORKSPACES, FILE_NOT_IN_WORKSPACE);
        const windowMock = createVsWindowMock(NO_ACTIVE_TEXTEDITOR, DOESNT_SHOW_WSFOLDERPICK);
        wsSelector.debugOverride(workspaceMock, windowMock);

        let { wsFolder, filePath } = await getWorkspaceNameAndEditorFilePath();

        assert.equal(wsFolder, undefined);
        assert.equal(filePath, undefined);
    });

    test('Launched via shortcut - no active editor - single workspace open -> pick ws automatically, no editorPath', async () => {
        const expectedWsFolder: WorkspaceFolder = createDummyWorkspaceFolder();

        const workspaceMock = createVsWorkspaceMock([expectedWsFolder], FILE_NOT_IN_WORKSPACE);
        const windowMock = createVsWindowMock(NO_ACTIVE_TEXTEDITOR, DOESNT_SHOW_WSFOLDERPICK);
        wsSelector.debugOverride(workspaceMock, windowMock);

        let { wsFolder, filePath } = await getWorkspaceNameAndEditorFilePath();

        assert.deepEqual(wsFolder, expectedWsFolder);
        assert.equal(filePath, undefined);
    });

    test('Launched via shortcut - no active editor - multiple workspaces open -> user picks ws, no editorPath', async () => {
        const wsFolder1: WorkspaceFolder = createDummyWorkspaceFolder();
        const wsFolder2: WorkspaceFolder = createDummyWorkspaceFolder();
        const expectedWsFolder: WorkspaceFolder = createDummyWorkspaceFolder();

        const workspaceMock = createVsWorkspaceMock([wsFolder1, expectedWsFolder, wsFolder2], FILE_NOT_IN_WORKSPACE);
        const windowMock = createVsWindowMock(NO_ACTIVE_TEXTEDITOR, expectedWsFolder);
        wsSelector.debugOverride(workspaceMock, windowMock);

        let { wsFolder, filePath } = await getWorkspaceNameAndEditorFilePath();

        assert.deepEqual(wsFolder, expectedWsFolder);
        assert.equal(filePath, undefined);
    });

    test('Launched via shortcut - active untitled (=unsaved) editor - no workspaces open -> throws exception', async () => {
        const workspaceMock = createVsWorkspaceMock(NO_OPEN_WORKSPACES, FILE_NOT_IN_WORKSPACE);
        const untitledEditorUri = vscode.Uri.file("c:\\untitled.ts").with({ scheme: 'untitled' });
        const windowMock = createVsWindowMock(untitledEditorUri, DOESNT_SHOW_WSFOLDERPICK);

        wsSelector.debugOverride(workspaceMock, windowMock);

        let {wsFolder, filePath} = await getWorkspaceNameAndEditorFilePath();
        assert.ok(!wsFolder && filePath);
    });
});