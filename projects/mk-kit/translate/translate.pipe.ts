import { inject, Pipe, type PipeTransform } from '@angular/core';
import { MkTranslate } from './translate.service';
import type { MkTranslateParams } from './translate.types';

/**
 * `translate` — the key's string in the active language, with `{{name}}`
 * placeholders filled from `params`. Impure so a language switch (or a
 * `patch()`) re-renders every use; the signal reads inside `instant()` mark
 * the host view dirty, so this stays cheap under OnPush and zoneless.
 *
 * ```html
 * {{ 'menu.title' | translate }}
 * {{ 'cart.items' | translate: { count: 3 } }}
 * ```
 */
@Pipe({ name: 'translate', pure: false })
export class MkTranslatePipe implements PipeTransform {
  private readonly translate = inject(MkTranslate);

  transform(key: string | null | undefined, params?: MkTranslateParams): string {
    if (!key) return '';
    return this.translate.instant(key, params);
  }
}

/**
 * `translatePlural` — the CLDR plural form under `keyBase` for a count
 * (see {@link MkTranslate.plural}), interpolated with `{ count, ...params }`.
 *
 * ```html
 * {{ guests | translatePlural: 'reservation.guests' }}   <!-- 2 osoby / 5 osób -->
 * ```
 */
@Pipe({ name: 'translatePlural', pure: false })
export class MkTranslatePluralPipe implements PipeTransform {
  private readonly translate = inject(MkTranslate);

  transform(count: number | string | null | undefined, keyBase: string, params?: MkTranslateParams): string {
    return this.translate.plural(keyBase, Number(count) || 0, params);
  }
}

/**
 * Everything a template needs, for `imports: [...MkTranslateImports]` — the
 * one-line replacement for an ngx-translate `TranslateModule` import.
 */
export const MkTranslateImports = [MkTranslatePipe, MkTranslatePluralPipe] as const;
