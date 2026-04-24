# ADR REN-01: Renaming Plan (vault-server -> vault-server)

## Context
The project name `vault-server` is being retired in favor of `vault-server` to better reflect its role as the central hub for the VaultWares ecosystem and to simplify the naming convention.

## Decision
We will systematically rename all references to `vault-server` across the entire ecosystem.

## Detailed Plan

### Phase 1: Code & Configuration (Inside Repos)
1. **Search & Replace**:
    - All occurrences of `vault-server` -> `vault-server`
    - All occurrences of `Vault Server` -> `Vault Server`
    - All occurrences of `VAULT_SERVER` -> `VAULT_SERVER`
2. **Package Manifests**:
    - Update `name` in `package.json` across all submodules.
3. **Environment Variables**:
    - Update `.env.example` and local `.env` if applicable.
4. **Documentation**:
    - Update `README.md`, `AGENTS.md`, `INSTRUCTIONS.md`.

### Phase 2: Repository & Submodule Structure
1. **Folder Renaming**:
    - Rename `c:\Users\Administrator\Desktop\Github Repos\vault-server` to `vault-server`.
2. **Submodule Updates**:
    - Update `.gitmodules` in parent repositories (e.g., this repo if it references it).
    - Run `git submodule sync`.

### Phase 3: Infrastructure & CI/CD
1. **GitHub Actions**:
    - Update workflow files if they reference the repo name or paths.
2. **Docker/Registry**:
    - Update image tags and container names if applicable.

## Risk Assessment
- **Breaking Submodules**: Moving the directory may break git references if not handled with `git submodule sync`.
- **Breaking Imports**: Absolute path imports or dynamic lookups based on directory names will fail.
- **CI/CD Cache**: Caches based on repo name paths may be invalidated.

## Validation Criteria
- [ ] All tests pass in all modules.
- [ ] `npm run build` succeeds.
- [ ] Submodule references land in the correct folders.
- [ ] No mention of "pipelines" remains in primary documentation.

## Timeline
Execution to begin immediately following approval of this ADR.
