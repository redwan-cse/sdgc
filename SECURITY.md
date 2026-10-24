# Security Policy

The Saugatuck-Douglas Garden Club (SDGC) takes the security of its members, volunteers, donors, and web infrastructure seriously. This document outlines our security policies, supported versions, and the process for reporting vulnerabilities.

---

## Supported Versions

We provide active security updates, vulnerability patches, and dependency maintenance for the following versions:

| Version | Supported          | Notes                                   |
| ------- | ------------------ | --------------------------------------- |
| 1.3.x   | :white_check_mark: | Current active release (Next.js 16.4.2) |
| < 1.3   | :x:                | Deprecated / unsupported                |

---

## Reporting a Vulnerability

If you discover a security vulnerability or suspect an unauthorized access vector in the SDGC web application, please disclose it responsibly. **Do not create public GitHub issues or discussions for sensitive security disclosures.**

### Preferred Reporting Channels

1. **GitHub Private Vulnerability Reporting (Recommended)**:
   - Navigate to the repository's [Security Advisory](https://github.com/sdgcmich/sdgc-web/security/advisories) tab.
   - Click **Report a vulnerability** to open a confidential disclosure report directly with the engineering maintainers.

2. **Email Security Contact**:
   - Send an encrypted or direct email to `sdgcmich@gmail.com`.
   - Use the subject line: `[SECURITY] Vulnerability Report - sdgc-web`.

### What to Include

To help us triage and resolve the issue quickly, please provide:

- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- Affected URLs, endpoints, server actions, or component paths.
- Details of your environment (browser, OS, device, tools used).
- Any recommended remediation or mitigation steps, if known.

### Response SLA & Coordination

- **Initial Response**: We aim to acknowledge receipt of security reports within **48 hours**.
- **Assessment & Triage**: We will confirm validity, determine severity, and communicate an expected remediation timeline within **5 business days**.
- **Patch & Release**: Critical vulnerabilities will be patched with high priority, followed by a public advisory crediting the reporter (with their consent).
- **Public Disclosure**: We ask that reporters maintain confidentiality until a verified patch has been deployed to production.

---

## Security Architecture & Defenses

The SDGC web platform incorporates defensive security controls across all architectural tiers:

1. **Multi-Factor Authentication (MFA / AAL2)**:
   - High-privilege administrative functions and member profile actions enforce Authenticator Assurance Level 2 (AAL2) via time-based one-time password (TOTP) algorithms.
   - Unenrolling MFA requires explicit password re-authentication.

2. **Row Level Security (RLS)**:
   - Supabase PostgreSQL database tables enforce granular Row Level Security policies.
   - Public users can only read approved public data; member directory queries respect individual privacy preferences; administrative mutations require verified `admin` or `superadmin` claims.

3. **Input Validation & Sanitization**:
   - All server actions and API boundaries validate payloads strictly through Zod schemas.
   - User-supplied text and markdown content are rendered using sanitized AST parsers preventing arbitrary script injection (XSS).

4. **Session & Cookie Security**:
   - Authentication tokens are handled via secure, `HttpOnly`, `SameSite=Lax` cookies with SSL enforcement.
   - Telemetry and sensitive environment secrets are strictly segregated from client bundles.

5. **Financial & Payment Isolation**:
   - Payment card data is never processed or stored directly on SDGC servers.
   - In development and testing, financial simulation requires loopback verification to prevent accidental mock state in hosted environments.

6. **Continuous Security Audits**:
   - Continuous CodeQL static code analysis on all pull requests and weekly scheduled scans.
   - Automated dependency vulnerability monitoring via Dependabot.
   - Automated high-severity npm audit gates in continuous integration.

---

## Scope & Exclusions

The following activities are considered out of scope:

- Denial of Service (DoS / DDoS) attacks against SDGC infrastructure or hosting providers.
- Social engineering, phishing, or physical attacks targeting club officers or volunteers.
- Automated scanner spam without demonstrable business logic impact or valid PoC.
- Attacks requiring physical access to a user's unlocked device.
