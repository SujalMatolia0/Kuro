import { createHighlighter } from 'shiki';

let highlighterInstance: any = null;

export const getHighlighter = async () => {
  if (highlighterInstance) return highlighterInstance;

  try {
    highlighterInstance = await createHighlighter({
      themes: ['aurora-x'], // We'll use aurora-x as it matches our hacker aesthetic well
      langs: ['javascript', 'typescript', 'json', 'sql', 'java', 'apex', 'xml', 'css', 'html', 'python', 'yaml']
    });
    return highlighterInstance;
  } catch (error) {
    console.error('Failed to load Shiki highlighter:', error);
    return null;
  }
};
