'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { InputBox } from './InputBox';
const Uri = vscode.Uri;
const window = vscode.window;


/**
 * TODOs:

 * - Should be usable from keyboard
 *      - creates in root
 *          - active editor hole doc, dann uri
            - liste von workspace folders, schauen wo user ist
            - wenn kein editor, was machen? Root folder oder einfach fragen?
 * 
 * - Try to narrow down bug
 */

/**
 * Questions:
 * - validateInput --> are there any security related considerations?
 *      - Is it OK to assume that the user will not type anything weird like 'c:\root' etc?
 * 
 * - Validate input
 *      - Check if unsupported characters are used --> Check vscode repo for validation code
 *          --> Impossible, try-catch only way: https://stackoverflow.com/a/1976050
 * 
 * - If multi-workspace: Creating a new folder is not reflected in the UI unless you push refresh. Is this a bug?
 */

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.createNewFolders', tempDelete /*newFoldersCommand*/);
    context.subscriptions.push(disposable);
}

export function tempDelete() {  // TODO remove
    window.showWorkspaceFolderPick().then(() => {
        console.log('hi');
    });
}

export function newFoldersCommand(uri: vscode.Uri) {
    if (isLaunchedFromShortcut(uri)) {
        /** 
         * - No active editor? --> Ask user
         * - Is it multi-workspace? --> check which is active --> Not required in my case?
         * - Get active editor uri
         * 
        */
        let editor = window.activeTextEditor;
        if (!editor) {
            console.error('Launched by shortcut but no active editor found!');
            return;
        }

        let doc = editor.document;
        uri = editor.document.uri;  // TODO: More safety checks required?
    }
    new FolderCreator().main(uri.fsPath);
};

function isLaunchedFromShortcut(inputPath: { path: string }): boolean {
    return (!inputPath || !inputPath.path);
}

export class FolderCreator {
    private trailingDirSeps: RegExp = /[\\/]$/;
    private inputBox: InputBox = new InputBox();

    public constructor(private baseDir?: string) { } // for testing purposes

    public async main(inputPath: string) {
        try {
            let { userInput, baseDir } = await this.inputBox.getUserInput(inputPath);
            await this.createFolders(userInput, baseDir);
        } catch (e) {
            console.error(e);
            window.showErrorMessage('An error occured while creating the folders. Please check the logs for more information.');
        }
    }

    public async createFolders(input: string, baseDir: string = this.baseDir) {
        if (!input) return;

        input = input.trim();
        let paths: string[] = this.parsePath(input);
        if (!paths.length) return;

        let dirBuilder: string = baseDir;
        for (let newDir of paths) {
            dirBuilder = path.join(dirBuilder, newDir);
            try {
                await NodeWrapper.mkdir(dirBuilder);   // check for folder existance is done in inputbox verification
            } catch (e) {
                console.error(e);
            }
        }
    }

    private parsePath(input) {
        let normalizedPath = path.normalize(input).replace(this.trailingDirSeps, '');
        let dirs = normalizedPath.split(path.sep);
        return dirs;
    }
}

export class NodeWrapper {
    // adapted from vs/base/node/pfs.ts  
    public static lstat(path: string): Promise<any> {
        return this.nfcall(fs.lstat, path);
    }

    public static mkdir(path: string): Promise<any> {
        return this.nfcall(fs.mkdir, path);
    }

    public static fsAccess(path: string, checks: number): Promise<any> {
        return this.nfcall(fs.access, path, checks);
    }

    // adapted from vs/base/common/async
    private static nfcall(fn: Function, ...args: any[]): any {
        return new Promise((c, e) => fn(...args, (err: any, result: any) => err ? e(err) : c(result)));
    }
}


