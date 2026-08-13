import assert from "node:assert/strict";
import test from "node:test";
import {
  parseGitHubRepositoryUrl,
  repoIdentityKey,
} from "./github.ts";

test("parses a repository URL without leaking query or hash into its name", () => {
  assert.deepEqual(
    parseGitHubRepositoryUrl("https://github.com/facebook/react?tab=readme#readme"),
    {
      owner: "facebook",
      repo: "react",
      branch: "HEAD",
      url: "https://github.com/facebook/react",
    }
  );
});

test("prefers the branch detected from GitHub's UI, including slash branches", () => {
  assert.equal(
    parseGitHubRepositoryUrl(
      "https://github.com/acme/widget/tree/feature/new-panel/src",
      "feature/new-panel"
    )?.branch,
    "feature/new-panel"
  );
});

test("rejects GitHub pages that are not repositories", () => {
  assert.equal(parseGitHubRepositoryUrl("https://github.com/settings/profile"), null);
  assert.equal(parseGitHubRepositoryUrl("https://example.com/acme/widget"), null);
});

test("repository identity includes branch and normalizes owner/name casing", () => {
  const repo = parseGitHubRepositoryUrl("https://github.com/Acme/Widget", "release/v2");
  assert.ok(repo);
  assert.equal(repoIdentityKey(repo), "acme/widget@release/v2");
});
