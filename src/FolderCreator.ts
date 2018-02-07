'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { InputBox } from './InputBox';
const Uri = vscode.Uri;
const window = vscode.window;


/**
 * TODOs:
 * - Folder display name:
 *      - Start from workspace name
 *      - Start with ellipsis if name too long
 * - Improve validation
 *      - is-valid-path
 * - No error on creating hierarchy with already existing folder --> Algorithm should handle that
 * - Reduce cases. If no editor open but folder open --> handle
 *      - if no editor or folder open, exit
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
 * 
 * - Using showWorkspaceFolderPick only works if a workspace is opened. Otherwise, nothing happens.
 * 
 * - File issue? https://mochajs.org/#arrow-functions --> Passing arrow functions (“lambdas”) to Mocha is discouraged. Lambdas lexically bind this and cannot access the Mocha context.
 *
 */

export class FolderCreator {
    private trailingDirSeps: RegExp = /[\\/]$/;
    private inputBox: InputBox = new InputBox();

    public constructor(private baseDir?: string) { } // for testing purposes 

    public async main(inputPath: string) {
        try {
            let dirPath = await this.convertFileToFolderPath(inputPath);
            let userInput = await this.inputBox.getUserInput(dirPath);
            await this.createFolders(userInput, dirPath);
        } catch (e) {
            console.error(e);
            window.showErrorMessage('An error occured while creating the folders. Please check the logs for more information.');
        }
    }

    private async convertFileToFolderPath(inputPath: string): Promise<string> {
        let stats = await NodeWrapper.lstat(inputPath);
        return stats.isFile() ? path.dirname(inputPath) : inputPath;
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


