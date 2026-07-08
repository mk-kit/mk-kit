import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MkBadge, MkButton, MkCard } from '@mk-kit/ui';

interface Feature {
  icon: string;
  title: string;
  body: string;
}

@Component({
  selector: 'docs-introduction-page',
  imports: [MkButton, MkCard, MkBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container">
      <header class="intro-hero">
        <mk-badge tone="primary" variant="soft">Angular 22 · signals · WCAG 2.1 AA</mk-badge>
        <h1 class="intro-hero__title">
          The admin UI kit that <span class="intro-accent">themes itself</span>.
        </h1>
        <p class="docs-lead">
          <strong>mk-kit</strong> is a themable, accessible Angular&nbsp;22 component
          library for dashboards and admin panels. Every pixel is controlled by CSS
          variables, light &amp; dark ship out of the box, and everything is built on
          signals with zero runtime dependencies beyond Angular.
        </p>
        <div class="intro-hero__cta">
          <button mkButton tone="primary" size="lg" (click)="go('/getting-started')">
            Get started
          </button>
          <button mkButton variant="outline" tone="neutral" size="lg" (click)="go('/components/buttons')">
            Browse components
          </button>
        </div>
      </header>

      <section class="intro-features">
        @for (f of features; track f.title) {
          <mk-card variant="outlined" class="intro-feature">
            <div class="intro-feature__icon" aria-hidden="true">{{ f.icon }}</div>
            <h3 class="intro-feature__title">{{ f.title }}</h3>
            <p class="intro-feature__body">{{ f.body }}</p>
          </mk-card>
        }
      </section>

      <h2>Why mk-kit</h2>
      <p>
        Think of it as Angular Material, re-imagined for admin tooling: leaner, fully
        re-themable by editing a handful of <code class="docs-inline">--mk-*</code>
        custom properties, and shipped as modern standalone components you import à la
        carte. No <code class="docs-inline">NgModule</code>s, no Zone gymnastics — just
        <code class="docs-inline">input()</code>, <code class="docs-inline">model()</code>
        and <code class="docs-inline">output()</code>.
      </p>

      <h2>What's inside</h2>
      <div class="intro-inventory">
        @for (group of inventory; track group.title) {
          <div class="intro-inventory__group">
            <h3>{{ group.title }}</h3>
            <div class="intro-chips">
              @for (name of group.items; track name) {
                <span class="intro-chip">{{ name }}</span>
              }
            </div>
          </div>
        }
      </div>

      <h2>Accessibility, by default</h2>
      <p>
        Every component targets <strong>WCAG&nbsp;2.1&nbsp;AA</strong>: semantic roles,
        complete <code class="docs-inline">aria-*</code> wiring, roving tabindex for
        composite widgets, focus trapping for overlays, live-region announcements, and
        contrast that holds up in both themes. Information is never conveyed by color
        alone.
      </p>

      <div class="intro-footcta">
        <button mkButton tone="primary" (click)="go('/getting-started')">
          Install &amp; set up →
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .intro-hero {
        padding: var(--mk-space-8) 0 var(--mk-space-10);
        border-bottom: 1px solid var(--mk-border);
        margin-bottom: var(--mk-space-8);
      }
      .intro-hero__title {
        font-size: clamp(2rem, 5vw, 3rem);
        line-height: var(--mk-line-height-tight);
        letter-spacing: var(--mk-letter-spacing-tight);
        font-weight: var(--mk-font-weight-bold);
        margin: var(--mk-space-4) 0 var(--mk-space-4);
      }
      .intro-accent {
        color: var(--mk-primary);
      }
      .intro-hero__cta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-3);
        margin-top: var(--mk-space-6);
      }
      .intro-features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--mk-space-4);
        margin: var(--mk-space-2) 0 var(--mk-space-6);
      }
      .intro-feature {
        height: 100%;
      }
      .intro-feature__icon {
        font-size: 1.75rem;
        margin-bottom: var(--mk-space-2);
      }
      .intro-feature__title {
        font-size: var(--mk-font-size-lg);
        font-weight: var(--mk-font-weight-semibold);
        margin: 0 0 var(--mk-space-1);
      }
      .intro-feature__body {
        margin: 0;
        color: var(--mk-text-muted);
        font-size: var(--mk-font-size-md);
        line-height: var(--mk-line-height-normal);
      }
      .intro-inventory {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: var(--mk-space-6);
        margin: var(--mk-space-4) 0;
      }
      .intro-inventory__group h3 {
        margin: 0 0 var(--mk-space-3);
      }
      .intro-chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-2);
      }
      .intro-chip {
        font-size: var(--mk-font-size-sm);
        padding: var(--mk-space-1) var(--mk-space-3);
        border-radius: var(--mk-radius-pill);
        background: var(--mk-surface-2);
        color: var(--mk-text-muted);
        border: 1px solid var(--mk-border);
      }
      .intro-footcta {
        margin-top: var(--mk-space-10);
        padding-top: var(--mk-space-6);
        border-top: 1px solid var(--mk-border);
      }
    `,
  ],
})
export class IntroductionPage {
  private readonly router = inject(Router);

  protected readonly features: Feature[] = [
    {
      icon: '🎨',
      title: 'CSS-variable theming',
      body: 'Re-brand the entire library by overriding --mk-* tokens. No SCSS recompile, no build step.',
    },
    {
      icon: '🌗',
      title: 'Light & dark built in',
      body: 'Follows the OS preference automatically, or switch explicitly with the signal-based MkThemeService.',
    },
    {
      icon: '⚡',
      title: 'Signals everywhere',
      body: 'input(), model() and output() with OnPush. Fast, reactive, zoneless-ready.',
    },
    {
      icon: '♿',
      title: 'Accessible by design',
      body: 'WCAG 2.1 AA: keyboard nav, focus management, aria wiring and live regions throughout.',
    },
    {
      icon: '📦',
      title: 'Publishable package',
      body: 'Ships as a standard Angular package (FESM2022 + typings) — npm install @mk-kit/ui.',
    },
    {
      icon: '🧭',
      title: 'Admin-oriented',
      body: 'App shell, collapsible sidebar nav, sortable tables, stat cards, dialogs and toasts.',
    },
  ];

  protected readonly inventory = [
    { title: 'Forms', items: ['Button', 'FormField', 'Input', 'Select', 'Checkbox', 'Radio', 'Switch', 'Slider'] },
    { title: 'Data display', items: ['Table', 'Card', 'Badge', 'Tag', 'Chip', 'Avatar', 'List', 'StatCard', 'ProgressBar', 'Spinner', 'Skeleton', 'Divider'] },
    { title: 'Feedback', items: ['Alert', 'Toast', 'Dialog', 'Tooltip'] },
    { title: 'Navigation & layout', items: ['Tabs', 'Accordion', 'Breadcrumb', 'Pagination', 'Menu', 'AppShell', 'NavList'] },
  ];

  protected go(path: string): void {
    this.router.navigateByUrl(path);
  }
}
