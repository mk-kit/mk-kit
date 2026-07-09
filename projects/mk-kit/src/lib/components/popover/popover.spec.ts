import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkPopover } from './popover';
import { MkPopconfirm } from './popconfirm';

describe('MkPopover', () => {
  let fixture: ComponentFixture<MkPopover>;
  let pop: MkPopover;
  let trigger: HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkPopover);
    pop = fixture.componentInstance;
    trigger = document.createElement('button');
    document.body.appendChild(trigger);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    trigger.remove();
  });

  it('open / close / toggle drive the opened state', () => {
    expect(pop.opened()).toBe(false);
    pop.open(trigger);
    expect(pop.opened()).toBe(true);
    pop.close();
    expect(pop.opened()).toBe(false);
    pop.toggle(trigger);
    expect(pop.opened()).toBe(true);
  });

  it('emits closed when it closes', () => {
    const closed = vi.fn();
    pop.closed.subscribe(closed);
    pop.open(trigger);
    pop.close();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('restores focus to the trigger on close(true) only', () => {
    trigger.focus();
    pop.open(trigger);
    (document.activeElement as HTMLElement)?.blur();
    pop.close(true);
    expect(document.activeElement).toBe(trigger);
  });
});

describe('MkPopconfirm', () => {
  let fixture: ComponentFixture<MkPopconfirm>;
  let pc: MkPopconfirm;
  let trigger: HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkPopconfirm);
    pc = fixture.componentInstance;
    trigger = document.createElement('button');
    document.body.appendChild(trigger);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    trigger.remove();
  });

  it('confirm emits confirm (not cancel) and closes', () => {
    const confirm = vi.fn();
    const cancel = vi.fn();
    pc.confirm.subscribe(confirm);
    pc.cancel.subscribe(cancel);
    pc.open(trigger);
    fixture.detectChanges();
    (pc as any).onConfirm();
    expect(confirm).toHaveBeenCalledOnce();
    expect(cancel).not.toHaveBeenCalled();
    expect(pc.opened()).toBe(false);
  });

  it('closing without confirming emits cancel (Escape / outside)', () => {
    const cancel = vi.fn();
    pc.cancel.subscribe(cancel);
    pc.open(trigger);
    fixture.detectChanges();
    pc.close();
    expect(cancel).toHaveBeenCalledOnce();
  });
});
