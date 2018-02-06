'use strict';

import * as vscode from 'vscode';
const window = vscode.window;
const path = require('path');
const fs = require('fs');
import Uri from 'vscode-uri';

/**
 * TODO:
 * - createFolders is made public for testing purposes only
 *      - constructor parameter, too
 * - Any disposables that I missed?
 *      - could tslint provide checks for places where I missed a disposable?
 * - Error handling --> showErrorMessage, throw exceptions?
 * - Why isn't there intellisense for nodejs modules like fs?
 *      - using sync versions of fs OK?
 * - AfterEach function in tests?
 * - "a\\b\\c\\".replace('\\$', '') --> how can I remove trailing '\\' and '/'?
 * - Try to narrow down bug?
 * - Custom input widget --> input folders and optionally file(s)?
 */

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.createNewFolders',
        (inputPath: { path: string }) => {
            if (!inputPath || !inputPath.path) throw Error('It shouldn\'t be possible to execute this extension without an inputPath!');
            new FolderCreator().main(inputPath.path);
        });
    context.subscriptions.push(disposable);
}

export class FolderCreator {
    private baseDir: string;
    private trailingDirSeps: RegExp = new RegExp(`\\|/$`);

    public constructor(baseDir?: string) {  // for testing purposes
        this.baseDir = baseDir;
    }

    public async main(inputPath: string) {
        try {
            let uri = Uri.file(inputPath).fsPath;
            let stats = await this.lstat(uri);
            this.baseDir = stats.isFile() ? path.dirname(uri) : uri;
            let input: string = await this.showInputBox();
            this.createFolders(input);
        } catch (e) {
            window.showErrorMessage('_ ' + e);
        }
    }

    public createFolders(input: string) {
        if (!input) {
            return window.showErrorMessage('Empty string provided!');
        }

        input = input.trim();
        let paths: string[] = this.parsePath(input);

        if (!paths.length) return;

        let dirBuilder: string = this.baseDir;
        for (let newDir of paths) {
            dirBuilder = path.join(dirBuilder, newDir);
            if (!fs.existsSync(dirBuilder)) {
                fs.mkdirSync(dirBuilder);
            }
        }
    }

    // adapted from vs/base/common/async    
    private lstat(path: string): Promise<any> {
        return this.nfcall(fs.lstat, path);
    }

    // adapted from vs/base/common/async
    private nfcall(fn: Function, ...args: any[]): any {
        return new Promise((c, e) => fn(...args, (err: any, result: any) => err ? e(err) : c(result)));
    }

    private showInputBox() {
        let inputBoxOptions = {
            ignoreFocusOut: true,
            prompt: 'Enter the directory hierarchy you want to create. Example: main/src'
        };
        return window.showInputBox(inputBoxOptions);
    }

    private parsePath(input) {
        let normalizedPath = path.normalize(input).replace(this.trailingDirSeps, '');
        let dirs = normalizedPath.split(path.sep);
        return dirs;
    }
}
