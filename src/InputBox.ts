import * as vscode from "vscode";
import * as path from "path"
import * as fs from "fs"
import { NodeWrapper } from "./FolderCreator";


export class InputBox {
    constructor(private baseDir?: string) {} // for testing purposes

    private inputBoxOptions: vscode.InputBoxOptions = {
        prompt: 'Create folders in: ', // will be completed in getUserInput()
        validateInput: this.validateInput.bind(this),
        placeHolder: 'Enter relative path. Example: main/src/validation'
    };

    public async getUserInput(baseDir: string): Promise<string> {
        this.baseDir = baseDir;
        this.setPrompt(this.baseDir);
        const userInput: string = await vscode.window.showInputBox(this.inputBoxOptions);
        return userInput;
    }

    private setPrompt(path: string) {
        this.inputBoxOptions['prompt'] = this.inputBoxOptions.prompt + path;
    }

    public async validateInput(input: string): Promise<string | undefined> {
        if (!input) return;

        try {
            var absPath = path.join(this.baseDir, input);
        } catch (e) {
            console.error(e);
            return `Invalid input: ${input}`;
        }

        if (await this.folderExists(absPath)) {
            return `Folder ${absPath} already exists.`;
        }
    }

    private async folderExists(path): Promise<boolean> {
        try {
            await NodeWrapper.fsAccess(path, fs.constants.F_OK);
            return true;
        } catch (e) {
            return false;
        }
    }
}