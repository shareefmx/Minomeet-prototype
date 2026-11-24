/**
 * Centralized Application & Repository Configuration (Web Client)
 * Single source of truth for GitHub repository coordinates and derived URLs.
 */

export const GITHUB_OWNER = 'shareefmx';
export const GITHUB_REPO = 'minomeet';
export const GITHUB_REPO_LEGACY_ALIAS = 'minomeet';

// Derived GitHub URLs
export const REPO_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;
export const RELEASES_URL = `${REPO_URL}/releases`;
export const LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
export const ISSUES_URL = `${REPO_URL}/issues`;
export const CHANGELOG_URL = `${REPO_URL}/blob/main/CHANGELOG.md`;
export const AUTHOR_URL = `https://github.com/${GITHUB_OWNER}`;

/**
 * Validates that an external URL is strictly HTTPS and hosted on github.com
 */
export function isSafeGithubUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'github.com';
  } catch {
    return false;
  }
}

/**
 * Builds a prefilled issue URL on GitHub with system specs (excluding all private data)
 */
export function buildNewIssueUrl(params: {
  version: string;
  os: string;
  arch: string;
}): string {
  const title = encodeURIComponent('[Bug]: ');
  const body = encodeURIComponent(
`### Environment
- **Client Version:** ${params.version}
- **Operating System:** ${params.os}
- **Architecture:** ${params.arch}

### Description
<!-- A clear and concise description of the bug. -->

### Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

### Expected Behavior
<!-- What did you expect to happen? -->

### Actual Behavior
<!-- What actually happened? -->
`
  );
  return `${ISSUES_URL}/new?title=${title}&body=${body}`;
}
