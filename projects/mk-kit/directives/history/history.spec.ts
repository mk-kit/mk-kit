import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { registerHistoryHotkeys } from './history-hotkeys';
import { MkHistoryService, MkHistoryStack, type MkHistoryEntry } from './history.service';
import { MkHotkeysService } from '../hotkeys/hotkeys.service';

/** Entry that mutates `target[key]` and records call order into `log`. */
function entry(
  label: string,
  target: Record<string, unknown>,
  key: string,
  from: unknown,
  to: unknown,
  log: string[] = [],
): MkHistoryEntry {
  return {
    label,
    undo: () => {
      target[key] = from;
      log.push(`undo:${label}`);
    },
    redo: () => {
      target[key] = to;
      log.push(`redo:${label}`);
    },
  };
}

describe('MkHistoryStack', () => {
  it('starts empty with null labels and false undo/redo', () => {
    const stack = new MkHistoryStack();
    expect(stack.canUndo()).toBe(false);
    expect(stack.canRedo()).toBe(false);
    expect(stack.undoLabel()).toBeNull();
    expect(stack.redoLabel()).toBeNull();
    expect(stack.size()).toBe(0);
    expect(stack.undo()).toBe(false);
    expect(stack.redo()).toBe(false);
  });

  it('push → undo → redo walks the state and the signals', () => {
    const stack = new MkHistoryStack();
    const doc: Record<string, unknown> = { title: 'new' };
    stack.push(entry('Rename', doc, 'title', 'old', 'new'));

    expect(stack.canUndo()).toBe(true);
    expect(stack.canRedo()).toBe(false);
    expect(stack.undoLabel()).toBe('Rename');
    expect(stack.size()).toBe(1);

    expect(stack.undo()).toBe(true);
    expect(doc['title']).toBe('old');
    expect(stack.canUndo()).toBe(false);
    expect(stack.canRedo()).toBe(true);
    expect(stack.redoLabel()).toBe('Rename');
    expect(stack.size()).toBe(0);

    expect(stack.redo()).toBe(true);
    expect(doc['title']).toBe('new');
    expect(stack.canUndo()).toBe(true);
    expect(stack.canRedo()).toBe(false);
  });

  it('undoes in LIFO order and exposes the top labels', () => {
    const stack = new MkHistoryStack();
    const doc: Record<string, unknown> = {};
    stack.push(entry('First', doc, 'a', 0, 1));
    stack.push(entry('Second', doc, 'b', 0, 1));

    expect(stack.undoLabel()).toBe('Second');
    stack.undo();
    expect(stack.undoLabel()).toBe('First');
    expect(stack.redoLabel()).toBe('Second');
  });

  it('push clears the redo branch (linear history)', () => {
    const stack = new MkHistoryStack();
    const doc: Record<string, unknown> = {};
    stack.push(entry('A', doc, 'a', 0, 1));
    stack.push(entry('B', doc, 'b', 0, 1));
    stack.undo();
    expect(stack.canRedo()).toBe(true);

    stack.push(entry('C', doc, 'c', 0, 1));
    expect(stack.canRedo()).toBe(false);
    expect(stack.redoLabel()).toBeNull();
    expect(stack.size()).toBe(2);
    expect(stack.undoLabel()).toBe('C');
  });

  it('evicts the oldest entries beyond the limit', () => {
    const stack = new MkHistoryStack();
    stack.limit = 2;
    const doc: Record<string, unknown> = {};
    stack.push(entry('A', doc, 'a', 0, 1));
    stack.push(entry('B', doc, 'b', 0, 1));
    stack.push(entry('C', doc, 'c', 0, 1));

    expect(stack.size()).toBe(2);
    stack.undo();
    stack.undo();
    expect(stack.canUndo()).toBe(false); // 'A' was evicted
    expect(doc['a']).toBeUndefined();
  });

  it('lowering the limit trims immediately and clamps below 1', () => {
    const stack = new MkHistoryStack();
    const doc: Record<string, unknown> = {};
    for (const label of ['A', 'B', 'C']) stack.push(entry(label, doc, label, 0, 1));

    stack.limit = 1;
    expect(stack.size()).toBe(1);
    expect(stack.undoLabel()).toBe('C');

    stack.limit = 0;
    expect(stack.limit).toBe(1);
    expect(stack.size()).toBe(1);
  });

  it('batch collects pushes into one entry; undo reversed, redo forward', () => {
    const stack = new MkHistoryStack();
    const doc: Record<string, unknown> = {};
    const log: string[] = [];

    const result = stack.batch('Move card', () => {
      stack.push(entry('remove', doc, 'a', 0, 1, log));
      stack.push(entry('insert', doc, 'b', 0, 1, log));
      return 42;
    });

    expect(result).toBe(42);
    expect(stack.size()).toBe(1);
    expect(stack.undoLabel()).toBe('Move card');

    stack.undo();
    expect(log).toEqual(['undo:insert', 'undo:remove']);

    log.length = 0;
    stack.redo();
    expect(log).toEqual(['redo:remove', 'redo:insert']);
  });

  it('nested batches flatten into the outermost entry', () => {
    const stack = new MkHistoryStack();
    const doc: Record<string, unknown> = {};
    const log: string[] = [];

    stack.batch('Outer', () => {
      stack.push(entry('one', doc, 'a', 0, 1, log));
      stack.batch('Inner', () => {
        stack.push(entry('two', doc, 'b', 0, 1, log));
      });
      stack.push(entry('three', doc, 'c', 0, 1, log));
    });

    expect(stack.size()).toBe(1);
    expect(stack.undoLabel()).toBe('Outer');
    stack.undo();
    expect(log).toEqual(['undo:three', 'undo:two', 'undo:one']);
  });

  it('an empty batch records nothing', () => {
    const stack = new MkHistoryStack();
    expect(stack.batch('Nothing', () => 'ok')).toBe('ok');
    expect(stack.size()).toBe(0);
    expect(stack.canUndo()).toBe(false);
  });

  it('ignores pushes made during undo/redo (re-entrancy guard)', () => {
    const stack = new MkHistoryStack();
    const doc: Record<string, unknown> = {};
    stack.push({
      label: 'Edit',
      undo: () => {
        doc['v'] = 'old';
        // A naive change handler reacting to the replay:
        stack.push(entry('Spurious', doc, 'v', 'old', 'older'));
      },
      redo: () => {
        doc['v'] = 'new';
        stack.push(entry('Spurious', doc, 'v', 'new', 'newer'));
      },
    });

    expect(stack.undo()).toBe(true);
    expect(stack.size()).toBe(0);
    expect(stack.canRedo()).toBe(true);

    expect(stack.redo()).toBe(true);
    expect(stack.size()).toBe(1);
    expect(stack.undoLabel()).toBe('Edit');
    expect(stack.canRedo()).toBe(false);
  });

  it('clear drops both branches', () => {
    const stack = new MkHistoryStack();
    const doc: Record<string, unknown> = {};
    stack.push(entry('A', doc, 'a', 0, 1));
    stack.push(entry('B', doc, 'b', 0, 1));
    stack.undo();

    stack.clear();
    expect(stack.canUndo()).toBe(false);
    expect(stack.canRedo()).toBe(false);
    expect(stack.size()).toBe(0);
    expect(stack.undoLabel()).toBeNull();
    expect(stack.redoLabel()).toBeNull();
  });

  it('createScope returns an independent stack', () => {
    const root = new MkHistoryStack();
    const scope = root.createScope();
    const doc: Record<string, unknown> = {};

    scope.push(entry('Scoped', doc, 'a', 0, 1));
    expect(scope.size()).toBe(1);
    expect(root.size()).toBe(0);

    root.push(entry('Root', doc, 'b', 0, 1));
    scope.clear();
    expect(root.size()).toBe(1);
    expect(root.undoLabel()).toBe('Root');
  });
});

describe('MkHistoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('is a root-injectable MkHistoryStack singleton', () => {
    const service = TestBed.inject(MkHistoryService);
    expect(service).toBeInstanceOf(MkHistoryStack);
    expect(TestBed.inject(MkHistoryService)).toBe(service);
    expect(service.createScope()).not.toBe(service);
  });
});

describe('registerHistoryHotkeys', () => {
  interface Mock {
    service: MkHotkeysService;
    registered: { combo: string; handler: (e: KeyboardEvent) => void; options: unknown }[];
    disposed: string[];
  }

  function mockHotkeys(): Mock {
    const mock: Mock = { service: undefined!, registered: [], disposed: [] };
    mock.service = {
      register: (combo: string, handler: (e: KeyboardEvent) => void, options: unknown) => {
        mock.registered.push({ combo, handler, options });
        return () => mock.disposed.push(combo);
      },
    } as unknown as MkHotkeysService;
    return mock;
  }

  function setup(): Mock {
    const mock = mockHotkeys();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: MkHotkeysService, useValue: mock.service },
      ],
    });
    return mock;
  }

  const fire = (mock: Mock, combo: string) =>
    mock.registered
      .filter((r) => r.combo === combo)
      .forEach((r) => r.handler(new KeyboardEvent('keydown')));

  it('wires mod+z to undo and mod+shift+z / mod+y to redo on the root service', () => {
    const mock = setup();
    const history = TestBed.inject(MkHistoryService);
    const doc: Record<string, unknown> = { v: 'new' };
    history.push(entry('Edit', doc, 'v', 'old', 'new'));

    TestBed.runInInjectionContext(() => registerHistoryHotkeys());

    expect(mock.registered.map((r) => r.combo)).toEqual(['mod+z', 'mod+shift+z', 'mod+y']);
    for (const r of mock.registered) {
      expect(r.options).toEqual({ preventDefault: true });
    }

    fire(mock, 'mod+z');
    expect(doc['v']).toBe('old');
    expect(history.canRedo()).toBe(true);

    fire(mock, 'mod+shift+z');
    expect(doc['v']).toBe('new');

    history.undo();
    fire(mock, 'mod+y');
    expect(doc['v']).toBe('new');
    history.clear();
  });

  it('binds to an explicitly passed scoped stack instead of the service', () => {
    const mock = setup();
    const root = TestBed.inject(MkHistoryService);
    const scope = root.createScope();
    const doc: Record<string, unknown> = { v: 'new' };
    scope.push(entry('Scoped', doc, 'v', 'old', 'new'));

    TestBed.runInInjectionContext(() => registerHistoryHotkeys(scope));

    fire(mock, 'mod+z');
    expect(doc['v']).toBe('old');
    expect(scope.canRedo()).toBe(true);
    expect(root.canRedo()).toBe(false);
  });

  it('dispose unregisters all three shortcuts exactly once', () => {
    const mock = setup();
    const dispose = TestBed.runInInjectionContext(() => registerHistoryHotkeys());

    dispose();
    expect(mock.disposed).toEqual(['mod+z', 'mod+shift+z', 'mod+y']);

    dispose();
    expect(mock.disposed).toHaveLength(3);
  });
});
