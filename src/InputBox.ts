import * as vscode from "vscode";
import * as path from "path"
import * as fs from "fs"
import { NodeWrapper } from "./extension";


export class InputBox {
    constructor(private baseDir?: string) {} // for testing purposes

    private inputBoxOptions: vscode.InputBoxOptions = {
        prompt: 'The folders will be created in: ', // will be completed in getUserInput()
        validateInput: this.validateInput.bind(this),
        placeHolder: 'Enter the folder hierarchy you want to create. Example: main/src/validation'
    };

    public async getUserInput(baseDir: string): Promise<{ userInput: string, baseDir: string }> {
        this.baseDir = await this.convertFileToFolderPath(baseDir);
        this.inputBoxOptions['prompt'] = this.inputBoxOptions.prompt + this.baseDir;
        const userInput: string = await vscode.window.showInputBox(this.inputBoxOptions);
        return { userInput: userInput, baseDir: this.baseDir };
    }

    private async convertFileToFolderPath(inputPath: string): Promise<string> {
        let stats = await NodeWrapper.lstat(inputPath);
        return stats.isFile() ? path.dirname(inputPath) : inputPath;
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
            return `Folder ${absPath} already exists!`;
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