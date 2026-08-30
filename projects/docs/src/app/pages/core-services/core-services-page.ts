import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  MkAlert,
  MkBreakpointService,
  MkButton,
  MkChip,
  MkHistoryService,
  MkLiveAnnouncer,
  type MkTone,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/** One chip of the history demo's tiny list editor. */
interface DemoChip {
  id: number;
  name: string;
  tone: MkTone;
}

/** Deterministic add-chip palette (cycled by a counter — no randomness). */
const CHIP_NAMES = ['plum', 'mint', 'amber', 'coral', 'iris', 'slate'] as const;
const CHIP_TONES: readonly MkTone[] = ['primary', 'success', 'warning', 'danger', 'info', 'neutral'];

/**
 * Documentation page for the core primitives of `@mk-kit/ui`: the overlay
 * engine, anchored positioning, a11y helpers (focus trap, live announcer),
 * theming, i18n and app-wide hotkeys.
 */
@Component({
  selector: 'docs-core-services-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkAlert, MkButton, MkChip, RouterLink],
  template: `
    <div class="docs-page docs-container">
      <h1>Core &amp; services</h1>
      <p class="docs-lead">
        The primitives every component is built on — and that your app can use
        directly: a dependency-free <strong>overlay</strong> renderer, an
        <strong>anchored-panel</strong> directive backed by the native Popover
        API, a <strong>focus trap</strong> and <strong>live announcer</strong>
        for accessibility, a reactive <strong>theme</strong> controller,
        <strong>i18n</strong> string overrides, app-wide
        <strong>hotkeys</strong>, and an undo/redo <strong>history</strong>
        stack. All are tree-shakable, SSR-safe and provided in root.
      </p>

      <!-- ============================================================ -->
      <h2>Overlay service</h2>
      <p>
        <code class="docs-inline">MkOverlayService.open(component, config)</code>
        instantiates any standalone component into a body-level host and manages
        the backdrop, focus trapping, Escape handling and body scroll locking.
        It powers Dialog, Menu and friends — use it for fully custom modals.
        The rendered component can inject
        <code class="docs-inline">MK_OVERLAY_DATA</code> (the
        <code class="docs-inline">data</code> you passed) and
        <code class="docs-inline">MkOverlayRef</code> to close itself.
      </p>
      <pre class="core-code"><code>{{ overlayCode }}</code></pre>
      <table class="docs-props">
        <thead>
          <tr><th>Member / option</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>open(component, config?)</code></td><td><code>MkOverlayRef</code></td><td>Render <code>component</code> in a centred body-level panel; returns the handle.</td></tr>
          <tr><td><code>data</code></td><td><code>TData</code></td><td>Arbitrary payload, injectable via <code>MK_OVERLAY_DATA</code>.</td></tr>
          <tr><td><code>hasBackdrop</code></td><td><code>boolean</code></td><td>Render a dimmed scrim behind the panel. Default <code>true</code>.</td></tr>
          <tr><td><code>closeOnBackdropClick</code> / <code>closeOnEscape</code></td><td><code>boolean</code></td><td>Dismiss on backdrop click / Escape. Both default <code>true</code>.</td></tr>
          <tr><td><code>trapFocus</code></td><td><code>boolean</code></td><td>Trap focus inside the panel and restore it on close. Default <code>true</code>.</td></tr>
          <tr><td><code>panelClass</code></td><td><code>string | string[]</code></td><td>Extra class(es) on the panel host element.</td></tr>
          <tr><td><code>role</code></td><td><code>'dialog' | 'alertdialog' | 'menu' | 'listbox'</code></td><td>Accessible role for the panel. Default <code>dialog</code>.</td></tr>
          <tr><td><code>ariaLabel</code></td><td><code>string</code></td><td><code>aria-label</code> when no visible title is wired up.</td></tr>
          <tr><td><code>injector</code></td><td><code>Injector</code></td><td>Custom parent injector for the rendered component.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Overlay ref</h2>
      <p>
        <code class="docs-inline">MkOverlayRef</code> is the handle to an open
        overlay — returned by <code class="docs-inline">open()</code> and
        injectable inside the rendered component. Resolve the overlay by calling
        <code class="docs-inline">close(result)</code>; observe the outcome via
        the <code class="docs-inline">afterClosed</code> promise or the
        <code class="docs-inline">closed</code> signal.
      </p>
      <table class="docs-props">
        <thead>
          <tr><th>Member</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>close(result?)</code></td><td><code>method</code></td><td>Dismiss the overlay, optionally returning a result. Idempotent.</td></tr>
          <tr><td><code>afterClosed</code></td><td><code>Promise&lt;TResult | undefined&gt;</code></td><td>Resolves with the close result when dismissed.</td></tr>
          <tr><td><code>closed</code></td><td><code>Signal&lt;boolean&gt;</code></td><td>Becomes <code>true</code> once the overlay has been dismissed.</td></tr>
          <tr><td><code>componentRef</code></td><td><code>ComponentRef</code></td><td>The rendered component instance (set by the service).</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Anchored panel</h2>
      <p>
        The <code class="docs-inline">mkAnchoredPanel</code> directive turns an
        element rendered in your own template (typically inside
        <code class="docs-inline">&#64;if (open()) {{ '{' }} … {{ '}' }}</code>)
        into a floating panel: it teleports the element to
        <code class="docs-inline">document.body</code> and into the browser
        <em>top layer</em> via the native Popover API, then positions it against
        the anchor with <code class="docs-inline">position: fixed</code> —
        flipping and clamping so it never overflows the viewport. Bindings and
        projected content keep working because the element stays part of the
        component's view. The pure maths is exported as
        <code class="docs-inline">mkComputeAnchoredPosition(anchor, panel, viewport, opts)</code>
        if you need positioning without the directive.
      </p>
      <pre class="core-code"><code>{{ anchoredCode }}</code></pre>
      <table class="docs-props">
        <thead>
          <tr><th>Input / output</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>[mkAnchoredPanelFor]</code></td><td><code>HTMLElement | ElementRef</code></td><td>The trigger element to position against.</td></tr>
          <tr><td><code>[anchorRect]</code></td><td><code>{{ '{' }} x, y {{ '}' }}</code></td><td>Viewport-point anchor (e.g. a right-click position) — takes precedence.</td></tr>
          <tr><td><code>[placement]</code></td><td><code>MkPlacement</code></td><td>Preferred placement. Default <code>bottom-start</code>.</td></tr>
          <tr><td><code>[gap]</code></td><td><code>number</code></td><td>Distance in px between anchor and panel. Default <code>4</code>.</td></tr>
          <tr><td><code>[matchWidth]</code></td><td><code>boolean</code></td><td>Set the panel's <code>min-width</code> to the anchor's width (dropdowns).</td></tr>
          <tr><td><code>[flip]</code> / <code>[clamp]</code></td><td><code>boolean</code></td><td>Flip to the opposite side on overflow / clamp inside the viewport. Both default <code>true</code>.</td></tr>
          <tr><td><code>(dismiss)</code></td><td><code>void</code></td><td>Emitted on an outside pointerdown or when the window loses focus.</td></tr>
          <tr><td><code>position()</code></td><td><code>method</code></td><td>Recompute and re-apply the panel position (also runs on scroll/resize).</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Focus trap</h2>
      <p>
        <code class="docs-inline">MkFocusTrap</code> is a plain class (no
        Angular dependency) that traps keyboard focus within a root element —
        wrapping Tab / Shift+Tab, moving focus inside on
        <code class="docs-inline">activate()</code> and restoring the
        previously-focused element on <code class="docs-inline">release()</code>.
        Essential for accessible modals and menus (WCAG 2.4.3, 2.1.2). The
        overlay service applies one automatically when
        <code class="docs-inline">trapFocus</code> is on.
      </p>
      <pre class="core-code"><code>{{ focusTrapCode }}</code></pre>
      <table class="docs-props">
        <thead>
          <tr><th>Member</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>new MkFocusTrap(root)</code></td><td><code>constructor</code></td><td>Create a trap scoped to <code>root</code>.</td></tr>
          <tr><td><code>activate(initialFocus?)</code></td><td><code>method</code></td><td>Start trapping; focus <code>initialFocus</code>, the first focusable, or <code>root</code>.</td></tr>
          <tr><td><code>release()</code></td><td><code>method</code></td><td>Stop trapping and restore focus to the trigger element.</td></tr>
          <tr><td><code>mkGetFocusable(root)</code></td><td><code>HTMLElement[]</code></td><td>Standalone helper: the visible tabbable elements inside <code>root</code>, in DOM order.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Live announcer</h2>
      <p>
        <code class="docs-inline">MkLiveAnnouncer.announce(message, politeness?)</code>
        speaks a message to assistive technology through a visually-hidden
        <code class="docs-inline">aria-live</code> region (WCAG 4.1.3 Status
        Messages). Identical consecutive messages are re-announced, and the
        region is cleared after a second to keep the DOM tidy.
      </p>
      <docs-example [code]="announcerCode">
        <div class="core-demo">
          <button mkButton (click)="announceHello()">Announce</button>
          <span class="core-demo__note">
            Nothing visible happens — the message goes to a hidden
            <code class="docs-inline">aria-live</code> region. Turn on a screen
            reader (or inspect
            <code class="docs-inline">.mk-visually-hidden</code> at the end of
            <code class="docs-inline">&lt;body&gt;</code>) to observe it.
            @if (announceCount() > 0) {
              Announced {{ announceCount() }}&times;.
            }
          </span>
        </div>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Member</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>announce(message, politeness?)</code></td><td><code>method</code></td><td>Announce <code>message</code>; politeness is <code>'polite'</code> (default, waits) or <code>'assertive'</code> (interrupts).</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Theme service</h2>
      <p>
        <code class="docs-inline">MkThemeService</code> is the reactive theme
        controller. The user's <code class="docs-inline">preference()</code>
        (<code class="docs-inline">light</code> /
        <code class="docs-inline">dark</code> /
        <code class="docs-inline">system</code>) is persisted to
        <code class="docs-inline">localStorage</code> and written as
        <code class="docs-inline">data-mk-theme</code> on
        <code class="docs-inline">&lt;html&gt;</code>; under
        <code class="docs-inline">system</code> the attribute is removed and the
        OS setting is live-tracked so pure-CSS
        <code class="docs-inline">prefers-color-scheme</code> takes over. The
        theme toggle in this site's header is exactly
        <code class="docs-inline">theme.toggle()</code>.
      </p>
      <pre class="core-code"><code>{{ themeCode }}</code></pre>
      <table class="docs-props">
        <thead>
          <tr><th>Member</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>preference()</code></td><td><code>Signal&lt;'light' | 'dark' | 'system'&gt;</code></td><td>The user's stored choice.</td></tr>
          <tr><td><code>resolvedTheme()</code></td><td><code>Signal&lt;'light' | 'dark'&gt;</code></td><td>The concrete theme currently in effect.</td></tr>
          <tr><td><code>isDark()</code></td><td><code>Signal&lt;boolean&gt;</code></td><td>Convenience boolean for template bindings.</td></tr>
          <tr><td><code>setTheme(preference)</code></td><td><code>method</code></td><td>Set the preference explicitly.</td></tr>
          <tr><td><code>toggle()</code></td><td><code>method</code></td><td>Flip between light and dark (resolving <code>system</code> first).</td></tr>
          <tr><td><code>density()</code></td><td><code>Signal&lt;'comfortable' | 'compact' | 'touch'&gt;</code></td><td>Global density mode, written as <code>data-mk-density</code>.</td></tr>
          <tr><td><code>setDensity(d)</code> / <code>toggleDensity()</code></td><td><code>method</code></td><td>Set the density; toggle flips comfortable ↔ compact.</td></tr>
          <tr><td><code>contrast()</code></td><td><code>Signal&lt;'normal' | 'high' | 'system'&gt;</code></td><td>Contrast preference, written as <code>data-mk-contrast</code>; <code>system</code> follows the OS <code>prefers-contrast</code>.</td></tr>
          <tr><td><code>resolvedContrast()</code> / <code>isHighContrast()</code></td><td><code>Signal</code></td><td>The contrast in effect (<code>system</code> resolved) and its boolean form.</td></tr>
          <tr><td><code>setContrast(c)</code> / <code>toggleContrast()</code></td><td><code>method</code></td><td>Set the preference; toggle flips normal ↔ high (resolving <code>system</code> first).</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2 id="breakpoints">Breakpoints</h2>
      <p>
        <code class="docs-inline">MkBreakpointService</code> turns the viewport
        into signals: one <code class="docs-inline">matchMedia</code> listener per
        step of the scale (<code class="docs-inline">sm</code> 640,
        <code class="docs-inline">md</code> 768,
        <code class="docs-inline">lg</code> 1024,
        <code class="docs-inline">xl</code> 1280,
        <code class="docs-inline">2xl</code> 1536 px; anything narrower is
        <code class="docs-inline">xs</code>). It is what the
        <a routerLink="/components/layout">layout primitives</a> use to resolve
        their per-breakpoint inputs, and <code class="docs-inline">resolve()</code>
        gives your own code the same mobile-first lookup. Provide
        <code class="docs-inline">MK_BREAKPOINTS</code> to change the scale; on
        the server everything reports <code class="docs-inline">xs</code>.
        Right now: <strong>{{ bp.current() }}</strong>.
      </p>
      <pre class="core-code"><code>{{ breakpointCode }}</code></pre>
      <table class="docs-props">
        <thead>
          <tr><th>Member</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>current()</code></td><td><code>Signal&lt;MkBreakpoint&gt;</code></td><td>The widest breakpoint the viewport satisfies.</td></tr>
          <tr><td><code>up(bp)</code> / <code>down(bp)</code></td><td><code>Signal&lt;boolean&gt;</code></td><td>At least <code>bp</code> wide / narrower than <code>bp</code>. Cached per name.</td></tr>
          <tr><td><code>between(from, to)</code></td><td><code>Signal&lt;boolean&gt;</code></td><td>At least <code>from</code> and narrower than <code>to</code>.</td></tr>
          <tr><td><code>observe(query)</code></td><td><code>Signal&lt;boolean&gt;</code></td><td>Any media query, e.g. <code>'(orientation: portrait)'</code>. Cached per query.</td></tr>
          <tr><td><code>resolve(value)</code></td><td><code>T | undefined</code></td><td>Pick the entry of a <code>MkResponsive&lt;T&gt;</code> map for the current viewport, mobile-first; plain values pass through. Read inside <code>computed()</code>.</td></tr>
          <tr><td><code>breakpoints</code></td><td><code>MkBreakpoints</code></td><td>The min-widths in effect.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Internationalisation</h2>
      <p>
        Every string the library renders itself — aria-labels, empty states,
        picker captions, screen-reader announcements — lives in one typed map,
        <code class="docs-inline">MkI18nStrings</code>. Localise by passing any
        subset to <code class="docs-inline">provideMkI18n(overrides)</code>;
        the rest falls back to the English defaults. Interpolated strings are
        functions, so translators control word order. The nested
        <code class="docs-inline">dateNames</code> (month/weekday tables used by
        the calendar and date pickers),
        <code class="docs-inline">blockEditor</code> and
        <code class="docs-inline">validation</code> (the messages
        <code class="docs-inline">mk-form-field</code> renders per error key)
        groups are merged deeply — partial overrides of those work too.
      </p>
      <pre class="core-code"><code>{{ i18nCode }}</code></pre>

      <h3>Locale packs</h3>
      <p>
        Complete translations ship as their own entry points under
        <code class="docs-inline">&#64;mk-kit/ui/locales/*</code>, so an app
        carries only the languages it provides. Each pack exports the full
        map, its date-name / validation / block-editor tables and a
        <code class="docs-inline">provideMkI18n&lt;Xx&gt;(overrides?)</code>
        helper that merges your overrides over the pack instead of over
        English. Available today: <strong>Polish</strong>
        (<code class="docs-inline">locales/pl</code>),
        <strong>German</strong> (<code class="docs-inline">locales/de</code>),
        <strong>Ukrainian</strong> (<code class="docs-inline">locales/uk</code>),
        <strong>Spanish</strong> (<code class="docs-inline">locales/es</code>)
        and <strong>French</strong> (<code class="docs-inline">locales/fr</code>);
        each also sets <code class="docs-inline">locale</code> and
        <code class="docs-inline">currency</code> for the formatting pipes.
        A pack is a single TypeScript file checked by a spec that fails when
        a key is missing or left in English — the easiest contribution to
        send.
      </p>
      <pre class="core-code"><code>{{ localeCode }}</code></pre>
      <table class="docs-props">
        <thead>
          <tr><th>Export</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>provideMkI18n(overrides, base?)</code></td><td><code>Provider</code></td><td>Merge a partial <code>MkI18nStrings</code> over <code>base</code> — the English defaults unless given (deep for <code>dateNames</code> / <code>blockEditor</code> / <code>validation</code>).</td></tr>
          <tr><td><code>mkMergeI18n(base, overrides)</code></td><td><code>MkI18nStrings</code></td><td>The same merge without the provider, for building a map by hand.</td></tr>
          <tr><td><code>MkI18nOverrides</code></td><td><code>type</code></td><td>The partial shape <code>provideMkI18n</code> and the locale-pack helpers accept.</td></tr>
          <tr><td><code>provideMkI18nPl(overrides?)</code> / <code>MK_PL_I18N</code> / <code>MK_PL_DATE_NAMES</code> / <code>MK_PL_VALIDATION</code> / <code>MK_PL_BLOCK_EDITOR</code> / <code>mkPluralPl</code></td><td><code>@mk-kit/ui/locales/pl</code></td><td>A locale pack: provider helper, the complete map, its tables and the CLDR plural picker the pack's counts use. Same surface per language: <code>locales/de</code> (…De), <code>locales/uk</code> (…Uk), <code>locales/es</code> (…Es), <code>locales/fr</code> (…Fr).</td></tr>
          <tr><td><code>MK_I18N</code></td><td><code>InjectionToken&lt;MkI18nStrings&gt;</code></td><td>The active string map — inject it to render library strings yourself.</td></tr>
          <tr><td><code>MkI18nStrings</code></td><td><code>interface</code></td><td>All user-facing strings; interpolations are functions like <code>removeItem(name)</code>.</td></tr>
          <tr><td><code>dateNames</code></td><td><code>MkDateNames</code></td><td>Full-length name tables: <code>months</code>, <code>monthsShort</code>, <code>weekdays</code> (Sunday-first), <code>weekdaysShort</code>, <code>weekdaysNarrow</code>.</td></tr>
          <tr><td><code>MK_DEFAULT_I18N</code> / <code>MK_DEFAULT_DATE_NAMES</code> / <code>MK_DEFAULT_VALIDATION</code></td><td><code>const</code></td><td>The built-in English defaults, exported for reuse.</td></tr>
        </tbody>
      </table>

      <h3>What's in the map</h3>
      <p>
        The map holds roughly two hundred keys. The catalog below shows the
        groups with a few example keys each — the authoritative, fully
        documented list is the <code class="docs-inline">MkI18nStrings</code>
        interface in
        <code class="docs-inline">core/i18n/mk-i18n.ts</code>, where every key
        carries a doc comment naming the component(s) it serves.
      </p>
      <table class="docs-props">
        <thead>
          <tr><th>Group</th><th>Example keys</th><th>Serves</th></tr>
        </thead>
        <tbody>
          <tr><td>General &amp; actions</td><td><code>close</code>, <code>clear</code>, <code>removeItem(name)</code></td><td>Dialogs, drawers, chips, tag inputs, inline edit, popconfirm.</td></tr>
          <tr><td>Forms &amp; validation</td><td><code>validation.required</code>, <code>validation.iban(err)</code>, <code>showPassword</code></td><td>Per-error-key messages rendered by <code>mk-form-field</code> (the <code>validation</code> group is deep-merged like <code>dateNames</code>), password rules, OTP, rating, color picker.</td></tr>
          <tr><td>Async &amp; empty states</td><td><code>loading</code>, <code>noResults</code>, <code>resultsCount(count)</code></td><td>Select, autocomplete, multi-select, command palette, table.</td></tr>
          <tr><td>Table &amp; sorting</td><td><code>selectAllRows</code>, <code>sortedBy(column, direction)</code>, <code>editCell</code></td><td>Table selection, grouping, resize/reorder and sort announcements.</td></tr>
          <tr><td>Dates &amp; time</td><td><code>dateNames</code>, <code>selectDate</code>, <code>eventCalendarMoved(…)</code></td><td>Calendar, date/month/week/time pickers, countdown, and the <code>eventCalendar*</code> keyboard-editing announcements.</td></tr>
          <tr><td>Drag &amp; drop</td><td><code>dndPickedUp(position, total)</code>, <code>dndCancelled</code></td><td>Keyboard-drag announcements in dnd lists and kanban.</td></tr>
          <tr><td>File upload</td><td><code>dropzoneLabel</code>, <code>fileRejectedSize(name, limit)</code></td><td>Dropzone label, upload states and rejection reasons.</td></tr>
          <tr><td>Charts &amp; QR</td><td><code>chartCategory</code>, <code>chartValue</code>, <code>qrCodeLabel(text)</code></td><td>Screen-reader data tables behind every chart; QR label.</td></tr>
          <tr><td>Command palette &amp; navigation</td><td><code>commandPalettePlaceholder</code>, <code>backToTop</code>, <code>skipToContent</code></td><td>Command palette, breadcrumb, pagination, app shell.</td></tr>
          <tr><td>Carousel &amp; slideshow</td><td><code>previousSlide</code>, <code>slideOf(slide, total)</code>, <code>pauseSlideshow</code></td><td>Carousel controls, position labels and autoplay toggle.</td></tr>
          <tr><td>Repeater</td><td><code>repeaterAddRow</code>, <code>repeaterRowMoved(from, to)</code></td><td>Repeater row controls and reorder announcements.</td></tr>
          <tr><td>Numeric keypad &amp; on-screen keyboard</td><td><code>numericKeypadLabel</code>, <code>keypadDigitsEntered(count, length)</code>, <code>keyboardShift</code></td><td>Touch keypad and on-screen keyboard key labels.</td></tr>
          <tr><td>Log viewer</td><td><code>logViewerLabel</code>, <code>logFollow</code>, <code>logWrapLines</code></td><td>Log region label and toolbar controls.</td></tr>
          <tr><td>Tour &amp; notifications</td><td><code>tourStepOf(step, total)</code>, <code>markAllRead</code>, <code>unread</code></td><td>Product tour chrome and the notification center.</td></tr>
          <tr><td>Block editor</td><td><code>blockEditor.addBlock</code>, <code>blockEditor.turnInto(label)</code></td><td>All block-editor chrome (deep-merged group).</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Hotkeys</h2>
      <p>
        <code class="docs-inline">MkHotkeysService.register(combo, handler, options?)</code>
        wires app-wide keyboard shortcuts through a single lazily-attached
        <code class="docs-inline">keydown</code> listener. Combos join tokens
        with <code class="docs-inline">+</code>
        (<code class="docs-inline">mod</code> resolves to &#8984; on macOS and
        Ctrl elsewhere), space-separated two-step chords like
        <code class="docs-inline">g i</code> are supported, and hotkeys are
        ignored while an editable field is focused unless
        <code class="docs-inline">allowInInput</code> is set. The returned
        disposer unregisters the shortcut.
      </p>
      <pre class="core-code"><code>{{ hotkeysCode }}</code></pre>
      <p>
        Full docs — the declarative
        <code class="docs-inline">[mkHotkey]</code> directive, live demos and
        the complete service &amp; helper API — live on the
        <a routerLink="/components/utilities">Utilities page</a>.
      </p>

      <!-- ============================================================ -->
      <h2>History (undo / redo)</h2>
      <p>
        <code class="docs-inline">MkHistoryService</code> is the app-wide,
        signal-based, linear undo/redo command stack (a root-provided
        <code class="docs-inline">MkHistoryStack</code> — the plain class is
        exported too and can be instantiated directly).
        <code class="docs-inline">push()</code> records an action that has
        <em>already happened</em>: you do the work first, then push an entry
        with a human <code class="docs-inline">label</code> and
        <code class="docs-inline">undo</code> /
        <code class="docs-inline">redo</code> callbacks. Pushing clears the
        redo branch (the standard editor model), and the oldest entries are
        evicted beyond <code class="docs-inline">limit</code> (default 100).
      </p>
      <p>
        The demo below is a tiny list editor: every add / remove is pushed with
        a label, and the Undo/Redo buttons are driven entirely by the stack's
        signals. (It runs on a <code class="docs-inline">createScope()</code>
        stack — an independent stack with the same API — so playing with it
        does not pollute the app-wide history.)
      </p>
      <docs-example [code]="historyCode" [column]="true">
        <div class="core-demo">
          <button mkButton size="sm" (click)="addChip()">Add chip</button>
          <button
            mkButton
            size="sm"
            variant="outline"
            tone="neutral"
            [disabled]="!history.canUndo()"
            (click)="history.undo()"
          >
            Undo{{ history.undoLabel() ? ' — ' + history.undoLabel() : '' }}
          </button>
          <button
            mkButton
            size="sm"
            variant="outline"
            tone="neutral"
            [disabled]="!history.canRedo()"
            (click)="history.redo()"
          >
            Redo{{ history.redoLabel() ? ' — ' + history.redoLabel() : '' }}
          </button>
        </div>
        <div class="core-demo core-demo--chips">
          @for (chip of chips(); track chip.id) {
            <mk-chip removable [tone]="chip.tone" (removed)="removeChip(chip)">
              {{ chip.name }}
            </mk-chip>
          } @empty {
            <span class="core-demo__note">
              No chips — add a few, remove one, then walk the history with
              Undo/Redo.
            </span>
          }
        </div>
      </docs-example>

      <h3>Hotkeys &amp; batching</h3>
      <p>
        Nothing is registered automatically — wire the standard editor
        shortcuts (<code class="docs-inline">mod+z</code> to undo,
        <code class="docs-inline">mod+shift+z</code> and
        <code class="docs-inline">mod+y</code> to redo) with
        <code class="docs-inline">registerHistoryHotkeys()</code> in an
        injection context. The hotkeys service already ignores keydowns inside
        editable fields, so native text-field undo keeps working. To group many
        pushes into <em>one</em> undoable step, run them inside
        <code class="docs-inline">batch(label, work)</code>: undo replays the
        children in reverse order, nested batches flatten into the outermost
        one, and an empty batch records nothing.
      </p>
      <pre class="core-code"><code>{{ historyHotkeysCode }}</code></pre>

      <mk-alert tone="warning" variant="soft" title="Re-entrancy: push during undo is ignored">
        Pushes made <strong>while</strong> <code class="docs-inline">undo()</code>
        or <code class="docs-inline">redo()</code> is executing are
        <strong>silently ignored</strong>. In the service's own words: "Naive
        consumers often record history from a generic change handler
        (<code class="docs-inline">(cellEdit)</code>,
        <code class="docs-inline">valueChanges</code>, …); when an undo replays
        the old value, that same handler fires again and would push a mirror
        entry, corrupting the stack into an undo/redo ping-pong. The guard
        makes that pattern safe by construction. If you need to record
        something new in response to an undo, do it after
        <code class="docs-inline">undo()</code> returns."
      </mk-alert>

      <table class="docs-props">
        <thead>
          <tr><th>Member</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>push(entry)</code></td><td><code>method</code></td><td>Record an already-performed action (<code>{{ '{' }} label, undo(), redo() {{ '}' }}</code>). Clears the redo branch; ignored during undo/redo; collected into the composite inside a <code>batch()</code>.</td></tr>
          <tr><td><code>undo()</code> / <code>redo()</code></td><td><code>boolean</code></td><td>Revert / re-apply the top entry; <code>false</code> when there is nothing to do.</td></tr>
          <tr><td><code>canUndo</code> / <code>canRedo</code></td><td><code>Signal&lt;boolean&gt;</code></td><td>Whether an entry can be undone / redone — bind buttons to these.</td></tr>
          <tr><td><code>undoLabel</code> / <code>redoLabel</code></td><td><code>Signal&lt;string | null&gt;</code></td><td>Label of the entry the next undo / redo would touch ("Undo <em>Delete row</em>").</td></tr>
          <tr><td><code>size</code></td><td><code>Signal&lt;number&gt;</code></td><td>Number of undoable entries on the stack.</td></tr>
          <tr><td><code>limit</code></td><td><code>number</code></td><td>Max undoable entries kept (default <code>100</code>); the oldest are dropped. Lowering it trims immediately.</td></tr>
          <tr><td><code>batch(label, work)</code></td><td><code>method</code></td><td>Group every push made during <code>work()</code> into one undoable step; returns <code>work()</code>'s result.</td></tr>
          <tr><td><code>clear()</code></td><td><code>method</code></td><td>Drop all entries (both branches) and any in-flight batch collection.</td></tr>
          <tr><td><code>createScope()</code></td><td><code>MkHistoryStack</code></td><td>Independent stack with the same API — for a dialog's local session that shouldn't pollute the app-wide history.</td></tr>
          <tr><td><code>registerHistoryHotkeys(history?)</code></td><td><code>() =&gt; void</code></td><td>Wire <code>mod+z</code> / <code>mod+shift+z</code> / <code>mod+y</code> to a stack (the service by default). Returns a disposer; auto-disposed with the injection context.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Small utilities</h2>
      <p>
        A handful of core exports the components are built from — useful when
        you build custom controls of your own.
      </p>
      <table class="docs-props">
        <thead>
          <tr><th>Export</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mkUniqueId(prefix?)</code></td><td><code>string</code></td><td>Stable, SSR-safe unique DOM id (<code>mk-input-7</code>) for wiring <code>aria-*</code> relationships — prefer it over <code>Math.random()</code>.</td></tr>
          <tr><td><code>MkFieldContext</code></td><td><code>abstract class / DI token</code></td><td>The contract <code>mk-form-field</code> exposes to the control nested inside it — see below.</td></tr>
          <tr><td><code>mkValidatorChange(deps)</code></td><td><code>MkValidatorChangeRef</code></td><td>Re-validates the bound control when a validator's inputs change: wire the returned ref into <code>registerOnValidatorChange</code> and read every constraint signal inside <code>deps</code>. Call in an injection context.</td></tr>
          <tr><td><code>mkFirstErrorMessage(errors, strings, overrides?)</code></td><td><code>string | null</code></td><td>Resolves the message for the <em>first</em> error on a control: per-field overrides, then the i18n <code>validation</code> table, then the payload's own <code>message</code>, then the generic fallback.</td></tr>
          <tr><td><code>MK_DEFAULT_VALIDATION</code></td><td><code>MkValidationStrings</code></td><td>The built-in English validation messages, exported for reuse in your own error rendering.</td></tr>
        </tbody>
      </table>

      <h3>MkFieldContext — custom controls inside mk-form-field</h3>
      <p>
        <code class="docs-inline">MkFieldContext</code> is how a custom form
        control cooperates with a wrapping
        <code class="docs-inline">&lt;mk-form-field&gt;</code> without depending
        on the forms entry point: the wrapper provides itself under this token,
        and the control injects it <em>optionally</em> to adopt the field's
        control id (so the label focuses it), mirror its
        <code class="docs-inline">size()</code>,
        <code class="docs-inline">isRequired()</code> and
        <code class="docs-inline">hasError()</code> signals, and wire
        <code class="docs-inline">describedBy()</code> into
        <code class="docs-inline">aria-describedby</code>. Standalone usage
        simply yields <code class="docs-inline">null</code>.
      </p>
      <pre class="core-code"><code>{{ fieldContextCode }}</code></pre>
    </div>
  `,
  styles: [
    `
      .core-code {
        margin: var(--mk-space-3) 0 var(--mk-space-5);
        padding: var(--mk-space-4) var(--mk-space-5);
        background: var(--mk-code-bg);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        line-height: var(--mk-line-height-normal);
        color: var(--mk-text);
        overflow-x: auto;
      }
      .core-demo {
        display: flex;
        align-items: center;
        gap: var(--mk-space-4);
        flex-wrap: wrap;
      }
      .core-demo__note {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
        max-width: 46ch;
      }
      .core-demo--chips {
        min-height: 2.5rem;
        margin-top: var(--mk-space-3);
        gap: var(--mk-space-2);
      }
    `,
  ],
})
export class CoreServicesPage {
  private readonly announcer = inject(MkLiveAnnouncer);

  /**
   * The history demo runs on an isolated scope of the app-wide service, so
   * undoing here never touches history other parts of the app may have pushed.
   */
  protected readonly history = inject(MkHistoryService).createScope();

  protected readonly chips = signal<readonly DemoChip[]>([]);
  /** Deterministic sequence for chip names/tones (counter + modulo). */
  private chipSeq = 0;

  protected addChip(): void {
    const n = this.chipSeq++;
    const chip: DemoChip = {
      id: n,
      name: CHIP_NAMES[n % CHIP_NAMES.length],
      tone: CHIP_TONES[n % CHIP_TONES.length],
    };
    const insert = () =>
      this.chips.update((chips) => [...chips, chip]);
    const remove = () =>
      this.chips.update((chips) => chips.filter((c) => c.id !== chip.id));
    insert(); // 1. do the work yourself…
    this.history.push({ label: `Add ${chip.name}`, undo: remove, redo: insert }); // 2. …then record it
  }

  protected removeChip(chip: DemoChip): void {
    const at = this.chips().indexOf(chip);
    if (at === -1) return;
    const remove = () =>
      this.chips.update((chips) => chips.filter((c) => c.id !== chip.id));
    const insert = () =>
      this.chips.update((chips) => [...chips.slice(0, at), chip, ...chips.slice(at)]);
    remove();
    this.history.push({ label: `Remove ${chip.name}`, undo: insert, redo: remove });
  }

  protected readonly announceCount = signal(0);

  protected announceHello(): void {
    this.announcer.announce('Hello from the announcer');
    this.announceCount.update((n) => n + 1);
  }

  protected readonly overlayCode = `// Anywhere in the app:
const overlay = inject(MkOverlayService);

const ref = overlay.open(ConfirmDialog, {
  data: { itemName: 'Invoice #42' },
  ariaLabel: 'Confirm deletion',
  role: 'alertdialog',
});
const confirmed = await ref.afterClosed; // resolves on close(result)

// Inside ConfirmDialog:
readonly data = inject(MK_OVERLAY_DATA) as { itemName: string };
readonly ref = inject(MkOverlayRef) as MkOverlayRef<boolean>;

confirm(): void {
  this.ref.close(true);
}`;

  protected readonly anchoredCode = `@if (open()) {
  <ul
    mkAnchoredPanel
    [mkAnchoredPanelFor]="triggerEl"
    placement="bottom-start"
    [matchWidth]="true"
    (dismiss)="open.set(false)"
  >
    <!-- @for options, projected content — all bindings keep working -->
  </ul>
}`;

  protected readonly focusTrapCode = `const trap = new MkFocusTrap(panelElement);
trap.activate();  // moves focus inside; Tab / Shift+Tab wrap
// … on close:
trap.release();   // restores focus to the previously-focused element

// Or just the query:
const tabbables = mkGetFocusable(panelElement);`;

  protected readonly announcerCode = `private readonly announcer = inject(MkLiveAnnouncer);

save(): void {
  // …
  this.announcer.announce('Changes saved');               // polite (default)
  this.announcer.announce('Session expired', 'assertive'); // interrupts
}`;

  protected readonly themeCode = `private readonly theme = inject(MkThemeService);

this.theme.preference();    // 'light' | 'dark' | 'system'
this.theme.resolvedTheme(); // 'light' | 'dark' (system resolved)
this.theme.isDark();        // computed boolean

this.theme.setTheme('dark');
this.theme.toggle();        // flip light <-> dark

this.theme.setDensity('compact');   // data-mk-density
this.theme.setContrast('high');     // data-mk-contrast (or 'system' to follow the OS)
this.theme.isHighContrast();        // computed boolean`;

  protected readonly bp = inject(MkBreakpointService);

  protected readonly breakpointCode = `private readonly bp = inject(MkBreakpointService);

this.bp.current();               // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
readonly compact = this.bp.down('md');      // Signal<boolean>
readonly wide = this.bp.up('xl');
readonly tablet = this.bp.between('md', 'lg');
readonly portrait = this.bp.observe('(orientation: portrait)');

// Mobile-first map -> value for the current viewport
readonly columns = computed(() => this.bp.resolve({ xs: 1, md: 2, xl: 4 }));

// Custom scale
{ provide: MK_BREAKPOINTS, useValue: { sm: 600, md: 900, lg: 1200, xl: 1536, '2xl': 1920 } }`;

  protected readonly i18nCode = `bootstrapApplication(App, {
  providers: [
    provideMkI18n({
      close: 'Zamknij',
      noResults: 'Brak wyników',
      removeItem: (name) => \`Usuń \${name}\`,
      dateNames: {
        // partial override — deep-merged over the English tables
        weekdaysNarrow: ['N', 'P', 'W', 'Ś', 'C', 'P', 'S'],
      },
    }),
  ],
});`;

  protected readonly localeCode = `import { provideMkI18nPl } from '@mk-kit/ui/locales/pl';
// …or provideMkI18nDe / provideMkI18nUk / provideMkI18nEs / provideMkI18nFr

bootstrapApplication(App, {
  providers: [
    // Every string in Polish; overrides merge over the pack, not over English.
    provideMkI18nPl({ noData: 'Nic tu jeszcze nie ma' }),
  ],
});`;

  protected readonly fieldContextCode = `@Component({ selector: 'my-color-swatch-picker', /* … */ })
export class MyColorSwatchPicker implements ControlValueAccessor {
  // null when used outside an <mk-form-field> — every read falls back.
  private readonly field = inject(MkFieldContext, { optional: true });

  protected readonly id = this.field?.controlId ?? mkUniqueId('swatch');
  protected readonly size = computed(() => this.field?.size() ?? 'md');
  protected readonly invalid = computed(() => this.field?.hasError() ?? false);
  // Host bindings: [id]="id", [attr.aria-describedby]="field?.describedBy()"
}`;

  protected readonly hotkeysCode = `private readonly hotkeys = inject(MkHotkeysService);

const off = this.hotkeys.register('mod+k', () => this.openPalette(), {
  preventDefault: true,
});
this.hotkeys.register('g i', () => this.goToInbox()); // two-step chord

// … later
off();`;

  protected readonly historyCode = `private readonly history = inject(MkHistoryService);
readonly chips = signal<Chip[]>([]);

addChip(chip: Chip): void {
  const insert = () => this.chips.update((c) => [...c, chip]);
  const remove = () => this.chips.update((c) => c.filter((x) => x.id !== chip.id));
  insert(); // 1. do the work yourself — push() records an action that already happened
  this.history.push({ label: \`Add \${chip.name}\`, undo: remove, redo: insert });
}

<button [disabled]="!history.canUndo()" (click)="history.undo()">
  Undo {{ history.undoLabel() }}
</button>
<button [disabled]="!history.canRedo()" (click)="history.redo()">
  Redo {{ history.redoLabel() }}
</button>`;

  protected readonly historyHotkeysCode = `// Standard editor shortcuts — call in an injection context:
export class AppShell {
  private readonly disposeHistoryKeys = registerHistoryHotkeys();
  // mod+z -> undo(), mod+shift+z / mod+y -> redo()
  // Pass a createScope() stack to bind a dialog's local history instead.
}

// Group many pushes into ONE undoable step:
history.batch('Paste 3 rows', () => {
  for (const row of pasted) this.insertRow(row); // each insert push()es
});`;
}
