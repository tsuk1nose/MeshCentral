# Modern interface

The working tree is based on the upstream 1.3.1 release commit `f4361435`.
The previous checkout (`72e40656`) included later changes requiring Node.js
22.21.1; the release baseline requires Node.js 20. This rollback was requested
for compatibility. It also removes subsequent bug fixes and security fixes;
review and selectively restore those before a production deployment.

The visual changes are in `public/styles/modern.css`, loaded by `default`,
`default3`, `login`, and `login2` before the administrator's custom styles.
They introduce shared light/dark colors, navy navigation, updated form fields,
rounded cards and dialogs, visible keyboard focus, and responsive login panels.
No external fonts, packages, or network resources are required.

The existing layout dimensions, element IDs, authentication handlers, and remote
session logic are retained. Dedicated mobile management templates retain their
upstream styling. Custom branding and administrator CSS can still override the
shared theme. Remove the modern stylesheet link in the four templates to use the
original appearance.

Validation: Chromium rendered all four templates in light and dark mode, with
scripts disabled and representative content for the management shell. Both login
templates were also checked at 390px width for horizontal overflow, and their
username fields were checked for keyboard input and panel containment. These are
visual checks, not authenticated integration tests. Real login, MFA, remote
desktop, terminal, and file transfer require a configured server and devices.
