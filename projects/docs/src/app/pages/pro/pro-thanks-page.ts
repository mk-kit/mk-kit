import { ChangeDetectionStrategy, Component, afterNextRender, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MkAlert, MkButton, MkSpinner, MkToastService } from '@mk-kit/ui';
import { SITE } from '../../site.config';

interface IssuedKey {
  org: string;
  plan: string;
  seats: number;
  updatesUntil: string;
  key: string;
}

/**
 * Stripe redirects here after checkout with `?session_id=cs_…`. The key
 * service issues the licence from the session (or already has it from the
 * webhook); we poll until it's there and show it once. Nothing sensitive is
 * in the URL beyond the session id, which only ever resolves to this key.
 */
@Component({
  selector: 'docs-pro-thanks-page',
  imports: [RouterLink, MkAlert, MkButton, MkSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container">
      <p class="pro-eyebrow">mk-kit Pro</p>
      <h1>Thank you — you're licensed.</h1>

      @switch (state()) {
        @case ('loading') {
          <p class="docs-lead">Preparing your licence key… this takes a few seconds.</p>
          <div class="pk-loading" role="status"><mk-spinner /> <span>Waiting for the payment confirmation</span></div>
        }
        @case ('missing') {
          <mk-alert tone="warning" title="No checkout session in this link">
            Open the link from your Stripe receipt, or
            <a routerLink="/pro/key">request your key by email</a>.
          </mk-alert>
        }
        @case ('error') {
          <mk-alert tone="warning" title="We couldn't fetch the key right now">
            Your payment went through — the key is also on its way by email, and you can
            <a routerLink="/pro/key">request it again</a> any time.
          </mk-alert>
        }
        @case ('ready') {
          @if (issued(); as k) {
            <p class="docs-lead">
              Licensed to <strong>{{ k.org }}</strong> — {{ k.plan === 'team' ? 'Team' : 'Developer' }} plan,
              {{ k.seats }} seat{{ k.seats === 1 ? '' : 's' }}, updates until <strong>{{ k.updatesUntil }}</strong>
              (perpetual use of every release published before that date). A copy is in your inbox.
            </p>
            <h2 id="key">Your licence key</h2>
            <pre class="pk-key"><code>{{ k.key }}</code></pre>
            <p class="pk-actions">
              <button mkButton type="button" (click)="copy(k.key)">Copy key</button>
              <a mkButton variant="outline" routerLink="/pro">Back to Pro docs</a>
            </p>
            <h2 id="install">Install and register it</h2>
            <pre class="pk-code"><code>{{ snippet(k.key) }}</code></pre>
            <p>
              Keep the key with your app's configuration (it isn't a secret — it's a signed statement of
              who's licensed, verified offline). Need it again later? <a routerLink="/pro/key">Resend by email</a>.
            </p>
          }
        }
      }
    </div>
  `,
  styles: [
    `
      .pro-eyebrow { margin: 0 0 var(--mk-space-2); font-size: var(--mk-font-size-sm); font-weight: var(--mk-font-weight-semibold); letter-spacing: 0.06em; text-transform: uppercase; color: var(--mk-primary); }
      .pk-loading { display: flex; align-items: center; gap: var(--mk-space-3); color: var(--mk-text-muted); padding: var(--mk-space-6) 0; }
      .pk-key, .pk-code { margin: var(--mk-space-3) 0; padding: var(--mk-space-4); background: var(--mk-code-bg); border: 1px solid var(--mk-border); border-radius: var(--mk-radius-lg); font-family: var(--mk-font-mono); font-size: var(--mk-font-size-sm); line-height: var(--mk-line-height-normal); color: var(--mk-text); overflow-x: auto; }
      .pk-key { white-space: pre-wrap; overflow-wrap: anywhere; }
      .pk-code { white-space: pre; }
      .pk-actions { display: flex; flex-wrap: wrap; gap: var(--mk-space-2); }
    `,
  ],
})
export class ProThanksPage {
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(MkToastService);
  protected readonly state = signal<'loading' | 'missing' | 'error' | 'ready'>('loading');
  protected readonly issued = signal<IssuedKey | null>(null);

  constructor() {
    afterNextRender(() => {
      const id = this.route.snapshot.queryParamMap.get('session_id');
      if (!id) {
        this.state.set('missing');
        return;
      }
      void this.poll(id, 0);
    });
  }

  private async poll(id: string, attempt: number): Promise<void> {
    try {
      const res = await fetch(`${SITE.keysUrl}/session/${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (res.status === 202 && attempt < 30) {
        setTimeout(() => void this.poll(id, attempt + 1), 2000);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      this.issued.set((await res.json()) as IssuedKey);
      this.state.set('ready');
    } catch {
      this.state.set('error');
    }
  }

  protected snippet(key: string): string {
    return `npm install @mk-kit/pro

// main.ts
import { provideMkProLicense } from '@mk-kit/pro/license';

bootstrapApplication(App, {
  providers: [provideMkProLicense('${key.slice(0, 24)}…')],
});`;
  }

  protected async copy(key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(key);
      this.toast.success('Licence key copied');
    } catch {
      this.toast.warning('Select the key and copy it manually');
    }
  }
}
