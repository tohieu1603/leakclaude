export const WEB_SEARCH_TOOL_NAME = 'WebSearch';

export function getPrompt(): string {
  const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  return `
- Allows the agent to search the web and use the results to inform responses
- Provides up-to-date information for current events and recent data
- Returns search result information formatted as plain text with title, URL, and snippet
- Use this tool for accessing information beyond the model's knowledge cutoff

CRITICAL REQUIREMENT - You MUST follow this:
  - After answering the user's question, you MUST include a "Sources:" section at the end of your response
  - In the Sources section, list all relevant URLs from the search results as markdown hyperlinks: [Title](URL)
  - This is MANDATORY - never skip including sources in your response
  - Example format:

    [Your answer here]

    Sources:
    - [Source Title 1](https://example.com/1)
    - [Source Title 2](https://example.com/2)

Usage notes:
  - Domain filtering is supported via allowed_domains and blocked_domains
  - The search is performed via Brave (if BRAVE_SEARCH_API_KEY is set) with DuckDuckGo as a fallback

IMPORTANT - Use the correct year in search queries:
  - The current month is ${month}. You MUST use this year when searching for recent information, documentation, or current events.
  - Example: If the user asks for "latest React docs", search for "React documentation" with the current year, NOT last year
`;
}
