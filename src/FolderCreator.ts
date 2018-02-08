'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { InputBox } from './InputBox';
const Uri = vscode.Uri;
const window = vscode.window;


/**
 * TODOs:
 * - Try to narrow down bug
 * - Publish
 *      - create readme
 *      - check docs for publisher ID
 */

/**
 * Questions:
 * Editor open but no workspace --> quit OK?
 */

export class FolderCreator {
    private trailingDirSeps: RegExp = /[\\/]$/;
    private inputBox: InputBox = new InputBox();

    public constructor(private baseDir?: string) { } // for testing purposes 

    public async main(workspacePath: string, editorPath?: string) {
        try {
            let dirPath: string = editorPath ? await this.convertFileToFolderPath(editorPath) : workspacePath;
            let userInput = await this.inputBox.getUserInput(dirPath, path.basename(workspacePath));
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
                if (!await Utils.folderExists(dirBuilder)) {
                    await NodeWrapper.mkdir(dirBuilder);
                }
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

export class Utils {
    public static async folderExists(path): Promise<boolean> {
        try {
            await NodeWrapper.fsAccess(path, fs.constants.F_OK);
            return true;
        } catch (e) {
            return false;
        }
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


