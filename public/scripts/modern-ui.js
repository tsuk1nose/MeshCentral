/* Shared presentation/accessibility helpers. Existing handlers own all actions. */
(function () {
    'use strict';
    var previousFocus = null, dialogOpen = false;
    function visible(element) { return element && element.getClientRects().length > 0; }
    window.updateModernThemeControl = function () {
        var dark = document.body.classList.contains('night');
        var forced = typeof features2 === 'number' && (features2 & 0x00300000) !== 0;
        document.querySelectorAll('.mc-theme-toggle').forEach(function (button) {
            var label = dark ? 'Switch to light mode' : 'Switch to dark mode';
            button.disabled = forced;
            button.setAttribute('aria-pressed', String(dark));
            button.setAttribute('aria-label', label);
            button.title = forced ? 'Theme is managed by the server' : label;
            button.querySelector('.mc-theme-label').textContent = dark ? 'Light mode' : 'Dark mode';
        });
    };
    window.toggleModernTheme = function () {
        if (typeof features2 === 'number' && (features2 & 0x00300000)) return;
        var dark = document.body.classList.contains('night');
        // A dark Bootswatch base forces dark mode; restore the default base when
        // the user explicitly requests light mode through this switch.
        if (dark && typeof MeshCentralTheme !== 'undefined' && MeshCentralTheme.isDarkBaseTheme(getstore('theme', 'default'))) {
            MeshCentralTheme.applyTheme('default');
            putstore('theme', 'default');
        }
        putstore('nightMode', dark ? '2' : '1');
        setNightMode();
        window.updateModernThemeControl();
    };
    window.captureModernDialogFocus = function () {
        if (!dialogOpen) previousFocus = document.activeElement;
    };
    function syncDialog() {
        var dialog = document.getElementById('dialog');
        if (!dialog) return;
        var open = visible(dialog);
        if (open === dialogOpen) return;
        dialogOpen = open;
        document.body.classList.toggle('mc-dialog-open', open);
        dialog.setAttribute('aria-hidden', String(!open));
        if (open) {
            if (!previousFocus && !dialog.contains(document.activeElement)) previousFocus = document.activeElement;
            requestAnimationFrame(function () {
                if (!dialogOpen || dialog.contains(document.activeElement)) return;
                var control = Array.prototype.find.call(dialog.querySelectorAll('input:not([type="hidden"]):not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled),a[href]'), visible);
                if (visible(control)) control.focus(); else dialog.focus();
            });
        } else if (previousFocus && previousFocus.isConnected && visible(previousFocus)) {
            previousFocus.focus();
            previousFocus = null;
        }
    }
    function init() {
        window.updateModernThemeControl();
        new MutationObserver(window.updateModernThemeControl).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        var dialog = document.getElementById('dialog');
        if (dialog) {
            var backdrop = document.createElement('div');
            backdrop.className = 'mc-dialog-backdrop';
            backdrop.setAttribute('aria-hidden', 'true');
            document.body.appendChild(backdrop);
            new MutationObserver(syncDialog).observe(dialog, { attributes: true, attributeFilter: ['style'] });
            syncDialog();
            document.addEventListener('keydown', function (event) {
                if (!dialogOpen) return;
                if (event.key === 'Escape') {
                    if (visible(document.getElementById('idx_dlgCancelButton')) || visible(document.getElementById('id_dialogclose'))) {
                        event.preventDefault(); event.stopImmediatePropagation(); dialogclose(0);
                    }
                } else if (event.key === 'Tab') {
                    var controls = Array.prototype.filter.call(dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex]'), function (element) {
                        return !element.disabled && element.tabIndex >= 0 && visible(element);
                    });
                    var first = controls[0], last = controls[controls.length - 1];
                    if (!first) { event.preventDefault(); dialog.focus(); }
                    else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
                    else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
                }
            }, true);
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
