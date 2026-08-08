import {
  Component,
  computed,
  provideZonelessChangeDetection,
  signal,
  type Signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkCan, MkCannot } from './can';
import { MkCanDisable } from './can-disable';
import { MkPermissionPolicy } from './permission-policy';

/** Static boolean policy. */
class StaticPolicy extends MkPermissionPolicy {
  constructor(private readonly granted: readonly string[]) {
    super();
  }
  can(permission: string): boolean {
    return this.granted.includes(permission);
  }
}

/** Live signal-based policy. */
const livePerms = signal<ReadonlySet<string>>(new Set());
class SignalPolicy extends MkPermissionPolicy {
  can(permission: string): Signal<boolean> {
    return computed(() => livePerms().has(permission));
  }
}

@Component({
  imports: [MkCan, MkCannot],
  template: `
    <button *mkCan="'posts.delete'" id="delete">Delete</button>
    <span *mkCan="'posts.read'; else denied" id="read">read</span>
    <ng-template #denied><span id="denied">no access</span></ng-template>
    <p *mkCannot="'posts.read'" id="upsell">ask an admin</p>
  `,
})
class StructuralHost {}

@Component({
  imports: [MkCanDisable],
  template: `
    <button [mkCanDisable]="'posts.delete'" id="btn">Delete</button>
    <a [mkCanDisable]="'posts.delete'" id="link">Billing</a>
  `,
})
class DisableHost {}

function create<T>(
  host: new () => T,
  policy?: MkPermissionPolicy,
): ComponentFixture<T> {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      ...(policy ? [{ provide: MkPermissionPolicy, useValue: policy }] : []),
    ],
  });
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  return fixture;
}

const q = (fixture: ComponentFixture<unknown>, selector: string) =>
  fixture.nativeElement.querySelector(selector) as HTMLElement | null;

describe('MkCan / MkCannot', () => {
  it('shows and hides per a static boolean policy', () => {
    const fixture = create(StructuralHost, new StaticPolicy(['posts.read']));
    expect(q(fixture, '#read')).toBeTruthy();
    expect(q(fixture, '#delete')).toBeNull();
    expect(q(fixture, '#denied')).toBeNull();
    fixture.destroy();
  });

  it('renders the else template while denied', () => {
    const fixture = create(StructuralHost, new StaticPolicy([]));
    expect(q(fixture, '#read')).toBeNull();
    expect(q(fixture, '#denied')).toBeTruthy();
    fixture.destroy();
  });

  it('mkCannot renders only while the permission is denied', () => {
    const denied = create(StructuralHost, new StaticPolicy([]));
    expect(q(denied, '#upsell')).toBeTruthy();
    denied.destroy();

    TestBed.resetTestingModule();
    const granted = create(StructuralHost, new StaticPolicy(['posts.read']));
    expect(q(granted, '#upsell')).toBeNull();
    granted.destroy();
  });

  it('creates and destroys the view live as a signal policy flips', async () => {
    livePerms.set(new Set());
    const fixture = create(StructuralHost, new SignalPolicy());
    expect(q(fixture, '#delete')).toBeNull();

    livePerms.set(new Set(['posts.delete']));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(q(fixture, '#delete')).toBeTruthy();

    livePerms.set(new Set());
    fixture.detectChanges();
    await fixture.whenStable();
    expect(q(fixture, '#delete')).toBeNull();
    fixture.destroy();
  });

  it('grants everything when no policy is provided', () => {
    const fixture = create(StructuralHost);
    expect(q(fixture, '#delete')).toBeTruthy();
    expect(q(fixture, '#read')).toBeTruthy();
    expect(q(fixture, '#denied')).toBeNull();
    expect(q(fixture, '#upsell')).toBeNull();
    fixture.destroy();
  });
});

describe('MkCanDisable', () => {
  it('sets disabled + aria-disabled on a button while denied', () => {
    const fixture = create(DisableHost, new StaticPolicy([]));
    const btn = q(fixture, '#btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    fixture.destroy();
  });

  it('leaves the button enabled while granted', () => {
    const fixture = create(DisableHost, new StaticPolicy(['posts.delete']));
    const btn = q(fixture, '#btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.hasAttribute('aria-disabled')).toBe(false);
    fixture.destroy();
  });

  it('sets aria-disabled only on a non-disableable element', () => {
    const fixture = create(DisableHost, new StaticPolicy([]));
    const link = q(fixture, '#link') as HTMLAnchorElement;
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect('disabled' in link).toBe(false);
    expect(link.hasAttribute('disabled')).toBe(false);
    fixture.destroy();
  });

  it('flips live with a signal policy', async () => {
    livePerms.set(new Set());
    const fixture = create(DisableHost, new SignalPolicy());
    const btn = q(fixture, '#btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    livePerms.set(new Set(['posts.delete']));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(btn.disabled).toBe(false);
    expect(btn.hasAttribute('aria-disabled')).toBe(false);
    fixture.destroy();
  });

  it('enables everything when no policy is provided', () => {
    const fixture = create(DisableHost);
    const btn = q(fixture, '#btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.hasAttribute('aria-disabled')).toBe(false);
    fixture.destroy();
  });
});
