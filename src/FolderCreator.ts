'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import * as FileSystem from './FileSystem';
import { InputBox } from './InputBox';
const Uri = vscode.Uri;
const window = vscode.window;

export async function createFolders(input: string, baseDir: string): Promise<{ absFolderPath: string, filename?: string }> {
    if (!input) return;

    input = input.trim();
    let { dirs, filename } = parsePath(input);
    if (!dirs.length) return;

    let dirBuilder: string = baseDir;
    for (const newDir of dirs) {
        try {
            dirBuilder = path.join(dirBuilder, newDir);
            if (!await FileSystem.pathExists(dirBuilder)) {
                await FileSystem.createDirectory(dirBuilder);
            }
        } catch (e) {
            console.error(e);
        }
    }

    return { absFolderPath: dirBuilder, filename };
}

export async function createFile(filename: string, folderAbsPath: string): Promise<string | undefined> {
    if (filename && await FileSystem.pathExists(folderAbsPath)) {
        try {
            const absFilePath: string = path.join(folderAbsPath, filename);
            if (await FileSystem.pathExists(absFilePath)) {
                window.showErrorMessage(`$'{absFilePath}' already exists.`);
                return undefined;
            }
            else {
                await FileSystem.createFile(absFilePath); // 'a+' -> Open file for appending. The file is *created* if it does not exist.
                return absFilePath;
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    else {
        return undefined;
    }
}

function parsePath(input): { dirs: string[], filename?: string } {
    let normalizedPath = path.normalize(input);
    let filename: string;
    if (normalizedPath[normalizedPath.length - 1] !== path.sep) {
        filename = path.basename(normalizedPath);
        normalizedPath = normalizedPath.slice(0, -filename.length); // slice off filename
    }
    let dirs: string[] = normalizedPath.split(path.sep);
    return { dirs: dirs, filename: filename };
}


