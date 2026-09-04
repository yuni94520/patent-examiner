VOCAL — Patent Examiner Scoring Rules

Version: 3.8.2
Status: scoring governance / high-relevance preservation

Purpose

VOCAL defines non-negotiable scoring rules for the Patent Examiner project. It exists to prevent a technically relevant prior-art reference from being discarded only because one narrow claim limitation, numeric range, or dependent-claim feature receives a very low element score.

The rules in this file are governance rules. They should be implemented consistently in both UI explanations and scoring code. Do not hard-code a specific patent number or force a target score for one test case.

Rule 1 — Evidence-First is mandatory for long documents

For a full specification, detailed description, or long citation, never compute an element score against the entire citation text directly.

Required flow:

Split the claim into technically meaningful claim elements.

Split the citation into patent-aware passages.

Retrieve Top-K evidence passages for every claim element.

Compute the element score from the best evidence passage.

Retain Top-3 passages for audit and debugging.

Build focused_citation only from retrieved evidence passages before calculating structural / 8D similarity.

A low score produced from whole-document dilution is invalid for final detailed evaluation.

Rule 2 — Independent claims must be evaluated separately

When the user pastes Claim 1–10 or another multi-claim set, do not concatenate all claims into one giant claim for scoring.

Required behavior:

Detect independent claims.

Evaluate each independent claim separately.

Dependent claims may contribute secondary limitations, but they must not automatically hard-kill the parent independent claim during prior-art screening.

Report best_matching_claim and, when possible, per-independent-claim scores.

Example:

Claim 1: device / transistor structure

Claim 6: manufacturing method

A manufacturing prior art may be highly relevant to Claim 6 even if it is weaker for Claim 1.

Rule 3 — Critical features have higher screening priority than generic elements

Claim features are not equally discriminative.

Critical / high-discrimination features

Examples:

regrowth / re-growth / regrown layer / 再生長 / 再成長

p-GaN / p-type GaN / p型氮化鎵

specific gate-source or gate-drain placement

spaced apart / non-contact / 相隔距離 / 未物理接觸

etch + regrowth process combination

lithography / mask-defined regrowth region

Medium-discrimination architecture

Examples:

barrier layer

channel layer

heteroepitaxial structure

HEMT

cap layer

Generic elements

Examples:

substrate

gate

source

drain

electrode

semiconductor layer

Secondary / dependent numeric limitations

Examples:

1–50 nm

50–5000 nm

Critical features must contribute more to relevance ranking than generic elements and isolated numeric ranges.

Rule 4 — Element Min must not be a universal hard gate

element_min is a warning signal, not an automatic rejection signal in every context.

Screening mode

In batch / prior-art screening mode:

NEVER hard-cap the final score solely because element_min == 0.

Display the weakest element as a warning.

Preserve missing limitations in the explanation.

Rank documents by critical-feature relevance, evidence similarity, process similarity, architecture similarity, and coverage.

Detailed mode

In single-document detailed comparison mode, Min Gate may be used only after Evidence-First retrieval.

Even in detailed mode, apply Rule 5 before using the hard gate.

Rule 5 — Critical-Feature Override

A detailed comparison must trigger CRITICAL_FEATURE_OVERRIDE when all of the following are true:

At least one high-discrimination claim concept is present in the claim.

The citation contains direct evidence for the same canonical concept.

At least two independent technical dimensions strongly match, such as:

regrowth + etch,

regrowth + p-GaN,

regrowth + HEMT architecture,

process + electrode arrangement.

The low element_min is caused mainly by a secondary limitation, numeric range, dependent-claim feature, or a narrow spatial parameter rather than by absence of the central inventive mechanism.

When triggered:

Do NOT allow the Min Gate to collapse the final detailed score into the low-relevance range by itself.

Keep the missing element visible.

Recalculate the detailed result using the override floor defined below.

Override floor

Let:

core_score = 0.40 * critical + 0.25 * semantic + 0.20 * process + 0.15 * architecture

Then:

override_floor = core_score * 0.80

The detailed final score must be at least:

max(normal_detailed_score, override_floor)

provided that CRITICAL_FEATURE_OVERRIDE is true.

This is not a finding of anticipation, novelty, or inventive step. It means only that the reference is too technically relevant to be discarded as low relevance.

Rule 6 — Numeric limitations cannot erase a central technical match

A missing numeric limitation may reduce a score, but it must not erase a strong match to the central technical mechanism.

Example:

Claim includes:

regrowth layer,

p-GaN platform,

gate-source / gate-drain region placement,

thickness 1–50 nm,

spacing 50–5000 nm.

Citation directly discloses:

regrowth process,

regrown semiconductor layer,

p-type GaN structure,

HEMT architecture,

etching and electrode formation,

but does not disclose the exact 1–50 nm or 50–5000 nm range.

Required outcome:

Mark the numeric limitations as missing.

Reduce numeric / dependent-feature score.

Do not classify the citation as globally low relevance solely for this reason.

Rule 7 — Canonical technical concepts must normalize spelling and language variants

The following must map to the same canonical concept when technically appropriate:

REGROWTH

再生長

再成長

re-growth

regrowth

regrown

regrown layer

regrowth layer

epitaxial regrowth

P_GAN

p型氮化鎵

p-GaN

p type GaN

p-type GaN

p-type gallium nitride

BARRIER_LAYER

位障層

阻障層

barrier layer

AlGaN barrier

ETCH

蝕刻

etch

etching

etched

dry etch

plasma etch

LITHOGRAPHY_MASK

微影

光罩

保護光罩

lithography

photolithography

mask

photoresist

Do not treat orthographically different forms as unrelated merely because trigram overlap is low.

Rule 8 — High-value process pairs receive explicit recognition

The engine should recognize combinations that are more meaningful together than independently.

Examples:

ETCH + REGROWTH

LITHOGRAPHY_MASK + REGROWTH

P_GAN + REGROWTH

BARRIER_LAYER + REGROWTH

HEMT + REGROWTH

When a claim and citation share one of these process / architecture pairs, increase critical or process confidence. This should be implemented as concept-pair evidence, not as a patent-number-specific bonus.

Suggested pair bonus before final normalization:

one matched high-value pair: +6 points to the relevant dimension

two or more matched high-value pairs: +10 points maximum

Final dimension scores remain capped at 100.

Rule 9 — Detailed score and legal conclusion are different things

A score is a technical-relevance measure.

The engine must not equate:

80 points = lack of novelty

70 points = obviousness

20 points = irrelevant as a matter of law

A reference can be technically highly relevant while still missing one legally required claim element.

Therefore UI wording must distinguish:

Technical Relevance Score

Element Coverage

Missing Limitations

Weakest Element

Do not label a high relevance score as a final patentability conclusion.

Rule 10 — Exception handling must be explainable

Whenever CRITICAL_FEATURE_OVERRIDE is triggered, the UI / audit trail must record:

override_triggered: true

matched critical concepts

matched concept pairs

original detailed score

override floor

final detailed score

weakest element

missing limitations

top supporting evidence passages

Example audit object:

{
  "override_triggered": true,
  "matched_critical_concepts": ["REGROWTH", "P_GAN", "ETCH"],
  "matched_pairs": ["ETCH+REGROWTH", "P_GAN+REGROWTH"],
  "original_detailed_score": 18.6,
  "override_floor": 57.4,
  "final_detailed_score": 57.4,
  "weakest_element": 0,
  "missing_limitations": ["50–5000 nm spacing"],
  "reason": "central technical mechanism strongly matched; low Min caused by secondary limitation"
}

Rule 11 — High-Relevance Preservation Band

The engine MUST preserve a technically high-relevance reference in the manual-review band when the evidence supports it.

The rule is triggered when:

CRITICAL_FEATURE_OVERRIDE is already true; and

at least one of the following is true:

Evidence-First screening score is at least 72;

core_score is at least 72;

two or more high-value concept pairs match, with critical >= 75 and process >= 70.

When triggered:

HIGH_RELEVANCE_PRESERVATION = true

and:

final_detailed_score = max(normal_detailed_score, 75, override_floor)

The preservation floor is capped below 100 and does not assert novelty, inventive step, or anticipation. It means only: the citation is too relevant to be discarded automatically and must remain in the human-review set.

The engine MUST NOT use a patent publication number, application number, assignee, or a single literal keyword as the trigger. The trigger must come from reproducible evidence dimensions and matched canonical concept pairs.

Examples of qualifying evidence:

REGROWTH + ETCH

REGROWTH + P_GAN

REGROWTH + HEMT

REGROWTH + BARRIER_LAYER

REGROWTH + LITHOGRAPHY_MASK

A low numeric or dependent limitation remains visible as a missing limitation, but cannot demote a qualifying high-relevance reference below the 75-point must-review band.

Rule 12 — Regression test requirement

Before changing weights or gates, keep a small labeled regression set with expected score bands.

Each test case should define:

claim text

citation text

expected relevance band

critical concepts expected to match

missing limitations expected to remain visible

Recommended bands:

75–100: highly relevant / must review

55–74: materially relevant / review

35–54: partially related

0–34: weak relation

A scoring change should not be merged if a reference independently labeled as highly relevant (75–100) is demoted below the 75-point must-review band solely because of one numeric, dependent, or narrow spatial limitation while its central technical mechanism is strongly matched.

Current priority rule

For v3.8.x, the highest-priority correction is:

If Evidence-First retrieval confirms a high-relevance reference and the preservation trigger is met, a zero or very low Element Min caused by secondary / numeric limitations must not demote that reference below the 75-point must-review band.

The missing limitation must remain visible; the reference must remain reviewable.
