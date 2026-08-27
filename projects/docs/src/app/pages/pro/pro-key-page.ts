import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MkAlert, MkButton, MkFormField, MkInput } from '@mk-kit/ui';
import { SITE } from '../../site.config';

/** "Lost my key" — asks the key service to re-send every key of an email address. */
@Component({
  selector: 'docs-pro-key-page',
  imports: [RouterLink, MkAlert, MkButton, MkFormField, MkInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container">
      <p class="pro-eyebrow">mk-kit Pro</p>
      <h1>Get your licence key again</h1>
      <p class="docs-lead">
        Enter the email you used at checkout and we'll resend every key issued to it.
        Invoices and your card live in the Stripe customer portal — the link is in your receipt.
      </p>
      <form class="pk-form" (submit)="submit($event)">
        <mk-form-field label="Checkout email" [required]="true">
          <input mkInput type="email" name="email" autocomplete="email" placeholder="you@company.com" required [value]="email()" (input)="email.set($any($event.target).value)" />
        </mk-form-field>
        <button mkButton type="submit" [loading]="sending()">Resend my key</button>
      </form>
      @if (done()) {
        <mk-alert tone="success" title="Check your inbox">
          If we have keys for that address, they're on their way (allow a minute, and check spam). Nothing arrived?
          Write to <a href="mailto:{{ contact }}">{{ contact }}</a>.
        </mk-alert>
      }
      @if (failed()) {
        <mk-alert tone="warning" title="Couldn't reach the key service">
          Please try again in a moment, or write to <a href="mailto:{{ contact }}">{{ contact }}</a>.
        </mk-alert>
      }
      <p><a routerLink="/pro">← Back to Pro</a></p>
    </div>
  `,
  styles: [
    `
      .pro-eyebrow { margin: 0 0 var(--mk-space-2); font-size: var(--mk-font-size-sm); font-weight: var(--mk-font-weight-semibold); letter-spacing: 0.06em; text-transform: uppercase; color: var(--mk-primary); }
      .pk-form { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--mk-space-3); max-width: 32rem; margin: var(--mk-space-4) 0 var(--mk-space-5); }
      .pk-form mk-form-field { flex: 1; min-width: 16rem; }
    `,
  ],
})
export class ProKeyPage {
  protected readonly contact = SITE.contactEmail;
  protected readonly email = signal('');
  protected readonly sending = signal(false);
  protected readonly done = signal(false);
  protected readonly failed = signal(false);

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    const email = this.email().trim();
    if (!email) return;
    this.sending.set(true);
    this.done.set(false);
    this.failed.set(false);
    try {
      const res = await fetch(`${SITE.keysUrl}/resend`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(String(res.status));
      this.done.set(true);
    } catch {
      this.failed.set(true);
    } finally {
      this.sending.set(false);
    }
  }
}
