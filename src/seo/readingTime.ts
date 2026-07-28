const WORDS_PER_MINUTE = 200;

export function readingTimeFromMarkdown(markdown: string) {
  const wordCount = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_>`~\-\[\]()!]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));

  return { wordCount, minutes, text: `${minutes} min read` };
}
