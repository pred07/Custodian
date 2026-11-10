# Development and Validation

## Prerequisites

- Node.js 18 or later for the server
- VS Code 1.85 or later for the extension host
- npm for dependency installation

## Build

From the repository root:

```bash
cd server && npm ci && npm run build
cd ../client && npm ci && npm run build
```

The extension launch configuration opens the repository root as the workspace. In VS Code, press **F5** and open a Python file in the Extension Development Host.

## Local fixture runner

From the repository root, run the TypeScript fixture runner after dependencies are installed:

```bash
cd server
npx ts-node test/runner.ts
```

The fixtures exercise a small set of Python examples. They do not establish broad language coverage, production reliability, or false-positive rates. The repository workflow named `update-rules.yml` is an update automation workflow, not a general CI test badge.

## Rule synchronization

`scripts/sync-semgrep-rules.ts` is a separate networked developer tool. Review source licensing and changes before accepting synchronized rules. The current updater checks release metadata but has placeholder configuration and does not install downloaded rules.

## Packaging status

The client defines a `package` script that can produce a `.vsix`, but no released `.vsix` artifact is included in this repository snapshot. No demo GIF or root `LICENSE` file is present.
