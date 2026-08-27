import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MkButton } from '@mk-kit/ui/button';
import { MkCheckbox } from '@mk-kit/ui/checkbox';
import { MkDialogService, MkToastService } from '@mk-kit/ui/feedback';
import {
  MkFormField,
  MkInput,
  MkRadio,
  MkRadioGroup,
  MkSelect,
  MkSwitch,
} from '@mk-kit/ui/forms';
import { MkMenu, MkMenuItem, MkMenuTrigger, MkTab, MkTabs } from '@mk-kit/ui/navigation';
import { MkTable, MkTableColumn } from '@mk-kit/ui/table';
import {
  MkButtonHarness,
  MkCheckboxHarness,
  MkDialogHarness,
  MkFormFieldHarness,
  MkHarnessLoader,
  MkInputHarness,
  MkMenuHarness,
  MkRadioGroupHarness,
  MkSelectHarness,
  MkSwitchHarness,
  MkTableHarness,
  MkTabsHarness,
  MkToastHarness,
} from './index';

interface Row {
  id: number;
  name: string;
  age: number;
}

@Component({
  imports: [
    FormsModule,
    MkButton,
    MkCheckbox,
    MkFormField,
    MkInput,
    MkRadio,
    MkRadioGroup,
    MkSelect,
    MkSwitch,
    MkMenu,
    MkMenuItem,
    MkMenuTrigger,
    MkTab,
    MkTabs,
    MkTable,
  ],
  template: `
    <button mkButton tone="danger" variant="outline" (click)="clicks.set(clicks() + 1)">Delete</button>
    <button mkButton class="secondary" [loading]="true">Saving</button>
    <a mkButton href="#" [disabled]="true">Docs</a>

    <mk-form-field label="Name" hint="Your full name" [required]="true">
      <input mkInput placeholder="Jane" [(ngModel)]="name" />
    </mk-form-field>

    <mk-checkbox [(checked)]="agree">I agree</mk-checkbox>
    <mk-switch [(checked)]="dark">Dark mode</mk-switch>

    <mk-radio-group [(ngModel)]="size">
      <mk-radio value="s">Small</mk-radio>
      <mk-radio value="m">Medium</mk-radio>
      <mk-radio value="l" [disabled]="true">Large</mk-radio>
    </mk-radio-group>

    <mk-select placeholder="Pick a role" [options]="roles" [(ngModel)]="role" />

    <mk-tabs>
      <mk-tab label="First">One</mk-tab>
      <mk-tab label="Second">Two</mk-tab>
      <mk-tab label="Off" [disabled]="true">Three</mk-tab>
    </mk-tabs>

    <button [mkMenuTriggerFor]="menu">Actions</button>
    <mk-menu #menu>
      <mk-menu-item (action)="picked.set('Edit')">Edit</mk-menu-item>
      <mk-menu-item [disabled]="true">Archive</mk-menu-item>
      <mk-menu-item danger (action)="picked.set('Delete')">Delete</mk-menu-item>
    </mk-menu>

    <mk-table [columns]="columns" [data]="rows()" [selectable]="true" (sortChange)="sorted.set($event)" />
  `,
})
class Host {
  readonly clicks = signal(0);
  readonly name = signal('');
  readonly agree = signal(false);
  readonly dark = signal(true);
  readonly size = signal<string | null>('m');
  readonly role = signal<string | null>(null);
  readonly picked = signal('');
  readonly sorted = signal<unknown>(null);
  readonly roles = [
    { label: 'Admin', value: 'admin' },
    { label: 'Editor', value: 'editor' },
    { label: 'Viewer', value: 'viewer', disabled: true },
  ];
  readonly columns: MkTableColumn<Row>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'age', header: 'Age', sortable: true },
  ];
  readonly rows = signal<Row[]>([
    { id: 1, name: 'Zoe', age: 31 },
    { id: 2, name: 'Adam', age: 45 },
  ]);
}

describe('@mk-kit/ui/testing harnesses', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let loader: MkHarnessLoader;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = MkHarnessLoader.fromFixture(fixture);
    await loader.settle();
  });

  afterEach(() => {
    document.querySelectorAll('.mk-overlay-container, mk-toast-container, [popover]').forEach((n) => n.remove());
  });

  describe('loader', () => {
    it('finds harnesses by type, selector and text, in document order', async () => {
      const all = await loader.getAll(MkButtonHarness);
      expect(all.map((b) => b.text())).toEqual(['Delete', 'Saving', 'Docs', 'Actions'].slice(0, 3));
      expect((await loader.get(MkButtonHarness, { selector: '.secondary' })).text()).toBe('Saving');
      expect((await loader.get(MkButtonHarness, { text: /doc/i })).text()).toBe('Docs');
      expect(await loader.has(MkButtonHarness, { text: 'Nope' })).toBe(false);
      expect(await loader.getOrNull(MkButtonHarness, { text: 'Nope' })).toBeNull();
      await expect(loader.get(MkButtonHarness, { text: 'Nope' })).rejects.toThrow(/No MkButtonHarness/);
    });
  });

  describe('MkButtonHarness', () => {
    it('reads tone/variant/loading/disabled and clicks', async () => {
      const del = await loader.get(MkButtonHarness, { text: 'Delete' });
      expect(del.tone()).toBe('danger');
      expect(del.variant()).toBe('outline');
      expect(del.size()).toBe('md');
      expect(del.isDisabled()).toBe(false);
      await del.click();
      expect(host.clicks()).toBe(1);

      const saving = await loader.get(MkButtonHarness, { text: 'Saving' });
      expect(saving.isLoading()).toBe(true);
      expect(saving.isDisabled()).toBe(true);
      const docs = await loader.get(MkButtonHarness, { text: 'Docs' });
      expect(docs.isDisabled()).toBe(true);
    });
  });

  describe('MkFormFieldHarness + MkInputHarness', () => {
    it('reads label/hint/required and drives the control', async () => {
      const field = await loader.get(MkFormFieldHarness);
      expect(field.label()).toBe('Name');
      expect(field.hint()).toBe('Your full name');
      expect(field.isRequired()).toBe(true);
      expect(field.hasError()).toBe(false);

      const input = await field.control(MkInputHarness);
      expect(input.placeholder()).toBe('Jane');
      expect(input.value()).toBe('');
      await input.type('Jo');
      expect(host.name()).toBe('Jo');
      await input.setValue('Jane Doe');
      expect(host.name()).toBe('Jane Doe');
      expect(input.value()).toBe('Jane Doe');
      await input.clear();
      expect(host.name()).toBe('');
      await input.focus();
      expect(input.isFocused()).toBe(true);
      await input.blur();
      expect(input.isFocused()).toBe(false);
    });
  });

  describe('MkCheckboxHarness / MkSwitchHarness', () => {
    it('toggles through the native input and the switch button', async () => {
      const cb = await loader.get(MkCheckboxHarness);
      expect(cb.label()).toBe('I agree');
      expect(cb.isChecked()).toBe(false);
      await cb.check();
      expect(cb.isChecked()).toBe(true);
      expect(host.agree()).toBe(true);
      await cb.check(); // no-op
      expect(host.agree()).toBe(true);
      await cb.uncheck();
      expect(host.agree()).toBe(false);

      const sw = await loader.get(MkSwitchHarness);
      expect(sw.label()).toBe('Dark mode');
      expect(sw.isChecked()).toBe(true);
      await sw.toggle();
      expect(sw.isChecked()).toBe(false);
      expect(host.dark()).toBe(false);
    });
  });

  describe('MkRadioGroupHarness', () => {
    it('lists radios, reads the checked one and selects by label/index', async () => {
      const group = await loader.get(MkRadioGroupHarness);
      expect(await group.labels()).toEqual(['Small', 'Medium', 'Large']);
      expect(await group.checkedLabel()).toBe('Medium');
      await group.select('Small');
      expect(host.size()).toBe('s');
      expect(await group.checkedIndex()).toBe(0);
      await group.select(2); // disabled → unchanged
      expect(host.size()).toBe('s');
      await expect(group.select('Huge')).rejects.toThrow(/No radio matching/);
    });
  });

  describe('MkSelectHarness', () => {
    it('opens the teleported listbox, lists options and selects one', async () => {
      const select = await loader.get(MkSelectHarness);
      expect(select.placeholder()).toBe('Pick a role');
      expect(select.valueText()).toBe('');
      expect(select.isOpen()).toBe(false);
      expect(await select.options()).toEqual([
        { label: 'Admin', selected: false, disabled: false },
        { label: 'Editor', selected: false, disabled: false },
        { label: 'Viewer', selected: false, disabled: true },
      ]);
      expect(select.isOpen()).toBe(true);
      await select.selectOption('Editor');
      expect(host.role()).toBe('editor');
      expect(select.valueText()).toBe('Editor');
      expect(select.isOpen()).toBe(false);
      await select.selectOption(0);
      expect(host.role()).toBe('admin');
      await select.open();
      await select.close();
      expect(select.isOpen()).toBe(false);
    });
  });

  describe('MkTabsHarness', () => {
    it('reads labels/selection and switches tabs', async () => {
      const tabs = await loader.get(MkTabsHarness);
      expect(tabs.labels()).toEqual(['First', 'Second', 'Off']);
      expect(tabs.selectedLabel()).toBe('First');
      expect(tabs.selectedPanelText()).toBe('One');
      await tabs.select('Second');
      expect(tabs.selectedIndex()).toBe(1);
      expect(tabs.selectedPanelText()).toBe('Two');
      expect(tabs.isDisabled('Off')).toBe(true);
      await tabs.select(2);
      expect(tabs.selectedIndex()).toBe(1);
    });
  });

  describe('MkMenuHarness', () => {
    it('opens the menu, lists items and clicks one', async () => {
      const menu = await loader.get(MkMenuHarness);
      expect(menu.isOpen()).toBe(false);
      expect(await menu.items()).toEqual(['Edit', 'Archive', 'Delete']);
      expect(menu.isOpen()).toBe(true);
      expect(await menu.isItemDisabled('Archive')).toBe(true);
      await menu.clickItem(/dele/i);
      expect(host.picked()).toBe('Delete');
      expect(menu.isOpen()).toBe(false);
      await menu.open();
      await menu.close();
      expect(menu.isOpen()).toBe(false);
    });
  });

  describe('MkTableHarness', () => {
    it('reads headers/cells, sorts and selects rows', async () => {
      const table = await loader.get(MkTableHarness);
      expect(table.headers()).toEqual(['Name', 'Age']);
      expect(await table.rowCount()).toBe(2);
      expect(await table.cellTexts()).toEqual([
        ['Zoe', '31'],
        ['Adam', '45'],
      ]);
      expect(table.sortDirection('Name')).toBe('none');
      await table.sortBy('Name');
      expect(table.sortDirection('Name')).toBe('ascending');
      expect(await table.cellTexts()).toEqual([
        ['Adam', '45'],
        ['Zoe', '31'],
      ]);
      expect(host.sorted()).toEqual({ key: 'name', direction: 'asc' });

      const rows = await table.rows();
      await rows[0].toggleSelected();
      expect((await table.rows())[0].isSelected()).toBe(true);
      expect(await table.selectedRowCount()).toBe(1);
      await table.toggleAll();
      expect(await table.selectedRowCount()).toBe(2);
      await table.toggleAll();
      expect(await table.selectedRowCount()).toBe(0);
      expect(table.isEmpty()).toBe(false);
    });
  });

  describe('MkDialogHarness (document loader)', () => {
    it('finds confirm dialogs in document.body and resolves them', async () => {
      const dialogs = TestBed.inject(MkDialogService);
      const result = dialogs.confirm({ title: 'Delete?', message: 'This cannot be undone.', confirmText: 'Yes, delete' });
      const dialog = await loader.document().get(MkDialogHarness);
      expect(dialog.title()).toBe('Delete?');
      expect(dialog.bodyText()).toContain('This cannot be undone.');
      expect(dialog.buttons()).toContain('Yes, delete');
      await dialog.clickButton('Yes, delete');
      await expect(result).resolves.toBe(true);
      expect(await loader.document().has(MkDialogHarness)).toBe(false);

      const second = dialogs.prompt({ title: 'Rename', message: 'New name', confirmText: 'Save' });
      const prompt = await loader.document().get(MkDialogHarness);
      await prompt.input()!.setValue('Report 2');
      await prompt.clickButton('Save');
      await expect(second).resolves.toBe('Report 2');
    });
  });

  describe('MkToastHarness (document loader)', () => {
    it('reads toasts shown by MkToastService and dismisses them', async () => {
      const toasts = TestBed.inject(MkToastService);
      toasts.success('Saved', { title: 'Done', dismissible: true, duration: 0 });
      const toast = await loader.document().get(MkToastHarness);
      expect(toast.title()).toBe('Done');
      expect(toast.message()).toBe('Saved');
      expect(toast.tone()).toBe('success');
      await toast.dismiss();
      expect(await loader.document().has(MkToastHarness)).toBe(false);
    });
  });
});
