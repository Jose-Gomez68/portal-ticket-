import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pagination } from './pagination';

describe('Pagination', () => {
  let fixture: ComponentFixture<Pagination>;
  let component: Pagination;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagination],
    }).compileComponents();

    fixture = TestBed.createComponent(Pagination);
    component = fixture.componentInstance;
    component.totalItems = 45;
    component.currentPage = 3;
    component.pageSize = 10;
    fixture.detectChanges();
  });

  it('calculates the visible range and page list', () => {
    expect(component.firstVisibleItem).toBe(21);
    expect(component.lastVisibleItem).toBe(30);
    expect(component.totalPages).toBe(5);
    expect(component.pageNumbers).toEqual([1, 2, 3, 4, 5]);
  });

  it('emits a page change constrained to the valid page range', () => {
    const pageChange = vi.fn();
    component.pageChange.subscribe(pageChange);

    component.goToPage(99);

    expect(pageChange).toHaveBeenCalledWith(5);
  });

  it('emits the selected page size', () => {
    const pageSizeChange = vi.fn();
    component.pageSizeChange.subscribe(pageSizeChange);

    component.updatePageSize({
      target: { value: '25' },
    } as unknown as Event);

    expect(pageSizeChange).toHaveBeenCalledWith(25);
  });

  it('offers 100 rows per page', () => {
    const pageSizeSelect: HTMLSelectElement =
      fixture.nativeElement.querySelector('select[aria-label="Filas por página"]');

    expect(Array.from(pageSizeSelect.options).map((option) => Number(option.value))).toEqual([
      5,
      10,
      25,
      50,
      70,
      100,
    ]);
  });

  it('shows an empty range when there are no items', () => {
    component.totalItems = 0;

    expect(component.firstVisibleItem).toBe(0);
    expect(component.lastVisibleItem).toBe(0);
    expect(component.totalPages).toBe(1);
  });
});
