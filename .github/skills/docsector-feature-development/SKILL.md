---
name: docsector-feature-development
description: 'Create and implement new features in Docsector with initial environment mapping, clarification questions when gaps exist, regression tests, and a README update in the related section. Use when developing functionality, evolving existing behavior, adding new support, or delivering a complete feature in the project.'
argument-hint: 'Describe the feature, expected behavior, and the affected Docsector area'
user-invocable: true
---

# Docsector Feature Development

## When to Use

- Create a new feature in Docsector.
- Evolve existing behavior with functional impact.
- Deliver a change that needs regression coverage and documentation updates.

## Expected Outcome

- The relevant environment was mapped before implementation.
- Blocking questions were clarified, or non-blocking assumptions were made explicit.
- The feature is covered by regression tests in the narrowest possible scope.
- README.md is updated in the related section.
- Executable validation was run for the change, or a limitation was documented.

## Procedure

1. Map the environment.
   - Find the nearest code path that actually decides the feature behavior.
   - Identify relevant files, components, composables, stores, routes, existing tests, and the potentially affected README.md section.
   - Form a local hypothesis: where the change belongs, which test can discriminate the expected behavior, and which narrow validation should be used.

2. Ask when in doubt.
   - If there is ambiguity about expected behavior, scope, naming, user experience, compatibility, or which README section must be updated, ask before editing.
   - Ask only the smallest set of genuinely blocking questions.
   - If the uncertainty is not blocking, proceed with the smallest reasonable assumption and record it in the final summary.

3. Implement regression tests.
   - Write or adjust a test that would fail without the feature and validates the expected behavior once the feature is applied.
   - Prefer the narrowest possible test first: validate the touched slice before broader checks unless they are necessary.
   - After the first substantive edit, immediately run the corresponding focused validation.

4. Implement the feature.
   - Make the smallest change needed to reach the desired behavior.
   - Fix the root cause instead of only working around the symptom.
   - Preserve Docsector's existing style and abstractions.

5. Update README.md.
   - Find the section most closely related to the delivered feature.
   - Document what changed, when to use it, and any relevant impact for project consumers.
   - If there is no exact section, update the nearest canonical section and state that explicitly in the final summary.

6. Validate and close.
   - Run the touched tests and any relevant narrow checks.
   - Summarize what changed, which validations ran, which assumptions were made, and whether any follow-up remains.

## Decisions and Deviations

- If the starting point is only wiring, move to the logic that directly controls the feature.
- If more than one path looks plausible, choose the one that enables the cheapest discriminating test.
- If no test exists yet, create a new one in the nearest behavior scope.
- If README looks affected in more than one place, prefer the canonical section and avoid duplication.

## Completion Criteria

- The necessary context was mapped before implementation.
- Blocking questions were resolved, or the remaining assumptions were made explicit.
- Regression coverage exists for the feature.
- README.md was updated in the related section.
- At least one executable validation was performed, or the limitation was recorded.