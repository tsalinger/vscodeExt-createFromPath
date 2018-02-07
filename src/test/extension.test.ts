// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as myExtension from '../extension';
import { InputBox } from '../InputBox';


/**
 * TODO:
 * - add test for newFoldersCommand
 * 
 */

// Defines a Mocha test suite to group tests of similar kind together
suite("Folder Creator", () => {
    const paths = [
        path.join(__dirname, 'a'),
        path.join(__dirname, 'a', 'b'),
        path.join(__dirname, 'a', 'b', 'c')
    ];

    setup(() => {});
    teardown(() => {
        __deleteFolders();
    });

    test('Creates a/b/c in root', async () => {
        const creator = new myExtension.FolderCreator(__dirname);
        const folderFormats: string[] = [
            // posix:
            'a/b/c',
            'a/b/c/',

            // windows:
            'a\\b\\c',
            'a\\b\\c\\',

            // mixed:
            'a/b\\c',
            'a\\b/c',
            'a\\b/c//',
            'a\\b/c\\'
        ];

        folderFormats.forEach(async (folderFormat: string) => {
            await creator.createFolders(folderFormat, );
            paths.forEach(path => assert.ok(fs.existsSync(path), `${path} doesn't exist!`));
            __deleteFolders();
        });
    });

    function __deleteFolders() {
        for (let i = paths.length-1; i != -1; i--) {
            try {
                fs.rmdirSync(paths[i]);
            } catch(e) {
                // folder has already been successfully deleted in the test
            }
        }
    }
});

suite('InputBox', async () => {
    test('Test validation', async () => {
        const baseDir = path.dirname(__dirname);  // == ${workspaceFolder}/out/
        const inputBox = new InputBox(baseDir);
        let exists = await inputBox.validateInput('test');
        let doesntExist = await inputBox.validateInput('not_existing_dir');
        assert.ok(exists);
        assert.ok(!doesntExist);
    });
});