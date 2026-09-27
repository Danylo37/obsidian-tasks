export type DescriptionSuggestType = 'tag' | 'link';

export interface DescriptionSuggestTrigger {
    type: DescriptionSuggestType;
    start: number;
    query: string;
}

export interface DescriptionSuggestSources {
    tags: () => string[];
    links: () => string[];
}

export const noDescriptionSuggestSources: DescriptionSuggestSources = {
    tags: () => [],
    links: () => [],
};

/**
 * Find a tag (`#tag`) or wikilink (`[[note`) being typed immediately before the cursor.
 */
export function findDescriptionSuggestTrigger(text: string, cursor: number): DescriptionSuggestTrigger | null {
    const beforeCursor = text.slice(0, cursor);

    const link = beforeCursor.match(/\[\[([^[\]|#^]*)$/);
    if (link) {
        return { type: 'link', start: cursor - link[0].length, query: link[1] };
    }

    const tag = beforeCursor.match(/(?:^|\s)(#[^\s#!@$%^&*(),.?":{}|<>[\]`'+=;\\]*)$/);
    if (tag) {
        return { type: 'tag', start: cursor - tag[1].length, query: tag[1].slice(1) };
    }

    return null;
}

/**
 * Case-insensitive match, with values starting with the query ranked first.
 */
export function filterDescriptionSuggestions(candidates: string[], query: string, maxItems: number): string[] {
    const lowerQuery = query.toLowerCase();
    const prefixMatches: string[] = [];
    const otherMatches: string[] = [];
    for (const candidate of candidates) {
        const lowerCandidate = candidate.toLowerCase();
        if (lowerCandidate.startsWith(lowerQuery)) {
            prefixMatches.push(candidate);
        } else if (lowerCandidate.includes(lowerQuery)) {
            otherMatches.push(candidate);
        }
    }
    return [...prefixMatches, ...otherMatches].slice(0, maxItems);
}

export function applyDescriptionSuggestion(
    text: string,
    cursor: number,
    trigger: DescriptionSuggestTrigger,
    value: string,
): { text: string; cursor: number } {
    const start = text.slice(0, trigger.start);
    const after = text.slice(cursor);
    if (trigger.type === 'link') {
        const rest = after.replace(/^[^[\]]*\]\]/, '');
        const before = `${start}[[${value}]]`;
        return { text: before + rest, cursor: before.length };
    }
    const before = `${start}#${value.replace(/^#/, '')} `;
    return { text: before + after.replace(/^ /, ''), cursor: before.length };
}

/**
 * Split link text into the note name and its folder, so a long path does not hide which note it is.
 */
export function splitLinkText(linkText: string): { name: string; folder: string } {
    const slash = linkText.lastIndexOf('/');
    return { name: linkText.slice(slash + 1), folder: linkText.slice(0, Math.max(slash, 0)) };
}
