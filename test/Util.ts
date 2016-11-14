import {workspace, window, Uri, TextDocument, TextEditor, Position, Range, Selection} from 'vscode';

export function createTempDocument(content?: string, reusableDocument?: TextDocument): Thenable<TextDocument> {
    let getTextEditor: Thenable<TextEditor>;

    if (reusableDocument && window.activeTextEditor.document === reusableDocument) {
        getTextEditor = Promise.resolve(window.activeTextEditor);
    }
    else {
        const uri = Uri.parse(`untitled:${__dirname}.${Math.random()}.tmp`);
        getTextEditor = workspace.openTextDocument(uri)
            .then(document => window.showTextDocument(document));
    }

    return getTextEditor.then(textEditor => {
        if (content) {
            return textEditor.edit(editBuilder => {
                editBuilder.replace(new Range(
                    0, 0,
                    textEditor.document.lineCount, 0
                ), content);
            })
            .then(() => textEditor.document);
        }

        return textEditor.document;
    });
}

export function getDocument(): TextDocument {
    return window.activeTextEditor.document;
}

export function setPosition(position: Position): void {
    setPositions([position]);
}

export function setPositions(positions: Position[]): void {
    window.activeTextEditor.selections = positions.map(position => {
        return new Selection(position, position);
    });
}

export function setSelection(selection: Selection): void {
    setSelections([selection]);
}

export function setSelections(selections: Selection[]): void {
    window.activeTextEditor.selections = selections;
}

export function getPosition(): Position {
    const activeEditor = window.activeTextEditor;

    if (activeEditor.selections.length > 1) {
        throw Error('Multiple selections detacted.');
    }
    if (!activeEditor.selection.isEmpty) {
        throw Error('Selection is not empty.');
    }

    return activeEditor.selection.active;
}

export function getPositions(): Position[] {
    const activeEditor = window.activeTextEditor;

    const positions: Position[] = [];

    for (let i = 0; i < activeEditor.selections.length; i++) {
        const selection = activeEditor.selections[i];

        if (!selection.isEmpty) {
            throw Error('Non-empty selection detacted.');
        }

        positions.push(selection.active);
    }

    return positions;
}

export function getSelection(): Selection {
    const activeEditor = window.activeTextEditor;

    if (activeEditor.selections.length > 1) {
        throw Error('Multiple selections detacted.');
    }

    return activeEditor.selection;
}

export function getSelections(): Selection[] {
    return window.activeTextEditor.selections;
}
