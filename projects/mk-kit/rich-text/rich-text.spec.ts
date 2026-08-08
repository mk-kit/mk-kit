import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MkRichText } from './rich-text';

@Component({
  imports: [MkRichText, ReactiveFormsModule],
  template: `<mk-rich-text [formControl]="control" placeholder="Say something" />`,
})
class Host {
  readonly control = new FormControl<string>('', { nonNullable: true });
}

describe('MkRichText (form control)', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    // jsdom has no execCommand; the engine's toolbar + line breaks call it.
    (document as any).execCommand = vi.fn();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    delete (document as any).execCommand;
  });

  const editable = () =>
    fixture.nativeElement.querySelector('.mk-rich-text__editable') as HTMLElement;

  const typeHtml = async (html: string) => {
    editable().innerHTML = html;
    editable().dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
  };

  it('writeValue renders sanitised HTML into the editable', async () => {
    host.control.setValue('<b>bold</b> and <em>italic</em>');
    await fixture.whenStable();
    expect(editable().innerHTML).toBe('<b>bold</b> and <em>italic</em>');
  });

  it('writeValue strips script blocks and event-handler attributes', async () => {
    host.control.setValue('<b onclick="steal()">hi</b><script>alert(1)</script>');
    await fixture.whenStable();
    expect(editable().innerHTML).toBe('<b>hi</b>');
  });

  it('a user edit propagates through onChange as sanitised HTML', async () => {
    await typeHtml('<b onmouseover="x()">safe</b><img src="x" onerror="pwn()">');
    expect(host.control.value).toBe('<b>safe</b>');
    expect(host.control.dirty).toBe(true);
  });

  it('unsafe link hrefs are dropped, safe ones hardened with rel/target', async () => {
    await typeHtml('<a href="javascript:alert(1)">bad</a> <a href="https://a.b">ok</a>');
    expect(host.control.value).toBe(
      '<a>bad</a> <a href="https://a.b" rel="noopener noreferrer nofollow" target="_blank">ok</a>',
    );
  });

  it('normalises a visually empty surface (lone <br>s, &nbsp;) to the empty string', async () => {
    await typeHtml('<br><b> &nbsp; </b><br>');
    expect(host.control.value).toBe('');
  });

  it('writeValue normalises visually empty markup to the empty string', async () => {
    host.control.setValue('<br>');
    await fixture.whenStable();
    expect(host.control.value).toBe('<br>'); // model side is untouched…
    const cmp = fixture.debugElement.children[0].componentInstance as MkRichText;
    expect(cmp.value()).toBe(''); // …but the control's own state is normalised
  });

  it('setDisabledState removes contenteditable; enable restores it', async () => {
    host.control.disable();
    await fixture.whenStable();
    expect(editable().getAttribute('contenteditable')).toBeNull();
    host.control.enable();
    await fixture.whenStable();
    expect(editable().getAttribute('contenteditable')).toBe('true');
  });

  it('writeValue does not echo back through onChange (control stays pristine)', async () => {
    host.control.setValue('<b>seed</b>');
    await fixture.whenStable();
    expect(host.control.dirty).toBe(false);
  });

  it('sanitisation survives a round-trip (idempotent on its own output)', async () => {
    await typeHtml('<span style="color:red" data-x="1">styled</span> <code>c()</code>');
    const first = host.control.value;
    expect(first).toBe('<span>styled</span> <code>c()</code>');
    await typeHtml(first);
    expect(host.control.value).toBe(first);
  });

  it('blur marks the control as touched', async () => {
    editable().focus();
    editable().blur();
    await fixture.whenStable();
    expect(host.control.touched).toBe(true);
  });
});
