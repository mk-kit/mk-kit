This summer a lot of Angular teams learned that "MIT" describes the code you already downloaded, not the code you will download next year. That is how the licence works, and it is fair. It also means that when you pick a component library you are trusting a *person* or a *company*, not a licence file. So here is what you are trusting when you pick mk-kit, in writing.

## The promise

1. **Every release of `@mk-kit/ui` is MIT.** Not "the community edition", not "under $1M revenue", not "fewer than five developers". The package you install from npm is the whole library, and it is MIT.
2. **Nothing that has shipped in the free package will ever move behind a paywall.** If a component is in `@mk-kit/ui` today, it stays there.
3. **No runtime licence checks, no telemetry, nothing phones home.** Not in the free library and not in the paid one either.
4. **The source is public** at [github.com/mk-kit/mk-kit](https://github.com/mk-kit/mk-kit), releases are published from CI with provenance, and the changelog is the actual changelog.

## How the lights stay on

Promises like that only hold if the project can pay for itself, so here is the model — it is called open-core and it is boring on purpose.

- **The library is the funnel and stays free.** Everything an admin panel needs: forms, tables, charts, dialogs, navigation, dates, kanban, chat, editors, dynamic forms — 180 components and counting.
- **Pro is a separate package** (`@mk-kit/pro`) with the things every paid Angular vendor charges for and that a solo team rarely builds itself: a drag-and-resize dashboard grid, a resource scheduler with recurrence, a gantt chart, a pivot grid, an Excel-like data grid, a form builder, XLSX and PDF export, and a finished Admin Starter app. The free library never imports from it.
- **Pro licences are offline keys.** You paste a signed key into `provideMkProLicense()`, it is verified locally, and an unlicensed or expired key shows a small watermark instead of breaking your app. A licensing problem must never take down production.
- **Support** for teams that want a human on the other end of their issues.

That is it. No investors to satisfy, no growth target that requires flipping the licence at version 22.

## What I will not do

- Relicense the free library. If I ever wanted to stop working on it, the right move is to hand it to the community, not to invoice it.
- Gate features by company size. Thresholds like "under $1M revenue" turn every procurement conversation into a legal one.
- Add "temporary" nag banners, licence checks or usage pings to the free package.

## What you can do

Use it. Report what is missing — the [issue tracker](https://github.com/mk-kit/mk-kit/issues) is where the roadmap actually comes from. If you are migrating from [PrimeNG](/blog/switching-from-primeng) or [Angular Material](/blog/switching-from-angular-material), those guides are written for exactly that. And if a paid widget or the Admin Starter would save your team a month, that is the way to fund the free part — [details on the Pro page](/pro).

— Mateusz
