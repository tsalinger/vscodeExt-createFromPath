'use strict';

import * as path from 'path';
import * as FileSystem from './FileSystem';

export async function createPath(absBasePath: string, userInput: string): Promise<string | undefined> {
    let parsedPath: ParsedPath | undefined = parsePath(absBasePath, userInput);
    if (parsedPath) {
        await createFolders(absBasePath, parsedPath.dirsToCreate);
        if (parsedPath.hasFile) {
            return await createFile(parsedPath.absPath);
        }
    }
    return undefined;
}

export async function createFolders(absBasePath: string, dirsToCreate: string[]): Promise<void> {
    if (!dirsToCreate || !dirsToCreate.length) {
        throw ReferenceError('No directories found in parsed path.');
    }

    let dirBuilder: string = absBasePath;
    for (const newDir of dirsToCreate) {
        dirBuilder = path.join(dirBuilder, newDir);
        await FileSystem.createDirectoryIfNotExists(dirBuilder);
    }
}

export async function createFile(absFilePath: string): Promise<string> {
    if (!absFilePath) throw ReferenceError('No file path has been provided.');
    if (await FileSystem.pathExists(absFilePath)) throw Error(`${absFilePath} already exists}`);

    await FileSystem.createFile(absFilePath);
    return absFilePath;
}

export function parsePath(absBasePath: string, inputPath: string): ParsedPath | undefined {
    if (!inputPath) throw ReferenceError('No path has been provided.');

    inputPath = inputPath.trim();
    let normFolderPath = path.normalize(inputPath);
    let absFilePath: string | undefined;
    let filename: string | undefined;

    if (normFolderPath[normFolderPath.length - 1] !== path.sep) {   // path doesn't end on a slash --> contains a file
        filename = path.basename(normFolderPath);
        absFilePath = path.join(absBasePath, normFolderPath);
        normFolderPath = normFolderPath.slice(0, -filename.length); // slice off filename
    }

    normFolderPath = removeTrailingSlashes(normFolderPath);
    let dirsToCreate: string[] = normFolderPath.split(path.sep) || [];
    let hasFile: boolean = absFilePath ? true : false;
    let absPath: string = absFilePath || normFolderPath;
    return { absPath, dirsToCreate, hasFile, filename };
}

function removeTrailingSlashes(normalizedPath: string) {
    return normalizedPath.replace(new RegExp(path.sep + '\\*$'), '');
}

export interface ParsedPath {
    absPath: string,
    dirsToCreate: string[],
    hasFile: boolean,
    filename?: string
}
