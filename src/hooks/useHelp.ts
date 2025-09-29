import { useState, useEffect } from 'react';

export interface HelpArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  readTime: string;
  popularity: number;
  lastUpdated: Date;
  helpful: number;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  views: number;
  category: string;
  videoUrl?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

export interface UseHelpResult {
  articles: HelpArticle[];
  tutorials: Tutorial[];
  faqs: FAQ[];
  loading: boolean;
  error: string | null;
  searchResults: (HelpArticle | Tutorial | FAQ)[];
  markHelpful: (type: string, id: string) => void;
  search: (query: string) => void;
}

const helpArticles: HelpArticle[] = [
  {
    id: '1',
    title: 'Getting Started with OneAI Platform',
    description: 'Complete guide to setting up your OneAI environment with LiteLLM, vLLM, and Ollama integration',
    content: 'Complete setup guide content...',
    category: 'Getting Started',
    readTime: '8 min',
    popularity: 98,
    lastUpdated: new Date('2024-02-15'),
    helpful: 456
  },
  {
    id: '2',
    title: 'Deploying Models with vLLM',
    description: 'Learn how to deploy and manage AI models using vLLM for high-performance inference',
    content: 'Model deployment guide...',
    category: 'Models',
    readTime: '12 min',
    popularity: 94,
    lastUpdated: new Date('2024-02-12'),
    helpful: 389
  }
];

const tutorials: Tutorial[] = [
  {
    id: '1',
    title: 'OneAI Platform Complete Setup',
    description: 'End-to-end setup of OneAI with Docker, LiteLLM, vLLM, and Ollama integration',
    duration: '24:15',
    difficulty: 'beginner',
    views: 18750,
    category: 'Setup'
  }
];

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I deploy OneAI with Docker?',
    answer: 'OneAI uses Docker Compose for easy deployment. Run docker compose -f docker-compose-oneai.yml up -d in the docker directory.',
    category: 'Getting Started',
    helpful: 289
  }
];

export function useHelp(): UseHelpResult {
  const [searchResults, setSearchResults] = useState<(HelpArticle | Tutorial | FAQ)[]>([]);
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});

  const search = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = [
      ...helpArticles.filter(article => 
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.description.toLowerCase().includes(query.toLowerCase())
      ),
      ...tutorials.filter(tutorial =>
        tutorial.title.toLowerCase().includes(query.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(query.toLowerCase())
      ),
      ...faqs.filter(faq =>
        faq.question.toLowerCase().includes(query.toLowerCase()) ||
        faq.answer.toLowerCase().includes(query.toLowerCase())
      )
    ];

    setSearchResults(results);
  };

  const markHelpful = (type: string, id: string) => {
    const key = `${type}-${id}`;
    setHelpfulCounts(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + 1
    }));
  };

  return {
    articles: helpArticles,
    tutorials,
    faqs,
    loading: false,
    error: null,
    searchResults,
    markHelpful,
    search,
  };
}
