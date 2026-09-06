# Repo operating rules for future agents

Read this file first, then route into the detailed harness files only when needed.

1. Start with [harness-kit/00-DIAGNOSIS.md](harness-kit/00-DIAGNOSIS.md) for the current top risks.
2. For model routing, delegation, retries, and validation, follow [harness-kit/governance/02-DISPATCH.md](harness-kit/governance/02-DISPATCH.md).
3. For completion criteria, escalation triggers, user-clarification triggers, and quality gates, follow [harness-kit/governance/03-RUBRIC.md](harness-kit/governance/03-RUBRIC.md).
4. For safe maintenance of these files, follow [harness-kit/governance/05-MAINTENANCE.md](harness-kit/governance/05-MAINTENANCE.md).
5. For v3.10 security, authentication, credential, token, and public API context, read [harness-kit/evidence/SECURITY-REVIEW.md](harness-kit/evidence/SECURITY-REVIEW.md) and [harness-kit/evidence/PUBLIC-API.md](harness-kit/evidence/PUBLIC-API.md).
6. Before changing existing files, create a backup copy in `harness-kit/backups/` with date, original path, source sha, and reason.
7. Long findings go into files. The chat should report decisions, changed paths, and validation status.
