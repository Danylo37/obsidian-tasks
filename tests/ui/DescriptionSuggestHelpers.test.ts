import {
    applyDescriptionSuggestion,
    filterDescriptionSuggestions,
    findDescriptionSuggestTrigger,
    splitLinkText,
} from '../../src/ui/DescriptionSuggestHelpers';

function triggerAtEnd(text: string) {
    return findDescriptionSuggestTrigger(text, text.length);
}

describe('findDescriptionSuggestTrigger', () => {
    it.each([
        ['#', { type: 'tag', start: 0, query: '' }],
        ['buy milk #sho', { type: 'tag', start: 9, query: 'sho' }],
        ['buy #area/wo', { type: 'tag', start: 4, query: 'area/wo' }],
        ['see [[', { type: 'link', start: 4, query: '' }],
        ['see [[My No', { type: 'link', start: 4, query: 'My No' }],
        ['#tag [[note', { type: 'link', start: 5, query: 'note' }],
    ])('should find trigger in "%s"', (text, expected) => {
        expect(triggerAtEnd(text)).toEqual(expected);
    });

    it.each([
        '',
        'buy milk',
        'buy milk #shop ',
        'issue#12',
        'see [[note]]',
        'see [[note|alias',
        'see [[note#heading',
        '#tag.',
    ])('should not find trigger in "%s"', (text) => {
        expect(triggerAtEnd(text)).toBeNull();
    });

    it('should only look at text before the cursor', () => {
        expect(findDescriptionSuggestTrigger('#tag rest', 3)).toEqual({ type: 'tag', start: 0, query: 'ta' });
        expect(findDescriptionSuggestTrigger('#tag rest', 6)).toBeNull();
    });
});

describe('filterDescriptionSuggestions', () => {
    const candidates = ['home', 'work', 'homework', 'Shopping', 'project/home'];

    it('should rank prefix matches first, case-insensitively', () => {
        expect(filterDescriptionSuggestions(candidates, 'HOME', 10)).toEqual(['home', 'homework', 'project/home']);
        expect(filterDescriptionSuggestions(candidates, 'shop', 10)).toEqual(['Shopping']);
    });

    it('should return everything for an empty query, limited to maxItems', () => {
        expect(filterDescriptionSuggestions(candidates, '', 2)).toEqual(['home', 'work']);
    });
});

describe('applyDescriptionSuggestion', () => {
    function apply(text: string, cursor: number, value: string) {
        const trigger = findDescriptionSuggestTrigger(text, cursor)!;
        return applyDescriptionSuggestion(text, cursor, trigger, value);
    }

    it('should complete a tag and add a trailing space', () => {
        expect(apply('buy milk #sh', 12, 'shopping')).toEqual({ text: 'buy milk #shopping ', cursor: 19 });
    });

    it('should not duplicate an existing space after a tag', () => {
        expect(apply('#sh milk', 3, 'shopping')).toEqual({ text: '#shopping milk', cursor: 10 });
    });

    it('should complete a link', () => {
        expect(apply('see [[My', 8, 'My Note')).toEqual({ text: 'see [[My Note]]', cursor: 15 });
    });

    it('should replace the rest of a partially typed link, including its closing brackets', () => {
        expect(apply('see [[My]] now', 8, 'My Note')).toEqual({ text: 'see [[My Note]] now', cursor: 15 });
        expect(apply('see [[]]', 6, 'Note')).toEqual({ text: 'see [[Note]]', cursor: 12 });
    });

    it('should not touch a later link', () => {
        expect(apply('[[a and [[b]]', 3, 'abc')).toEqual({ text: '[[abc]] and [[b]]', cursor: 7 });
    });
});

describe('splitLinkText', () => {
    it.each([
        ['Note', { name: 'Note', folder: '' }],
        ['Projects/Steam/01 Plan', { name: '01 Plan', folder: 'Projects/Steam' }],
    ])('should split "%s"', (linkText, expected) => {
        expect(splitLinkText(linkText)).toEqual(expected);
    });
});
