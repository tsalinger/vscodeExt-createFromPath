"use strict";

import * as vscode from "vscode";
import * as path from "path"
import * as fs from "fs"
import { FileSystem, Utils } from "./FolderCreator";
const pathValidator = require('is-valid-path');

export class InputBox {

    private promptFolder: string = 'Create folders in:';
    private promptFile: string = 'Create file in:';
    private inputBoxOptions: vscode.InputBoxOptions = {
        prompt: '', // will be set via setPrompt()
        validateInput: this.validateInput.bind(this),
        placeHolder: `Enter relative path: 'main${path.sep}src' --> new folder. 'main${path.sep}src' (no slash @ end) --> new file.`
    };

    public readonly maxPromptChars = 50;

    constructor(private baseDir?: string, private relPathToWorkspace?: string) {} // for testing purposes
    
    public async getUserInput(baseDir: string, workspaceName: string): Promise<string> {
        this.baseDir = baseDir;
        this.relPathToWorkspace = this.createRelPathToWorkspace(workspaceName);
        this.setPrompt(this.promptFolder);
        const userInput: string = await vscode.window.showInputBox(this.inputBoxOptions);
        return userInput;
    }

    private createRelPathToWorkspace(workspaceName: string): string {
        let relPath: string = vscode.workspace.asRelativePath(this.baseDir, true);
        if (relPath === this.baseDir) relPath = workspaceName;   // asRelativePath returns full path back if it's equal to workspace folder
        return relPath;
    }

    private setPrompt(promptStart: string) {
        let trimmedPath = this.trimToMaxLength(promptStart + this.relPathToWorkspace);
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
        if (!input) return;

        if (path.isAbsolute(input)) {
            return `'${input}' mustn't be absolute.`;
        }

        try {
            var absPath = path.join(this.baseDir, input);
        } catch (e) {
            console.error(e);
            return `Invalid input: ${input}.`;
        }

        if (await Utils.pathExists(absPath)) {
            return `Folder ${absPath} already exists.`;
        }

        if (!pathValidator(absPath)) {
            return `${absPath} is not a valid folder.`;
        }

        let rgx = /^([a-zA-Z]:[\\\/])/
        if (rgx.test(input)) {
            return `'${input}' mustn't be absolute.`    // TODO: how does this differ from path.isAbsolute check above?
        }

        let promptStart: string = input.slice(-1) === path.sep ? this.promptFolder : this.promptFile;   // TODO: can't update inputBox!
        this.setPrompt(promptStart)
        return null;    // verfication passed
    }
}