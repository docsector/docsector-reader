---
description: 'Release a new version: update README, publish to NPM, and update bootgly_docs dependency.'
---

# Release Docsector Reader

## Steps

1. **Review changes since last release**
   - Run `git log $(git describe --tags --abbrev=0)..HEAD --oneline` to list all commits since the last tag.
   - Identify new features, fixes, and breaking changes.

2. **Update `bin/docsector.js` VERSION constant**
   - Update the `VERSION` constant (hardcoded at the top of the file) to match the new release version.

3. **Update README.md**
   - Add any new features to the `✨ Features` section that were implemented since the last release.
   - Keep the existing style: emoji + bold title + dash + description.

4. **Bump version with `npm version` in the `docsector-reader` project root**
   - For a patch release (bug fixes): `npm version patch --no-git-tag-version`
   - For a minor release (new features, no breaking changes): `npm version minor --no-git-tag-version`
   - For a major release (breaking changes): `npm version major --no-git-tag-version`

5. **Commit, tag and push**
   - Stage all changed files: `git add -A`
   - Commit with message: `release: vX.Y.Z`
   - Create a git tag: `git tag vX.Y.Z`
   - Push commits and tags: `git push && git push --tags`

6. **Create GitHub Release**
   - **Language rule:** the release title and body must be written in **English**.
   - **Scope rule:** release notes must describe only `docsector-reader` changes.
   - Include a `## Changes` section and decorate bullet points with emojis.
   - Build release notes from README additions and recent commits.
   - Suggested notes template:
      ```md
      > Focus: Short release summary in English.

      ## Changes
      - ✨ Added ...
      - 🛠️ Fixed ...
      - 📚 Updated docs ...
      - ✅ Validated ...
      ```
   - Create or update release using a notes file:
      ```
      gh release create vX.Y.Z --title "vX.Y.Z" --notes-file /tmp/docsector-release-vX.Y.Z.md
      ```
      ```
      gh release edit vX.Y.Z --title "vX.Y.Z" --notes-file /tmp/docsector-release-vX.Y.Z.md
      ```
   - Confirm release URL:
      ```
      gh release view vX.Y.Z --json url --jq .url
         ```

7. **Publish to NPM**
   - Run `npm publish --access public` from the project root.
   - Confirm the package is published: `npm view @docsector/docsector-reader version`

8. **Push**
   - Push commits and tags:
     ```
     git push && git push --tags
     ```
