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

The management shell uses a 224px labeled sidebar (76px below 1000px), line
icons, a taller device toolbar, and card-style empty groups. The device list uses
flex layout for scrolling. Element IDs, authentication handlers, and remote
session logic are retained. Dedicated mobile management templates retain their
upstream styling. Custom branding and administrator CSS can still override the
shared theme. The management templates also contain inline SVG navigation icons and visual
classes for the generated device groups.

Validation: Chromium rendered all four templates in light and dark mode, with
startup disabled. The classic device page was rendered by its real
`updateDevices` and `getMeshActions` functions with an empty-group fixture;
peripheral session callbacks were stubbed. Checks confirm the dark workspace
no longer falls back to black. Both login
templates were also checked at 390px width for horizontal overflow, and their
username fields were checked for keyboard input and panel containment. These are
visual checks, not authenticated integration tests. Real login, MFA, remote
desktop, terminal, and file transfer require a configured server and devices.


Account group cards, audit rows, user rows, file toolbars and server statistics
now use the same surfaces and spacing. Default decorative icons and the browser
favicon use local SVG assets in `public/images/modern`; uploaded profile images
continue to use their existing URLs. Server warnings remain visible.

Additional validation renders account, events, users, files and server pages in
both themes for classic and Bootstrap templates. Group cards and server metrics
use their original rendering functions with fixture data; event/user/file rows
use representative markup. These checks cover horizontal overflow and visual
layout, not authenticated operations or chart rendering.


The icon refresh now uses vendored Lucide Static 1.71.0 rather than custom SVG
artwork. PNG, WebP, notification/device/navigation sprite sheets, device-detail
images, remote-control buttons, PWA icons and the actual multi-resolution ICO
are regenerated from `tools/icon-refresh/manifest.json`. See that directory's
README for source, license, retained brand assets and regeneration instructions.

The favicon, PWA and Apple icons now use a custom transparent M brand mark;
Lucide remains the source for the functional UI icons.

Device group details now use a responsive property grid, compact group artwork,
and theme-aware authorization/device tables. The group renderer no longer writes
fixed black text or gray row backgrounds. Validation executed `p20updateMesh`
with an administrator/empty-device fixture in both desktop templates and themes.


The header includes a one-click theme switch backed by the existing `nightMode`
preference, and restyled account/logout controls. Server-enforced light/dark modes
still take precedence. Switching a dark Bootswatch base to light restores its
default base first. Existing system-mode settings remain available.

Both desktop templates load `public/scripts/modern-ui.js`. Classic dialogs now
have a backdrop, contained scrolling, a persistent footer, focus containment,
Escape-to-cancel and focus restoration. Existing confirmation handlers and
remote-keyboard release behavior remain in place. Bootstrap dialogs retain their
native lifecycle and gain matching spacing/form fields. Remaining legacy detail
tables use the same themed surfaces as the group detail page.

Run `tools/ui-smoke.cjs` with development Playwright/Chromium paths (and optionally
a screenshot directory). It checks stored theme selection, server-enforced modes,
the actual add-agent renderer and OS switching, dialog focus and callbacks, long
form scrolling, narrow-screen layout, and the Bootstrap modal lifecycle. These
checks use fixture server/device data; no agents are downloaded or installed.
