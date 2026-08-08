import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkMarkdown } from './markdown';

describe('MkMarkdown', () => {
  let fixture: ComponentFixture<MkMarkdown>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkMarkdown);
  });

  afterEach(() => fixture.destroy());

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function setSource(src: string): void {
    fixture.componentRef.setInput('source', src);
    fixture.detectChanges();
  }

  it('renders markdown blocks into the body', () => {
    setSource('# Hello\n\nsome **bold** text');
    expect(host().querySelector('h1')?.textContent).toBe('Hello');
    expect(host().querySelector('p strong')?.textContent).toBe('bold');
  });

  it('updates when the source input changes', () => {
    setSource('# One');
    expect(host().querySelector('h1')?.textContent).toBe('One');
    setSource('## Two');
    expect(host().querySelector('h1')).toBeNull();
    expect(host().querySelector('h2')?.textContent).toBe('Two');
  });

  it('escapes raw HTML — <script> shows as text and never executes', () => {
    setSource('before <script>window.alert(1)</script> after');
    expect(host().querySelector('script')).toBeNull();
    expect(host().querySelector('p')?.textContent).toContain('<script>window.alert(1)</script>');
  });

  it('drops javascript: link hrefs', () => {
    setSource('[click](javascript:alert(1)) and [ok](https://x.dev)');
    const anchors = host().querySelectorAll('a');
    expect(anchors).toHaveLength(1);
    expect(anchors[0].getAttribute('href')).toBe('https://x.dev');
    expect(host().textContent).toContain('click');
  });

  it('renders plain links by default and target/rel with linkTarget _blank', () => {
    setSource('[docs](https://x.dev)');
    let link = host().querySelector('a')!;
    expect(link.getAttribute('target')).toBeNull();
    expect(link.getAttribute('rel')).toBeNull();

    fixture.componentRef.setInput('linkTarget', '_blank');
    fixture.detectChanges();
    link = host().querySelector('a')!;
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('does not autolink bare URLs unless enabled', () => {
    setSource('see https://example.com');
    expect(host().querySelector('a')).toBeNull();

    fixture.componentRef.setInput('autolink', true);
    fixture.detectChanges();
    expect(host().querySelector('a')?.getAttribute('href')).toBe('https://example.com');
  });

  it('highlights known fence languages and renders unknown ones plain', () => {
    setSource('```json\n{"a": 1}\n```');
    expect(host().querySelector('pre.mk-markdown__code .mk-tok-key')).not.toBeNull();

    setSource('```brainfuck\n+[----->+++<]\n```');
    const code = host().querySelector('pre.mk-markdown__code code')!;
    expect(code.querySelector('[class^="mk-tok"]')).toBeNull();
    expect(code.textContent).toBe('+[----->+++<]');
  });

  it('renders table alignment classes through the innerHTML binding', () => {
    setSource('| a | b |\n| :--: | --: |\n| 1 | 2 |');
    const cells = host().querySelectorAll('td');
    expect(cells[0].classList.contains('mk-markdown--center')).toBe(true);
    expect(cells[1].classList.contains('mk-markdown--right')).toBe(true);
  });

  it('keeps ordered-list start numbers through Angular sanitization', () => {
    setSource('5. five\n6. six');
    expect(host().querySelector('ol')?.getAttribute('start')).toBe('5');
  });

  it('has the mk-markdown host class for its unencapsulated styles', () => {
    setSource('x');
    expect(host().classList.contains('mk-markdown')).toBe(true);
  });
});
