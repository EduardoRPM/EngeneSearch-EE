import { Article } from '../models/article.model';

export const deriveArticleId = (article: Article, index: number): string => {
  const candidates = [article.pmid, article.pmcid, article.doi, article.title, article.title_pubmed]
    .map((value) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : null))
    .filter((value): value is string => Boolean(value));

  if (candidates.length > 0) {
    return candidates[0];
  }

  return `article-${index}`;
};

export const formatAuthor = (authors: string[]): string | undefined => {
  if (!Array.isArray(authors) || authors.length === 0) {
    return undefined;
  }

  if (authors.length === 1) {
    return authors[0];
  }

  const displayed = authors.slice(0, 3).join(', ');
  return authors.length > 3 ? `${displayed}…` : displayed;
};

export const buildDescription = (article: Article): string | undefined => {
  const sections = [...(article.abstract ?? []), ...(article.results ?? [])].filter((section) => section && section.trim().length > 0);

  const text = sections[0];
  if (!text) {
    return undefined;
  }

  return text.length > 260 ? `${text.slice(0, 257)}…` : text;
};
