import * as assert from 'assert';
import * as path from 'path';
import { InputBox } from '../InputBox';


suite('InputBox', async () => {
    test('Validation: folder existance', async () => {
        const baseDir = path.dirname(__dirname);  // == ${workspaceFolder}/out/
        const inputBox = new InputBox(baseDir);

        let exists = await inputBox.validateInput('test');
        let doesntExist = await inputBox.validateInput('not_existing_dir');

        assert.ok(exists);
        assert.ok(!doesntExist);
    });

    test('Validation: rejecting absolute paths', async () => {
        const baseDir = path.dirname(__dirname);  // == ${workspaceFolder}/out/
        const inputBox = new InputBox(baseDir);

        const absolutePaths: string[] = [
            'c:\\',
            'c:/',
            'z:\\',
            'z:/',

            '/c:\\',
            '\\c:\\'
        ]

        for (let absPath of absolutePaths) {
            let result: string | null = await inputBox.validateInput(absPath);
            assert.ok(typeof (result) === 'string', `'${absPath}' is not detected as absolute path.`);
        }
    });

    test('Validation: valid paths', async () => {
        const baseDir = path.dirname(__dirname);  // == ${workspaceFolder}/out/
        const inputBox = new InputBox(baseDir);

        const allowedPaths = [
            'contains spaces',
            'contains_underscores',
            'contains-hypens',
        ];

        for (let allowedPath of allowedPaths) {
            let result: string | null = await inputBox.validateInput(allowedPath);
            assert.ok(result === null, `'${allowedPath}' did not pass the validation.`);
        }

    });

    test('Trimming exceedingly long paths in UI: ellipsis are added and prompt is trimmed if max length is reached', async () => {
        const inputBox = new InputBox();
        let testData: Array<number> = [];
        for (let i = 0; i < inputBox.maxPromptChars; i++) { testData.push(i) };

        let result = inputBox.trimToMaxLength(testData.join(''));

        assert.equal(result.substring(0, 3), '...');
        assert.equal(result.length, inputBox.maxPromptChars);
    });
});