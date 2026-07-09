import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkFab, MkFabAction } from './fab';

@Component({
  imports: [MkFab, MkFabAction],
  template: `<mk-fab label="Create">
    +
    @if (withActions) {
      <button mkFabAction>Doc</button>
      <button mkFabAction>Folder</button>
    }
  </mk-fab>`,
})
class Host {
  withActions = false;
}

describe('MkFab', () => {
  let fixture: ComponentFixture<Host>;
  let fab: MkFab;

  const setup = (withActions: boolean) => {
    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.withActions = withActions;
    fixture.detectChanges();
    fab = fixture.debugElement.children[0].componentInstance;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  afterEach(() => fixture.destroy());

  it('emits action when it has no speed-dial actions', () => {
    setup(false);
    const action = vi.fn();
    fab.action.subscribe(action);
    (fab as any).onClick();
    expect(action).toHaveBeenCalledOnce();
    expect(fab.open()).toBe(false);
  });

  it('toggles the speed-dial when it has actions', () => {
    setup(true);
    expect((fab as any).hasActions()).toBe(true);
    (fab as any).onClick();
    expect(fab.open()).toBe(true);
    (fab as any).onClick();
    expect(fab.open()).toBe(false);
  });

  it('Escape closes an open speed-dial', () => {
    setup(true);
    fab.open.set(true);
    (fab as any).onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fab.open()).toBe(false);
  });
});
