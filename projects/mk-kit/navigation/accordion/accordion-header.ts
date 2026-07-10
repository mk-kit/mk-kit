import { Directive } from '@angular/core';

/**
 * Marks projected content as the header of an `<mk-accordion-item>`. Use when
 * the header needs rich markup instead of the plain-text `header` input.
 *
 * ```html
 * <mk-accordion-item>
 *   <span mkAccordionHeader><mk-icon name="user" /> Account</span>
 *   …body…
 * </mk-accordion-item>
 * ```
 */
@Directive({
  selector: '[mkAccordionHeader]',
})
export class MkAccordionHeader {}
