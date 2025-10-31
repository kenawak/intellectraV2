import dotenv from 'dotenv';
dotenv.config();
import { Exa } from "exa-js";

export type SearchProvider = 'exa' | 'tavily' | 'serper';

export interface SearchResult {
  text: string;
  url: string;
  title?: string;
}

export interface SearchProviderInterface {
  search(query: string, options: SearchOptions): Promise<SearchResult[]>;
}

export interface SearchOptions {
  sites?: string[];
  numResults?: number;
  date?: string;
}

// Exa Search Provider Implementation
class ExaSearchProvider implements SearchProviderInterface {
  private exa: Exa;

  constructor() {
    const apiKey = process.env.EXASEARCH_API_KEY;
    if (!apiKey) {
      throw new Error('EXASEARCH_API_KEY is not configured');
    }
    this.exa = new Exa(apiKey);
  }

  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const { sites = [], numResults = 5, date = "past_30_days" } = options;

    try {
      const searchOptions: any = {
        text: true,
        numResults: sites && sites.length > 0 ? numResults * 2 : numResults, // Get more results if filtering to ensure we have enough after filtering
        date,
      };

      // If sites are specified, filter by them in the API call
      if (sites && sites.length > 0) {
        // Exa API accepts site as an array of domains
        searchOptions.site = sites.map(site => {
          // Remove protocol if present and normalize
          return site.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
        });
      }

      const { results } = await this.exa.searchAndContents(query, searchOptions);

      // First filter out exa.ai results
      let filtered = results.filter(p => !p.url.includes("exa.ai"));

      // Post-process filtering: Ensure results match selected sites
      if (sites && sites.length > 0) {
        const normalizedSites = sites.map(s => 
          s.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
        );
        
        filtered = filtered.filter(result => {
          try {
            const urlObj = new URL(result.url);
            const resultDomain = urlObj.hostname.toLowerCase();
            // Check if the result domain matches any of the selected sites
            return normalizedSites.some(site => {
              // Handle both exact match and subdomain matches
              return resultDomain === site || resultDomain.endsWith('.' + site);
            });
          } catch {
            // If URL parsing fails, check if URL contains the site string
            return normalizedSites.some(site => result.url.toLowerCase().includes(site));
          }
        });
        
        // Limit to requested number after filtering
        filtered = filtered.slice(0, numResults);
      }

      return filtered.map((post) => ({
        text: post.text || '',
        url: post.url,
        title: post.title || undefined,
      }));
    } catch (error) {
      console.error('Exa search error:', error);
      throw error;
    }
  }
}

// Tavily Search Provider Implementation (placeholder for future expansion)
class TavilySearchProvider implements SearchProviderInterface {
  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    // TODO: Implement Tavily API integration
    // For now, return empty results
    console.warn('Tavily search provider not yet implemented');
    return [];
  }
}

// Serper Search Provider Implementation (placeholder for future expansion)
class SerperSearchProvider implements SearchProviderInterface {
  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    // TODO: Implement Serper API integration
    // For now, return empty results
    console.warn('Serper search provider not yet implemented');
    return [];
  }
}

// Search Provider Factory
export class SearchProviderFactory {
  static getProvider(provider: SearchProvider): SearchProviderInterface {
    switch (provider) {
      case 'exa':
        return new ExaSearchProvider();
      case 'tavily':
        return new TavilySearchProvider();
      case 'serper':
        return new SerperSearchProvider();
      default:
        throw new Error(`Unknown search provider: ${provider}`);
    }
  }

  static getAvailableProviders(): SearchProvider[] {
    const available: SearchProvider[] = [];
    
    if (process.env.EXASEARCH_API_KEY) {
      available.push('exa');
    }
    // Add other providers as they are implemented and configured
    // if (process.env.TAVILY_API_KEY) {
    //   available.push('tavily');
    // }
    
    return available;
  }
}

