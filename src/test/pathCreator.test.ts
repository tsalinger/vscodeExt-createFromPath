import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as creator from '../PathCreator';
import * as FileSystem from '../FileSystem';
import * as rmDirRecursively from 'rimraf';

suite("Path Creator", () => {
    const absTestFolderPath: string = path.join(__dirname, 'testFolder');

    suiteSetup(() => {
        rmDirRecursively.sync(absTestFolderPath + "/**/*");
    });

    setup(async () => {
        await FileSystem.createDirectoryIfNotExists(absTestFolderPath);
    });

    teardown(() => {
        rmDirRecursively.sync(absTestFolderPath + "/**/*");
    });

    test('Creates folders with posix, windows, and mixed path separators', async () => {
        const folderFormats: string[] = [
            // posix:
            'a/1/c/',
            'a/b/2/',

            // windows:
            'a\\3\\c\\',
            '4\\b\\c\\',

            // mixed:
            '5/b\\c\\',
            'a\\6/c/',
            'a\\b/7//',
            '8\\b/c\\'
        ];

        for (let folderFormat of folderFormats) {
            let parsedPath: creator.ParsedPath = <creator.ParsedPath>creator.parsePath(absTestFolderPath, folderFormat);
            await creator.createFolders(absTestFolderPath, parsedPath.dirsToCreate);

            const expectedAbsPath = path.join(absTestFolderPath, ...parsedPath.dirsToCreate);
            const exists: boolean = await FileSystem.pathExists(expectedAbsPath);
            assert.ok(exists === true, `${expectedAbsPath} doesn't exist.`);

            rmDirRecursively.sync(path.join(absTestFolderPath, parsedPath.dirsToCreate[0]), { disableGlob: true });
        }
    });


    test('Creates folders and a testFile.txt with posix, windows, and mixed path separators', async () => {
        const folderFormats: string[] = [
            // posix:
            'a/1/c/testFile.txt',

            // windows:
            'a\\b\\2\\testFile.txt',

            // mixed:
            '3/b\\c\\testFile.txt',
            'a\\b/4/testFile.txt',
            'a/5/c/testFile.txt',
            '6\\b/c\\testFile.txt'
        ];

        for (let folderFormat of folderFormats) {
            let parsedPath: creator.ParsedPath = <creator.ParsedPath>creator.parsePath(absTestFolderPath, folderFormat);
            await creator.createFolders(absTestFolderPath, parsedPath.dirsToCreate);
            let absFilePath: string = await creator.createFile(parsedPath.absPath);

            const exists: boolean = fs.existsSync(parsedPath.absPath);
            assert.ok(exists === true, `${parsedPath.absPath} doesn't exist.`);
            assert.ok(parsedPath.absPath === absFilePath, `${parsedPath.absPath} !== ${absFilePath}.`);

            rmDirRecursively.sync(path.join(absTestFolderPath, parsedPath.dirsToCreate[0]), { disableGlob: true });
        }
    });
});