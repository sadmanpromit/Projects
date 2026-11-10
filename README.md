# Projects

Collection of individual project folders. Each folder's own instructions and tests remain authoritative for that project. GitHub `main` is the source of truth for source changes; temporary branches, local checkouts, private data and build outputs are not durable delivery.

## Smallest-change GitHub completion rule

For each authorized change, first reconcile the latest remote `main`, open PRs and existing unpublished work so repeated automated prompts do not restart the same task. Implement the **smallest safely testable slice**, run relevant tests and security/release checks, publish a scoped PR, and **fix actionable merge blockers first** (conflicts, stale branch, tests or CI). Merge the reviewed change into `main`, verify the exact remote commit and canonical checkout, and only then remove task-owned inactive worktrees, proven-merged branches and redundant temporary outputs. Do not start another dependent slice while a fixable prior PR is unfinished. Never delete the only copy of unique work.

If access, a provider, security approval, tool availability, disk space or a nondelegable human action genuinely blocks the task after permitted repairs, preserve all safely publishable work and an actionable GitHub Issue/PR checkpoint. If the project already has an owner notifications document, write one deduplicated entry identifying the failure, safe attempts, owner action and objective retry trigger; never include credential values. Then advance an independent task, and retry the original authorized operation after the owner resolves the block. Do not bypass current safety refusals. Merging source does **not** authorize production deployment, irreversible changes or publication.
