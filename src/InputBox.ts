"use strict";

import * as vscode from "vscode";
import * as path from "path"
import * as fs from "fs"
import { NodeWrapper, Utils } from "./FolderCreator";
const pathValidator = require('is-valid-path');

export class InputBox {

    private inputBoxOptions: vscode.InputBoxOptions = {
        prompt: 'Create folders in: ', // will be completed in getUserInput()
        validateInput: this.validateInput.bind(this),
        placeHolder: 'Enter relative path. Example: main/src/validation'
    };

    public readonly maxPromptChars = 50;

    constructor(private baseDir?: string) {} // for testing purposes
    

    public async getUserInput(baseDir: string, workspaceName: string): Promise<string> {
        this.baseDir = baseDir;
        this.setPrompt();
        const userInput: string = await vscode.window.showInputBox(this.inputBoxOptions);
        return userInput;
    }

    private setPrompt() {
        let relPath: string = vscode.workspace.asRelativePath(this.baseDir, true);
        if (relPath === this.baseDir) relPath = path.sep;   // TODO: asRelativePath returns full path back if equal to workspace folder
        let trimmedPath = this.trimToMaxLength(this.inputBoxOptions.prompt + relPath);
        this.inputBoxOptions['prompt'] = trimmedPath;
    }

    public trimToMaxLength(relPath: string) {
        const maxLenExceededBy: number = this.maxPromptChars - relPath.length;
        if (maxLenExceededBy < 0) {
            relPath = '...' + relPath.substring(-maxLenExceededBy + 3);
        }
        return relPath;
    }

    public async validateInput(input: string): Promise<string | undefined> {
        if (!input) return;

        try {
            var absPath = path.join(this.baseDir, input);
        } catch (e) {
            console.error(e);
            return `Invalid input: ${input}.`;
        }

        if (await Utils.folderExists(absPath)) {
            return `Folder ${absPath} already exists.`;
        }

        if (!pathValidator(absPath)) {
            return `${absPath} is not a valid folder.`;
        }

        let rgx = /^([a-zA-Z]:[\\\/])/
        if (rgx.test(input)) {
            return `${input} mustn't be absolute.`
        }
    }
}