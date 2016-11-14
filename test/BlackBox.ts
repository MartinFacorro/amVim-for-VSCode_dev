import * as assert from 'assert';
import * as TestUtil from './Util';
import {TextDocument, Selection} from 'vscode';
import {getCurrentMode} from '../src/extension';

export interface TestCase {
    from: string;
    inputs: string;
    to: string;
}

const waitForMillisecond = (millisecond: number) => {
    return new Promise(resolve => {
        setTimeout(() => resolve(), millisecond);
    });
};

const getLine = (text: string, offset: number) => {
    let count = 0;
    let position = -1;

    while (true) {
        position = text.indexOf('\n', position + 1);
        if (position < 0 || position >= offset) { break; }
        count++;
    }

    return count;
};

const getCharacter = (text: string, offset: number) => {
    const textToTheLeft = text.substring(0, offset);
    const lastLineBreakIndex = textToTheLeft.lastIndexOf('\n');

    if (lastLineBreakIndex < 0) {
        return offset;
    }
    else {
        return offset - (lastLineBreakIndex + 1);
    }
};

const extractInfo = (originalText: string) => {
    const selections: Selection[] = [];

    let cleanText = originalText;

    while (true) {
        let hasMatch = false;

        cleanText = cleanText.replace(
            /~?\[([\s\S]*?)\]/m,
            (match: string, content: string, startOffset: number) => {
                hasMatch = true;

                const endOffset = startOffset + match.length - 1;
                const isReversed = match[0] === '~';

                const startLine = getLine(cleanText, startOffset);
                const endLine = getLine(cleanText, endOffset);

                let startCharacter = getCharacter(cleanText, startOffset);
                let endCharacter = getCharacter(cleanText, endOffset);

                if (startLine === endLine) {
                    // Minus `[` mark.
                    endCharacter -= 1;
                }

                if (isReversed) {
                    // Plus `~` mark.
                    startCharacter += 1;
                    // Minus `~` mark.
                    endCharacter -= 1;
                }

                selections.push(isReversed
                    ? new Selection(endLine, endCharacter, startLine, startCharacter)
                    : new Selection(startLine, startCharacter, endLine, endCharacter));

                return content;
            }
        );

        if (!hasMatch) { break; }
    }

    return {
        selections,
        cleanText,
    };
};

let reusableDocument: TextDocument;

export const run = (testCase: TestCase) => {
    const expectation = `${testCase.from} => ${testCase.to} (inputs: ${testCase.inputs})`;

    test(expectation, (done) => {
        const fromInfo = extractInfo(testCase.from);
        const toInfo = extractInfo(testCase.to);
        const inputs = testCase.inputs.split(' ');

        TestUtil.createTempDocument(fromInfo.cleanText, reusableDocument)
        .then(async document => {
            reusableDocument = document;

            TestUtil.setSelections(fromInfo.selections);

            await waitForMillisecond(100);

            for (let i = 0; i < inputs.length; i++) {
                getCurrentMode()!.input(inputs[i]);
                await waitForMillisecond(20);
            }

            try {
                assert.equal(TestUtil.getDocument().getText(), toInfo.cleanText);
                assert.deepEqual(TestUtil.getSelections(), toInfo.selections);
            }
            catch (error) {
                done(error);
                return;
            }

            done();
        });
    });
};
