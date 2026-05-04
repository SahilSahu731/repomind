/**
 * Contribution Readiness Score
 *
 * Calculates a 0-100 score indicating how easy it is for a new developer
 * to contribute to a repository. Factors in documentation quality,
 * CI/CD setup, issue labels, licensing, and code organization.
 */

interface ContributionScoreInput {
  fileTree: string[];
  readmeContent?: string;
  hasContributing?: boolean;
  hasCodeOfConduct?: boolean;
  hasLicense?: boolean;
  hasCiCd?: boolean;
  hasGoodFirstIssues?: boolean;
  languages?: string[];
  frameworks?: string[];
}

interface ContributionScoreResult {
  total: number;
  hasContributing: boolean;
  hasSetupInstructions: boolean;
  hasCiCd: boolean;
  hasGoodFirstIssues: boolean;
  readmeQuality: number;
  prResponseTime: number;
  hasCodeOfConduct: boolean;
  hasLicense: boolean;
}

const CONTRIBUTING_PATTERNS = [
  /contributing/i,
  /CONTRIBUTING\.md/i,
  /\.github\/CONTRIBUTING/i,
];

const CODE_OF_CONDUCT_PATTERNS = [
  /code.of.conduct/i,
  /CODE_OF_CONDUCT\.md/i,
];

const LICENSE_PATTERNS = [
  /^LICENSE$/i,
  /^LICENSE\.md$/i,
  /^LICENSE\.txt$/i,
  /^LICENCE/i,
];

const CI_CD_PATTERNS = [
  /\.github\/workflows\//i,
  /\.circleci\//i,
  /\.gitlab-ci\.yml$/i,
  /Jenkinsfile$/i,
  /\.travis\.yml$/i,
  /azure-pipelines\.yml$/i,
  /\.buildkite\//i,
];

const SETUP_KEYWORDS = [
  "getting started",
  "installation",
  "install",
  "setup",
  "quick start",
  "prerequisites",
  "development",
  "npm install",
  "yarn install",
  "pip install",
  "docker",
  "docker-compose",
];

export function calculateContributionScore(input: ContributionScoreInput): ContributionScoreResult {
  const files = input.fileTree;
  let score = 0;

  // 1. CONTRIBUTING.md exists (15 points)
  const hasContributing =
    input.hasContributing ??
    files.some((f) => CONTRIBUTING_PATTERNS.some((p) => p.test(f)));
  if (hasContributing) score += 15;

  // 2. CODE_OF_CONDUCT.md exists (5 points)
  const hasCodeOfConduct =
    input.hasCodeOfConduct ??
    files.some((f) => CODE_OF_CONDUCT_PATTERNS.some((p) => p.test(f)));
  if (hasCodeOfConduct) score += 5;

  // 3. LICENSE file exists (10 points)
  const hasLicense =
    input.hasLicense ??
    files.some((f) => LICENSE_PATTERNS.some((p) => p.test(f.split("/").pop() ?? "")));
  if (hasLicense) score += 10;

  // 4. CI/CD configured (15 points)
  const hasCiCd =
    input.hasCiCd ??
    files.some((f) => CI_CD_PATTERNS.some((p) => p.test(f)));
  if (hasCiCd) score += 15;

  // 5. Good first issues (10 points) — default false since we can't check GitHub API in scoring
  const hasGoodFirstIssues = input.hasGoodFirstIssues ?? false;
  if (hasGoodFirstIssues) score += 10;

  // 6. README quality (25 points)
  let readmeQuality = 0;
  const readmeFile = files.find((f) => /^readme\.md$/i.test(f.split("/").pop() ?? ""));
  if (readmeFile) {
    readmeQuality += 5; // README exists

    if (input.readmeContent) {
      const content = input.readmeContent.toLowerCase();
      const length = content.length;

      // Length-based score
      if (length > 2000) readmeQuality += 5;
      else if (length > 500) readmeQuality += 3;

      // Has setup/installation instructions
      const hasSetup = SETUP_KEYWORDS.some((kw) => content.includes(kw));
      if (hasSetup) readmeQuality += 5;

      // Has headings (structured)
      const headingCount = (content.match(/^#{1,3}\s/gm) ?? []).length;
      if (headingCount >= 3) readmeQuality += 5;
      else if (headingCount >= 1) readmeQuality += 2;

      // Has code blocks
      if (content.includes("```")) readmeQuality += 3;

      // Has badges/images
      if (content.includes("![") || content.includes("[![")) readmeQuality += 2;
    }
  }
  readmeQuality = Math.min(25, readmeQuality);
  score += readmeQuality;

  // 7. Setup instructions detection (10 points)
  const hasSetupInstructions =
    input.readmeContent
      ? SETUP_KEYWORDS.some((kw) => input.readmeContent!.toLowerCase().includes(kw))
      : false;
  if (hasSetupInstructions) score += 10;

  // 8. Project structure quality (10 points)
  const hasSrc = files.some((f) => f.startsWith("src/") || f.startsWith("lib/"));
  const hasTests = files.some((f) =>
    /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f) ||
    f.startsWith("tests/") ||
    f.startsWith("test/") ||
    f.startsWith("__tests__/")
  );
  const hasPackageJson = files.some((f) => f === "package.json" || f === "pyproject.toml" || f === "Cargo.toml");

  if (hasSrc) score += 3;
  if (hasTests) score += 4;
  if (hasPackageJson) score += 3;

  // Cap at 100
  const total = Math.min(100, score);

  return {
    total,
    hasContributing,
    hasSetupInstructions,
    hasCiCd,
    hasGoodFirstIssues,
    readmeQuality,
    prResponseTime: 0, // Would need GitHub API data
    hasCodeOfConduct,
    hasLicense,
  };
}
