import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Card header region — a padded band separated from the body by a hairline
 * border. Typically wraps a {@link MkCardTitle} and optional actions.
 */
@Component({
  selector: 'mk-card-header, [mkCardHeader]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-card-header' },
  styles: [
    `:host {
       display: flex;
       align-items: center;
       gap: var(--mk-space-3);
       padding: var(--mk-card-pad, var(--mk-space-5));
       border-bottom: var(--mk-border-width) solid var(--mk-border);
     }`,
  ],
})
export class MkCardHeader {}

/**
 * Card title — semantic heading text for a card header. Renders as bold,
 * emphasised text; wrap the projected content in your own heading element if a
 * specific heading level is required for the document outline.
 */
@Component({
  selector: 'mk-card-title',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-card-title' },
  styles: [
    `:host {
       display: block;
       flex: 1 1 auto;
       min-width: 0;
       font-size: var(--mk-font-size-lg);
       font-weight: var(--mk-font-weight-semibold);
       line-height: var(--mk-line-height-snug);
       color: var(--mk-text);
     }`,
  ],
})
export class MkCardTitle {}

/**
 * Card footer region — a padded band separated from the body by a hairline
 * border, usually holding actions aligned to the end.
 */
@Component({
  selector: 'mk-card-footer, [mkCardFooter]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-card-footer' },
  styles: [
    `:host {
       display: flex;
       align-items: center;
       gap: var(--mk-space-3);
       padding: var(--mk-card-pad, var(--mk-space-5));
       border-top: var(--mk-border-width) solid var(--mk-border);
     }`,
  ],
})
export class MkCardFooter {}
