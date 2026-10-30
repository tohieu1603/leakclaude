export const WEB_FETCH_TOOL_NAME = 'WebFetch';

export const PROMPT = `IMPORTANT: WebFetch WILL FAIL for authenticated or private URLs. Before using this tool, check if the URL points to an authenticated service (e.g. Google Docs, Confluence, Jira, GitHub). If so, look for a specialized MCP tool that provides authenticated access.

- Fetches content from a specified URL and returns it as plain text along with the prompt to process
- Takes a URL and a prompt as input
- Fetches the URL content, converts HTML to text
- Returns the textual content prefixed with the prompt for the agent to process

Usage notes:
  - The URL must be a fully-formed valid URL
  - HTTP URLs will be automatically upgraded to HTTPS
  - The prompt should describe what information you want to extract from the page
  - This tool is read-only and does not modify any files
  - Results may be summarized if the content is very large
  - Includes a self-cleaning 15-minute cache for faster responses when repeatedly accessing the same URL
  - When a URL redirects to a different host, the tool will inform you and provide the redirect URL — make a new WebFetch request with the redirect URL to fetch the content.
  - For GitHub URLs, prefer using the gh CLI via Bash instead (e.g., gh pr view, gh issue view, gh api).`;
