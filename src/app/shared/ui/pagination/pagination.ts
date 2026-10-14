import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  @Input({ required: true }) totalItems = 0;
  @Input({ required: true }) currentPage = 1;
  @Input({ required: true }) pageSize = 10;
  @Input() itemLabel = 'elementos';
  @Input() navigationLabel = 'Paginación';
  @Input() embedded = false;

  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / Math.max(1, this.pageSize)));
  }

  get effectiveCurrentPage(): number {
    return Math.max(1, Math.min(this.currentPage, this.totalPages));
  }

  get firstVisibleItem(): number {
    return this.totalItems === 0
      ? 0
      : (this.effectiveCurrentPage - 1) * this.pageSize + 1;
  }

  get lastVisibleItem(): number {
    return Math.min(
      this.firstVisibleItem + this.pageSize - 1,
      this.totalItems,
    );
  }

  get pageNumbers(): number[] {
    const totalPages = this.totalPages;
    const currentPage = this.effectiveCurrentPage;

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([1, totalPages]);
    for (
      let page = Math.max(2, currentPage - 1);
      page <= Math.min(totalPages - 1, currentPage + 1);
      page++
    ) {
      pages.add(page);
    }

    if (currentPage <= 3) {
      pages.add(2);
      pages.add(3);
    } else if (currentPage >= totalPages - 2) {
      pages.add(totalPages - 1);
      pages.add(totalPages - 2);
    }

    return Array.from(pages).sort((first, second) => first - second);
  }

  goToPage(page: number): void {
    this.pageChange.emit(Math.max(1, Math.min(page, this.totalPages)));
  }

  updatePageSize(event: Event): void {
    this.pageSizeChange.emit(Number((event.target as HTMLSelectElement).value));
  }
}
