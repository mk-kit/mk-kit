import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MkAvatar } from '../avatar/avatar';
import {
  MkProfileActions,
  MkProfileCard,
  MkProfileCardOrientation,
  MkProfileMeta,
} from './profile-card';

@Component({
  imports: [MkProfileCard, MkProfileMeta, MkProfileActions],
  template: `<mk-profile-card
    [name]="name()"
    [subtitle]="subtitle()"
    [avatarSrc]="avatarSrc()"
    [coverSrc]="coverSrc()"
    [orientation]="orientation()">
    @if (withBody()) {
      <p>Body copy.</p>
    }
    @if (withSlots()) {
      <div mkProfileMeta>
        <div>128 posts</div>
        <div>2.4k followers</div>
      </div>
    }
    @if (withSlots()) {
      <div mkProfileActions>
        <button type="button">Follow</button>
      </div>
    }
  </mk-profile-card>`,
})
class Host {
  readonly name = signal('Ada Lovelace');
  readonly subtitle = signal('Analytical Engine Programmer');
  readonly avatarSrc = signal('');
  readonly coverSrc = signal('');
  readonly orientation = signal<MkProfileCardOrientation>('vertical');
  readonly withBody = signal(false);
  readonly withSlots = signal(false);
}

describe('MkProfileCard', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(Host);
  });

  afterEach(() => fixture.destroy());

  const cardEl = (): HTMLElement =>
    fixture.nativeElement.querySelector('mk-profile-card');
  const query = (selector: string): HTMLElement | null =>
    cardEl().querySelector(selector);

  it('renders the name and subtitle', () => {
    fixture.detectChanges();
    expect(query('.mk-profile-card__name')?.textContent).toContain(
      'Ada Lovelace',
    );
    expect(query('.mk-profile-card__subtitle')?.textContent).toContain(
      'Analytical Engine Programmer',
    );
  });

  it('hides the subtitle element when subtitle is empty', () => {
    fixture.componentInstance.subtitle.set('');
    fixture.detectChanges();
    expect(query('.mk-profile-card__subtitle')).toBeNull();
  });

  it('labels the card group by the name element', () => {
    fixture.detectChanges();
    const nameId = query('.mk-profile-card__name')?.id;
    expect(nameId).toBeTruthy();
    expect(cardEl().getAttribute('role')).toBe('group');
    expect(cardEl().getAttribute('aria-labelledby')).toBe(nameId);
  });

  it('forwards src, name and size to the avatar', () => {
    fixture.componentInstance.avatarSrc.set('/ada.jpg');
    fixture.detectChanges();
    const avatar: MkAvatar = fixture.debugElement.query(
      By.directive(MkAvatar),
    ).componentInstance;
    expect(avatar.src()).toBe('/ada.jpg');
    expect(avatar.name()).toBe('Ada Lovelace');
    expect(avatar.size()).toBe('lg');
  });

  it('falls back to initials when no avatarSrc is given', () => {
    fixture.detectChanges();
    expect(query('.mk-avatar__initials')?.textContent?.trim()).toBe('AL');
    expect(query('.mk-avatar__img')).toBeNull();
  });

  it('shows the cover only when coverSrc is set', () => {
    fixture.detectChanges();
    expect(query('.mk-profile-card__cover')).toBeNull();
    expect(cardEl().classList).not.toContain('mk-profile-card--has-cover');

    fixture.componentInstance.coverSrc.set('/cover.jpg');
    fixture.detectChanges();
    const img = query('.mk-profile-card__cover-img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('/cover.jpg');
    expect(cardEl().classList).toContain('mk-profile-card--has-cover');
  });

  it('does not render the cover in horizontal orientation', () => {
    fixture.componentInstance.coverSrc.set('/cover.jpg');
    fixture.componentInstance.orientation.set('horizontal');
    fixture.detectChanges();
    expect(query('.mk-profile-card__cover')).toBeNull();
    expect(cardEl().classList).not.toContain('mk-profile-card--has-cover');
  });

  it('reflects the orientation as a host class', () => {
    fixture.detectChanges();
    expect(cardEl().classList).toContain('mk-profile-card--vertical');
    expect(cardEl().classList).not.toContain('mk-profile-card--horizontal');

    fixture.componentInstance.orientation.set('horizontal');
    fixture.detectChanges();
    expect(cardEl().classList).toContain('mk-profile-card--horizontal');
    expect(cardEl().classList).not.toContain('mk-profile-card--vertical');
  });

  it('exposes the avatar size on the host for cover-overlap styling', () => {
    fixture.detectChanges();
    expect(cardEl().getAttribute('data-avatar-size')).toBe('lg');
  });

  it('leaves the meta and actions containers empty when nothing is projected', () => {
    fixture.detectChanges();
    // Empty containers are hidden by the `:empty` CSS rule; assert the DOM
    // precondition that rule relies on.
    expect(query('.mk-profile-card__meta')?.childElementCount).toBe(0);
    expect(query('.mk-profile-card__actions')?.childElementCount).toBe(0);
    expect(query('.mk-profile-card__body')?.childElementCount).toBe(0);
  });

  it('projects meta and actions content into their slots', () => {
    fixture.componentInstance.withBody.set(true);
    fixture.componentInstance.withSlots.set(true);
    fixture.detectChanges();

    const meta = query('.mk-profile-card__meta .mk-profile-meta');
    expect(meta).not.toBeNull();
    expect(meta?.textContent).toContain('128 posts');
    expect(meta?.textContent).toContain('2.4k followers');

    const actions = query('.mk-profile-card__actions .mk-profile-actions');
    expect(actions).not.toBeNull();
    expect(actions?.querySelector('button')?.textContent).toContain('Follow');

    expect(query('.mk-profile-card__body')?.textContent).toContain(
      'Body copy.',
    );
  });
});
