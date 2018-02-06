// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
const fs = require('fs');
const path = require('path');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", () => {
    const paths = [
        path.join(__dirname, 'a'),
        path.join(__dirname, 'a', 'b'),
        path.join(__dirname, 'a', 'b', 'c')
    ];

    test('Creates a/b/c in root', () => {
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

        folderFormats.forEach((folderFormat: string) => {
            creator.createFolders(folderFormat);
            paths.forEach(path => assert.ok(fs.existsSync(path), `${path} doesn't exist!`));
            __deleteFolders();
        });
    });

    function __deleteFolders() {
        for (let i = paths.length-1; i != -1; i--) {
            fs.rmdirSync(paths[i]);
        }
    }

    // afterEach(function () {
    //     console.log('Runs after every test in this file');
    //     __deleteFolders();
    // });

});