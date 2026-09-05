import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MkButton } from '@mk-kit/ui';
import { MkNotificationSound, MkTabAttention } from '@mk-kit/ui/attention';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation page for `@mk-kit/ui/attention`: tab attention (favicon
 * badge + title blink), notification sounds and the session-expiry watcher.
 */
@Component({
  selector: 'docs-attention-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkButton],
  template: `
    <div class="docs-page docs-container">
      <h1>Attention</h1>
      <p class="docs-lead">
        Three small services for apps that watch a queue of incoming work: a
        <code class="docs-inline">favicon badge + title blink</code> while the
        tab is in the background, an <code class="docs-inline">alert sound</code>
        that survives the browser's autoplay rules, and a
        <code class="docs-inline">session-expiry</code> dialog that warns before
        a token lapses instead of letting the app go quietly dead.
      </p>

      <h2>Tab attention</h2>
      <p>
        <code class="docs-inline">MkTabAttention.set(count, label)</code> paints a
        counter badge over the favicon and, only while the tab is hidden,
        alternates the title with <code class="docs-inline">(N) label</code>.
        Focusing the tab stops the blinking; <code class="docs-inline">set(0)</code>
        or <code class="docs-inline">clear()</code> restores both. SSR-safe.
      </p>
      <docs-example [code]="tabCode" column>
        <div style="display:flex; gap: var(--mk-space-2); align-items:center; flex-wrap: wrap">
          <button mkButton (click)="bump()">Add pending ({{ pending() }})</button>
          <button mkButton variant="outline" (click)="pending.set(0); tab.clear()">Clear</button>
          <span style="color: var(--mk-text-muted)">Look at this tab's favicon, then switch tabs to see the title blink.</span>
        </div>
      </docs-example>

      <h2>Notification sound</h2>
      <p>
        <code class="docs-inline">MkNotificationSound</code> plays a synthesised
        chime or a configured file preset. The <code class="docs-inline">AudioContext</code>
        is unlocked on <code class="docs-inline">setEnabled(true)</code> (a click)
        and lazily on the first interaction (<code class="docs-inline">primeOnFirstInteraction()</code>),
        so a sound fired by a WebSocket message is not silently dropped.
        <code class="docs-inline">play()</code> honours the device mute,
        <code class="docs-inline">preview()</code> does not.
      </p>
      <docs-example [code]="soundCode" column>
        <div style="display:flex; gap: var(--mk-space-2); align-items:center; flex-wrap: wrap">
          <button mkButton (click)="sound.setEnabled(true); sound.preview('chime')">Enable &amp; play chime</button>
          <button mkButton variant="outline" (click)="sound.setEnabled(false)">Mute</button>
          <span style="color: var(--mk-text-muted)">Sound {{ sound.isEnabled() ? 'on' : 'off' }} on this device.</span>
        </div>
      </docs-example>

      <h2>Session expiry</h2>
      <p>
        <code class="docs-inline">provideMkSessionExpiry(&#123; expiresAt, extend, onExpire &#125;)</code>
        watches a reactive expiry time and opens a countdown dialog
        <code class="docs-inline">warnBeforeMs</code> before it (default two
        minutes). "Stay signed in" calls <code class="docs-inline">extend()</code>;
        a rejection, "Sign out now" or reaching zero calls
        <code class="docs-inline">onExpire()</code>. Every change of
        <code class="docs-inline">expiresAt()</code> (a token rotation) re-arms
        it; <code class="docs-inline">enabled()</code> suspends it, for a kiosk
        or PIN mode. Strings come from <code class="docs-inline">MK_I18N</code>.
      </p>
      <docs-example [code]="expiryCode" column>
        <p>Wired at the application root — see the code tab.</p>
      </docs-example>
    </div>
  `,
})
export class AttentionPage {
  readonly tab = inject(MkTabAttention);
  readonly sound = inject(MkNotificationSound);
  readonly pending = signal(0);

  bump(): void {
    this.pending.update((n) => n + 1);
    this.tab.set(this.pending(), 'new orders');
  }

  readonly tabCode = `private attention = inject(MkTabAttention);

// whenever the pending queue changes
effect(() => this.attention.set(this.pending().length, 'new orders'));
// panel closed / feature off
this.attention.clear();

// optional: provideMkTabAttention({ badgeColor: '#e53935', blinkMs: 1200 })`;

  readonly soundCode = `provideMkNotificationSound({
  presets: [MK_CHIME_PRESET, { id: 'ding', label: 'Ding', url: '/assets/sounds/ding.wav' }],
  storageKey: () => \`sound:\${tenant.slug()}\`,   // per tenant on a shared device
}),

sound.primeOnFirstInteraction();     // at app start
sound.play(settings.newOrderSound);  // on an event; 'custom' + url, or 'none'
sound.preview('ding');               // settings page test button`;

  readonly expiryCode = `provideMkSessionExpiry({
  expiresAt: () => auth.tokenExpiresAt(),        // epoch ms | null, read reactively
  warnBeforeMs: 2 * 60_000,
  extend: () => firstValueFrom(auth.refreshSession()),
  onExpire: () => auth.logout(),
  enabled: () => !posSession.isPinSession(),     // optional
})`;
}
