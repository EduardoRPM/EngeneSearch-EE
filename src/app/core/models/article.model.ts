export interface Citations {
  citation_count: number;
  influential_citation_count: number;
  last_updated: string;
  source: string;
}

export interface FormattedCitations {
  apa: string;
  bibtex: string;
  ris: string;
  pubmed?: string;
}

export interface Article {
  title: string;
  pmcid?: string;
  pmid?: string;
  doi?: string | null;
  results?: string[];
  conclusions?: string[];
  abstract?: string[];
  source: string;
  title_pubmed?: string;
  journal?: string;
  year: string;
  authors: string[];
  keywords: string[];
  mesh_terms: string[];
  topics: string[];
  link: string;
  citations: Citations;
  formatted_citations: FormattedCitations;
  saved: boolean;
}

export interface ArticleWithId extends Article {
  id: string;
}

export interface SearchArticleResult {
  id: string;
  title: string;
  year?: string;
  authors: string[];
  link?: string | null;
  abstractSnippet?: string | null;
  keywords: string[];
  score: number;
}
