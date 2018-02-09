'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import { InputBox } from './InputBox';
const Uri = vscode.Uri;
const window = vscode.window;


/**
 * TODOs:
 * - Bug: file open but no folder --> inputBox doesn't show correct path
 * - Create one function that finds the current workspace or asks the user
 *      - don't use ws picker if only 1 workspace
 *      - WorkspaceFolder.name --> use it!
 * - Create one function that evals context menu or shortcut
 * - Separate UI from other stuff
 * - 
 * 
 * 
 * - Write tests for file creation
 * - Publish
 *      - create readme
 *      - check docs for publisher ID
 * - Try to narrow down bug
 */

/**
 * Questions:
 * - Create folder with ext, create file within folder with ext. Try to delete folder --> admin rights required!
 *      - fs.open('C:\\vscode_projects\\test\\cantDeleteFile\\testFolder\\test.txt', 'a+', (err) => {if (err) console.log('error'); else console.log('success')});
 * - Update UI: Should reflect file or folder creation
 *      - Can't update prompt of inputBox
 *      - Suggestions for better placeholder text?
 * - main.newFoldersCommand() sehr komplex. Wie eleganter testen?
 * - Intellisense suggestion popup doesn't catch home/end keys
 * - Promisify NodeJS with built-in function (added in v8, @types is v7...: https://nodejs.org/api/util.html#util_util_promisify_original
 */

export class FolderCreator {

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
        let stats = await FileSystem.lstat(inputPath);
        return stats.isFile() ? path.dirname(inputPath) : inputPath;
    }

    public async createFolders(input: string, baseDir: string = this.baseDir) {
        if (!input) return;

        input = input.trim();
        let { dirs, filename } = this.parsePath(input);
        if (!dirs.length) return;

        let dirBuilder: string = baseDir;
        for (const newDir of dirs) {
            dirBuilder = path.join(dirBuilder, newDir);
            try {
                if (!await Utils.pathExists(dirBuilder)) {
                    await FileSystem.createDirectory(dirBuilder);
                }
            } catch (e) {
                console.error(e);
            }
        }

        await this.createFile(filename, dirBuilder);
    }

    private async createFile(filename: string, folderAbsPath: string) {
        if (filename && await Utils.pathExists(folderAbsPath)) {
            try {
                const absFilePath: string = path.join(folderAbsPath, filename);
                if (await Utils.pathExists(absFilePath)) {
                    window.showErrorMessage(`$'{absFilePath}' already exists.`);
                }
                else {
                    await FileSystem.createFile(absFilePath, 'a+'); // 'a+' -> Open file for appending. The file is *created* if it does not exist.
                    await vscode.workspace.openTextDocument(vscode.Uri.file(absFilePath)).then(doc => window.showTextDocument(doc));
                }
            }
            catch (e) {
                console.log(e);
            }
        }
    }

    private parsePath(input): { dirs: string[], filename?: string } {
        let normalizedPath = path.normalize(input);
        let filename: string;
        if (normalizedPath[normalizedPath.length - 1] !== path.sep) {
            filename = path.basename(normalizedPath);
            normalizedPath = normalizedPath.slice(0, -filename.length); // slice off filename
        }
        let dirs: string[] = normalizedPath.split(path.sep);
        return { dirs: dirs, filename: filename };
    }
}

export class Utils {
    public static async pathExists(path): Promise<boolean> {
        try {
            await FileSystem.fsAccess(path, fs.constants.F_OK);
            return true;
        } catch (e) {
            return false;
        }
    }
}

export class FileSystem {

    public static createFile(path: string, mode: string) {
        return FileSystem.nfcall(fs.open, path, mode);
    }

    public static createDirectory(path: string): Promise<any> {
        return FileSystem.nfcall(fs.mkdir, path);
    }

    // adapted from vs/base/node/pfs.ts  
    public static lstat(path: string): Promise<any> {
        return FileSystem.nfcall(fs.lstat, path);
    }

    public static fsAccess(path: string, checks: number): Promise<any> {
        return FileSystem.nfcall(fs.access, path, checks);
    }

    // adapted from vs/base/common/async
    private static nfcall(fn: Function, ...args: any[]): any {
        return new Promise((c, e) => fn(...args, (err: any, result: any) => err ? e(err) : c(result)));
    }
}


