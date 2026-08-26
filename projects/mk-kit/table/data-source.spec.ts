import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import {
  MkDataPage,
  MkDataRequest,
  MkTableDataSource,
} from './data-source';
import { MkSort } from './sort/sort';
import { MkSortHeader } from './sort/sort-header';

interface Row {
  id: number;
  name: string;
}

/** A promise with its resolvers exposed, to settle fetches out of order. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Drain the microtask queue so promise settles reach the data source. */
async function drain(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function pageOf(ids: number[], total = ids.length): MkDataPage<Row> {
  return { rows: ids.map((id) => ({ id, name: `row-${id}` })), total };
}

describe('MkTableDataSource', () => {
  it('loads immediately on construction with the initial request', async () => {
    const requests: MkDataRequest[] = [];
    const ds = new MkTableDataSource<Row>(async (req) => {
      requests.push(req);
      return pageOf([1, 2]);
    });

    expect(ds.loading()).toBe(true);
    expect(ds.rows()).toEqual([]);
    expect(requests).toEqual([
      { page: 1, pageSize: 10, sort: null, filter: '', query: null },
    ]);

    await drain();
    expect(ds.loading()).toBe(false);
    expect(ds.rows()).toEqual(pageOf([1, 2]).rows);
    expect(ds.total()).toBe(2);
    expect(ds.error()).toBeNull();
    expect(ds.empty()).toBe(false);
    ds.destroy();
  });

  it('honours the pageSize option', () => {
    const requests: MkDataRequest[] = [];
    const ds = new MkTableDataSource<Row>(
      async (req) => {
        requests.push(req);
        return pageOf([]);
      },
      { pageSize: 25 },
    );
    expect(ds.pageSize()).toBe(25);
    expect(requests[0].pageSize).toBe(25);
    ds.destroy();
  });

  it('reports empty only after a settled load with no rows', async () => {
    const ds = new MkTableDataSource<Row>(async () => pageOf([]));
    expect(ds.empty()).toBe(false); // still loading
    await drain();
    expect(ds.empty()).toBe(true);
    ds.destroy();
  });

  describe('page / pageSize / sort transitions', () => {
    let requests: MkDataRequest[];
    let ds: MkTableDataSource<Row>;

    beforeEach(async () => {
      requests = [];
      ds = new MkTableDataSource<Row>(async (req) => {
        requests.push(req);
        return pageOf([1], 100);
      });
      await drain();
      requests.length = 0;
    });

    afterEach(() => ds.destroy());

    it('setPage loads immediately and keeps previous rows while loading', () => {
      ds.setPage(3);
      expect(ds.page()).toBe(3);
      expect(ds.loading()).toBe(true);
      expect(ds.rows()).toEqual(pageOf([1]).rows); // not blanked
      expect(requests.map((r) => r.page)).toEqual([3]);
    });

    it('setPage with the current page is a no-op', () => {
      ds.setPage(1);
      expect(requests).toEqual([]);
      expect(ds.loading()).toBe(false);
    });

    it('setPageSize resets to page 1 and loads immediately', () => {
      ds.setPage(3);
      ds.setPageSize(50);
      expect(ds.page()).toBe(1);
      expect(ds.pageSize()).toBe(50);
      expect(requests.at(-1)).toEqual({
        page: 1,
        pageSize: 50,
        sort: null,
        filter: '',
        query: null,
      });
    });

    it('setSort resets to page 1 and loads immediately', () => {
      ds.setPage(3);
      ds.setSort({ active: 'name', direction: 'asc' });
      expect(ds.page()).toBe(1);
      expect(ds.sort()).toEqual({ active: 'name', direction: 'asc' });
      expect(requests.at(-1)?.sort).toEqual({
        active: 'name',
        direction: 'asc',
      });
    });

    it("setSort accepts mk-table's MkSortChange payload", () => {
      ds.setSort({ key: 'name', direction: 'desc' });
      expect(ds.sort()).toEqual({ active: 'name', direction: 'desc' });
    });

    it("setSort normalises a cleared sort ('none' direction) to null", () => {
      ds.setSort({ active: 'name', direction: 'asc' });
      ds.setSort({ active: '', direction: 'none' });
      expect(ds.sort()).toBeNull();
      expect(requests.at(-1)?.sort).toBeNull();
    });

    it('setSort with an equivalent sort does not refetch', () => {
      ds.setSort({ active: 'name', direction: 'asc' });
      requests.length = 0;
      ds.setSort({ key: 'name', direction: 'asc' });
      expect(requests).toEqual([]);
    });
  });

  describe('filter debounce (fake timers)', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('debounces setFilter by 300ms, resetting to page 1', async () => {
      const requests: MkDataRequest[] = [];
      const ds = new MkTableDataSource<Row>(async (req) => {
        requests.push(req);
        return pageOf([1], 100);
      });
      await drain();
      ds.setPage(4);
      await drain();
      requests.length = 0;

      ds.setFilter('an');
      expect(ds.filter()).toBe('an'); // signal updates immediately
      expect(ds.page()).toBe(1);
      expect(requests).toEqual([]); // no request yet

      vi.advanceTimersByTime(299);
      expect(requests).toEqual([]);
      vi.advanceTimersByTime(1);
      expect(requests).toEqual([
        { page: 1, pageSize: 10, sort: null, filter: 'an', query: null },
      ]);
      ds.destroy();
    });

    it('coalesces rapid typing into one request for the last value', async () => {
      const requests: MkDataRequest[] = [];
      const ds = new MkTableDataSource<Row>(async (req) => {
        requests.push(req);
        return pageOf([]);
      });
      await drain();
      requests.length = 0;

      ds.setFilter('a');
      vi.advanceTimersByTime(100);
      ds.setFilter('an');
      vi.advanceTimersByTime(100);
      ds.setFilter('ann');
      vi.advanceTimersByTime(300);
      expect(requests.map((r) => r.filter)).toEqual(['ann']);
      ds.destroy();
    });

    it('honours a custom filterDebounce', async () => {
      const requests: MkDataRequest[] = [];
      const ds = new MkTableDataSource<Row>(
        async (req) => {
          requests.push(req);
          return pageOf([]);
        },
        { filterDebounce: 50 },
      );
      await drain();
      requests.length = 0;

      ds.setFilter('x');
      vi.advanceTimersByTime(50);
      expect(requests.map((r) => r.filter)).toEqual(['x']);
      ds.destroy();
    });

    it('refresh() flushes a pending debounced filter immediately', async () => {
      const requests: MkDataRequest[] = [];
      const ds = new MkTableDataSource<Row>(async (req) => {
        requests.push(req);
        return pageOf([]);
      });
      await drain();
      requests.length = 0;

      ds.setFilter('now');
      ds.refresh();
      expect(requests.map((r) => r.filter)).toEqual(['now']);

      // The cancelled timer must not fire a duplicate request later.
      vi.advanceTimersByTime(1000);
      expect(requests).toHaveLength(1);
      ds.destroy();
    });

    it('an immediate trigger (setPage) flushes the pending filter into its request', async () => {
      const requests: MkDataRequest[] = [];
      const ds = new MkTableDataSource<Row>(async (req) => {
        requests.push(req);
        return pageOf([]);
      });
      await drain();
      requests.length = 0;

      ds.setFilter('q');
      ds.setPage(2);
      expect(requests).toEqual([
        { page: 2, pageSize: 10, sort: null, filter: 'q', query: null },
      ]);
      vi.advanceTimersByTime(1000);
      expect(requests).toHaveLength(1); // debounce timer was cancelled
      ds.destroy();
    });
  });

  describe('latest-wins race handling', () => {
    it('ignores a stale response that resolves after a newer one', async () => {
      const first = deferred<MkDataPage<Row>>();
      const second = deferred<MkDataPage<Row>>();
      const pending = [first, second];
      const ds = new MkTableDataSource<Row>(() => pending.shift()!.promise);

      ds.setPage(2); // supersedes the initial load
      second.resolve(pageOf([2], 100));
      await drain();
      expect(ds.rows()).toEqual(pageOf([2]).rows);
      expect(ds.loading()).toBe(false);

      first.resolve(pageOf([999], 1)); // stale — must be discarded
      await drain();
      expect(ds.rows()).toEqual(pageOf([2]).rows);
      expect(ds.total()).toBe(100);
      ds.destroy();
    });

    it('keeps loading() true while the latest request is still in flight', async () => {
      const first = deferred<MkDataPage<Row>>();
      const second = deferred<MkDataPage<Row>>();
      const pending = [first, second];
      const ds = new MkTableDataSource<Row>(() => pending.shift()!.promise);

      ds.setPage(2);
      first.resolve(pageOf([999])); // stale settles first
      await drain();
      expect(ds.loading()).toBe(true); // latest still pending
      expect(ds.rows()).toEqual([]); // stale rows never applied

      second.resolve(pageOf([2]));
      await drain();
      expect(ds.loading()).toBe(false);
      expect(ds.rows()).toEqual(pageOf([2]).rows);
      ds.destroy();
    });

    it('ignores a stale rejection after a newer success', async () => {
      const first = deferred<MkDataPage<Row>>();
      const second = deferred<MkDataPage<Row>>();
      const pending = [first, second];
      const ds = new MkTableDataSource<Row>(() => pending.shift()!.promise);

      ds.setPage(2);
      second.resolve(pageOf([2]));
      await drain();
      first.reject(new Error('stale failure'));
      await drain();
      expect(ds.error()).toBeNull();
      expect(ds.rows()).toEqual(pageOf([2]).rows);
      ds.destroy();
    });
  });

  describe('errors', () => {
    it('sets error on reject, keeps previous rows, and recovers on next success', async () => {
      const boom = new Error('boom');
      let fail = false;
      const ds = new MkTableDataSource<Row>(async () => {
        if (fail) throw boom;
        return pageOf([1], 5);
      });
      await drain();
      expect(ds.rows()).toEqual(pageOf([1]).rows);

      fail = true;
      ds.setPage(2);
      await drain();
      expect(ds.error()).toBe(boom);
      expect(ds.loading()).toBe(false);
      expect(ds.rows()).toEqual(pageOf([1]).rows); // not blanked
      expect(ds.total()).toBe(5);

      fail = false;
      ds.refresh();
      await drain();
      expect(ds.error()).toBeNull();
      expect(ds.rows()).toEqual(pageOf([1]).rows);
      ds.destroy();
    });

    it('treats a synchronous fetcher throw as a rejection', () => {
      const boom = new Error('sync');
      const ds = new MkTableDataSource<Row>(() => {
        throw boom;
      });
      expect(ds.error()).toBe(boom);
      expect(ds.loading()).toBe(false);
      ds.destroy();
    });
  });

  describe('observable fetcher', () => {
    it('applies the first emission and releases the subscription', async () => {
      const subject = new Subject<MkDataPage<Row>>();
      const ds = new MkTableDataSource<Row>(() => subject.asObservable());
      expect(ds.loading()).toBe(true);
      expect(subject.observed).toBe(true);

      subject.next(pageOf([1, 2], 7));
      expect(ds.rows()).toEqual(pageOf([1, 2]).rows);
      expect(ds.total()).toBe(7);
      expect(ds.loading()).toBe(false);
      expect(subject.observed).toBe(false); // single-shot: unsubscribed
      ds.destroy();
    });

    it('unsubscribes a superseded in-flight observable', () => {
      const subjects: Subject<MkDataPage<Row>>[] = [];
      const ds = new MkTableDataSource<Row>(() => {
        const s = new Subject<MkDataPage<Row>>();
        subjects.push(s);
        return s.asObservable();
      });

      ds.setPage(2);
      expect(subjects[0].observed).toBe(false); // stale fetch cancelled
      expect(subjects[1].observed).toBe(true);

      subjects[1].next(pageOf([2]));
      expect(ds.rows()).toEqual(pageOf([2]).rows);
      ds.destroy();
    });

    it('surfaces an observable error', () => {
      const subject = new Subject<MkDataPage<Row>>();
      const ds = new MkTableDataSource<Row>(() => subject.asObservable());
      const boom = new Error('http 500');
      subject.error(boom);
      expect(ds.error()).toBe(boom);
      expect(ds.loading()).toBe(false);
      ds.destroy();
    });
  });

  describe('connectSort', () => {
    @Component({
      imports: [MkSort, MkSortHeader],
      template: `<table mkSort>
        <thead>
          <tr>
            <th mkSortHeader="name">Name</th>
          </tr>
        </thead>
      </table>`,
    })
    class SortHost {}

    afterEach(() => {
      // MkSort announces via MkLiveAnnouncer's body-level region; remove it so
      // it can't pollute other specs sharing this jsdom.
      document
        .querySelectorAll('.mk-visually-hidden')
        .forEach((el) => el.remove());
    });

    it('pipes real mkSort header clicks into requests, idempotently', async () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(SortHost);
      await fixture.whenStable();
      const sort = fixture.debugElement
        .query(By.directive(MkSort))
        .injector.get(MkSort);

      const requests: MkDataRequest[] = [];
      const ds = new MkTableDataSource<Row>(async (req) => {
        requests.push(req);
        return pageOf([1], 100);
      });
      await drain();
      ds.setPage(3);
      await drain();
      requests.length = 0;

      ds.connectSort(sort);
      ds.connectSort(sort); // idempotent — must not double-subscribe

      const button = fixture.nativeElement.querySelector(
        'th button',
      ) as HTMLButtonElement;
      button.click();
      expect(requests).toEqual([
        { page: 1, pageSize: 10, sort: { active: 'name', direction: 'asc' }, filter: '', query: null },
      ]);

      button.click();
      expect(requests.at(-1)?.sort).toEqual({
        active: 'name',
        direction: 'desc',
      });

      button.click(); // cleared → sort null
      expect(requests.at(-1)?.sort).toBeNull();
      expect(requests).toHaveLength(3);

      ds.destroy();
      fixture.destroy();
    });
  });

  describe('setQuery', () => {
    it('compacts the tree, resets to page 1, loads at once, and clears with null', async () => {
      const reqs: MkDataRequest[] = [];
      const ds = new MkTableDataSource<Row>(async (req) => {
        reqs.push(req);
        return pageOf([]);
      });
      await drain();
      ds.setPage(3);
      await drain();
      ds.setQuery({
        id: 'g',
        combinator: 'and',
        rules: [
          { id: 'r', field: 'name', operator: 'contains', value: 'a' },
          { id: 'u', field: 'name', operator: 'contains', value: '' }, // unfinished → dropped
          { id: 'e', combinator: 'or', rules: [] }, // empty → dropped
        ],
      });
      await drain();
      const last = reqs[reqs.length - 1];
      expect(last.page).toBe(1);
      expect(last.query).toEqual({
        id: 'g',
        combinator: 'and',
        rules: [{ id: 'r', field: 'name', operator: 'contains', value: 'a' }],
      });
      const count = reqs.length;
      ds.setQuery({ id: 'g', combinator: 'and', rules: [{ id: 'r', field: 'name', operator: 'contains', value: 'a' }] });
      await drain();
      expect(reqs.length).toBe(count); // unchanged → no reload
      ds.setQuery({ id: 'x', combinator: 'or', rules: [] });
      await drain();
      expect(reqs[reqs.length - 1].query).toBeNull();
      ds.destroy();
    });
  });

  describe('destroy', () => {
    it('discards in-flight settles and cancels the debounce timer', async () => {
      vi.useFakeTimers();
      const pending = deferred<MkDataPage<Row>>();
      let calls = 0;
      const ds = new MkTableDataSource<Row>(() => {
        calls++;
        return pending.promise;
      });
      ds.setFilter('q');
      ds.destroy();
      expect(ds.loading()).toBe(false);

      pending.resolve(pageOf([1]));
      await drain();
      expect(ds.rows()).toEqual([]); // settle after destroy is ignored

      vi.advanceTimersByTime(1000);
      expect(calls).toBe(1); // debounced filter never fired
      vi.useRealTimers();
    });

    it('unsubscribes an in-flight observable and connected sorts', async () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      @Component({
        imports: [MkSort, MkSortHeader],
        template: `<table mkSort>
          <thead>
            <tr>
              <th mkSortHeader="name">Name</th>
            </tr>
          </thead>
        </table>`,
      })
      class SortHost {}
      const fixture = TestBed.createComponent(SortHost);
      await fixture.whenStable();
      const sort = fixture.debugElement
        .query(By.directive(MkSort))
        .injector.get(MkSort);

      const subject = new Subject<MkDataPage<Row>>();
      let calls = 0;
      const ds = new MkTableDataSource<Row>(() => {
        calls++;
        return subject.asObservable();
      });
      ds.connectSort(sort);
      expect(subject.observed).toBe(true);

      ds.destroy();
      expect(subject.observed).toBe(false);

      const button = fixture.nativeElement.querySelector(
        'th button',
      ) as HTMLButtonElement;
      button.click();
      expect(calls).toBe(1); // disconnected sort no longer triggers loads

      fixture.destroy();
      document
        .querySelectorAll('.mk-visually-hidden')
        .forEach((el) => el.remove());
    });

    it('makes further setters and refresh no-ops', async () => {
      let calls = 0;
      const ds = new MkTableDataSource<Row>(async () => {
        calls++;
        return pageOf([]);
      });
      await drain();
      ds.destroy();
      ds.setPage(2);
      ds.setSort({ active: 'name', direction: 'asc' });
      ds.refresh();
      expect(calls).toBe(1);
    });

    it('auto-destroys via DestroyRef when created in an injection context', async () => {
      const pending = deferred<MkDataPage<Row>>();

      @Component({ template: '' })
      class DsHost {
        readonly ds = new MkTableDataSource<Row>(() => pending.promise);
      }

      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(DsHost);
      await fixture.whenStable();
      const ds = fixture.componentInstance.ds;
      expect(ds.loading()).toBe(true);

      fixture.destroy();
      expect(ds.loading()).toBe(false);

      pending.resolve(pageOf([1]));
      await drain();
      expect(ds.rows()).toEqual([]); // resolution after host destroy ignored
    });
  });
});
