"use strict";

import * as vscode from "vscode";
import * as path from "path";
import * as FileSystem from './FileSystem';
const pathValidator = require('is-valid-path');


export class InputBox {
    private inputBoxOptions: vscode.InputBoxOptions = {
        prompt: 'Create in', // will be set via setPrompt()
        validateInput: this.validateInput.bind(this),
        placeHolder: `Enter relative path: 'main${path.sep}src${path.sep}' creates a new folder while 'js${path.sep}file.js' (no slash at end!) creates a new file.`
    };

    public readonly maxPromptChars = 50;
    constructor(private baseDir: string = '', // for testing purposes
        private relPathToWorkspace?: string) { }

    public async getUserInput(baseDir: string, workspaceName: string): Promise<string | undefined> {
        this.baseDir = baseDir;
        this.relPathToWorkspace = this.createRelPathToWorkspace(workspaceName);
        this.setPrompt();
        const userInput: string | undefined = await vscode.window.showInputBox(this.inputBoxOptions);
        return userInput;
    }

    private createRelPathToWorkspace(workspaceName: string): string {
        let relPath: string = vscode.workspace.asRelativePath(this.baseDir, true);
        if (relPath === this.baseDir) relPath = workspaceName;   // asRelativePath returns full path back if it's equal to workspace folder
        return relPath;
    }

    private setPrompt() {
        let trimmedPath = this.trimToMaxLength(this.inputBoxOptions.prompt + ' ' + this.relPathToWorkspace);
        this.inputBoxOptions['prompt'] = trimmedPath;
    }

    public trimToMaxLength(relPath: string) {
        const maxLenExceededBy: number = this.maxPromptChars - relPath.length;
        if (maxLenExceededBy < 0) {
            relPath = '...' + relPath.substring(-maxLenExceededBy + 3);
        }
        return relPath;
    }

    public async validateInput(input: string): Promise<string | null> {
        if (!input || !input.trim()) return <string>this.inputBoxOptions.prompt;

        if (path.isAbsolute(input)) {
            return `'${input}' mustn't be absolute.`;
        }

        try {
            var absPath = path.join(this.baseDir, input);
        } catch (e) {
            console.error(e);
            return `Invalid input: ${input}.`;
        }

        if (await FileSystem.pathExists(absPath)) {
            return `Folder ${absPath} already exists.`;
        }

        if (!pathValidator(absPath)) {
            return `${absPath} is not a valid folder.`;
        }

        return null;    // verfication passed
    }
}