# Rule and Finding Reference

## Rule locations

The rule manager currently loads YAML files from:

- `server/data/rules/core/`
- `server/data/rules/frameworks/`

A core rule describes an identifier, name, severity, description, sink patterns, source patterns, and optional sanitizers. The current source files define five core rule IDs: `command-injection`, `hardcoded-secret`, `insecure-csp`, `path-traversal`, and `sql-injection`. The Django framework file is currently a placeholder.

## Matching model

The analyzer walks Python Tree-sitter syntax nodes. It searches call expressions and assignments for configured sink names, then applies simple source/sanitizer checks to nearby expressions. This is a heuristic, local, intra-procedural approximation; it does not model arbitrary inter-procedural flows, frameworks, runtime values, or all sanitization semantics.

A reported diagnostic is a review lead, not proof of exploitability. A missing diagnostic is not proof of safety. Validate findings against the actual code and applicable secure-coding guidance.

## Diagnostic mapping

The analyzer maps high-confidence findings to LSP Error severity and medium/low-confidence findings to Warning severity. Rule severity and confidence are separate fields; the current diagnostic mapping is based on confidence.

## Quick-fix templates

Fix definitions are loaded from `server/data/fixes/`. The current checked-in catalog is `sql-injection-fixes.yml`; there is no equivalent fix catalog for every rule. The provider matches a regular expression against the diagnostic range and returns a text edit. Review every suggested edit before accepting it.

## Rule authoring checklist

1. Assign a stable kebab-case ID and describe the risky pattern precisely.
2. Choose sink patterns that match the analyzer's actual syntax matching behavior.
3. Keep source/sanitizer lists evidence-based and narrow.
4. Set confidence conservatively and explain the limitations.
5. Add benign and vulnerable fixtures to the local test runner.
6. Validate with the project's test command and review false positives before a rule is promoted.

The schema is consumed as YAML; adding fields to a rule file does not make the engine interpret those fields unless the TypeScript implementation supports them.
