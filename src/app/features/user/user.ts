import { DatePipe } from '@angular/common';
import { computed, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ErrorAlert } from '../../shared/ui/error-alert/error-alert';
import { FeedbackToast } from '../../shared/ui/feedback-toast/feedback-toast';
import { Pagination } from '../../shared/ui/pagination/pagination';
import { USER_ROLES } from './model/user.model';
import type { NewUserModel, UpdateUserModel, UserFormModel, UserModel } from './model/user.model';
import type { AreaModel } from '../area/model/area.model';
import { AreaService } from '../area/service/area.service';
import { UserService } from './service/user.service';

@Component({
  imports: [DatePipe, ErrorAlert, FeedbackToast, FormsModule, Pagination],
  selector: 'app-user',
  styleUrl: './user.css',
  templateUrl: './user.html',
})
export class User implements OnInit {
  private readonly userService = inject(UserService);
  private readonly areaService = inject(AreaService);

  protected readonly users = signal<UserModel[]>([]);
  protected readonly areas = signal<AreaModel[]>([]);
  protected readonly activeAreas = computed(() => this.areas().filter((area) => area.active));
  protected readonly roleOptions = USER_ROLES;
  protected readonly searchTerm = signal('');
  protected readonly selectedStatus = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly isLoading = signal(false);
  protected readonly isModalOpen = signal(false);
  protected readonly editingUserId = signal<number | null>(null);
  protected readonly openActionsMenuUserId = signal<number | null>(null);
  protected readonly userToDelete = signal<UserModel | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly toastMessage = signal<{ title: string; message: string } | null>(null);
  protected readonly totalCount = computed(() => this.users().length);
  protected readonly activeCount = computed(
    () => this.users().filter((user) => user.active === true).length,
  );
  protected readonly inactiveCount = computed(
    () => this.users().filter((user) => user.active !== true).length,
  );
  protected readonly filteredUsers = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const status = this.selectedStatus();

    return this.users().filter((user) => {
      const fullName = `${user.name} ${user.apPaterno} ${user.apMaterno}`.toLocaleLowerCase();
      const matchesQuery =
        !query ||
        fullName.includes(query) ||
        user.userName.toLocaleLowerCase().includes(query) ||
        user.email.toLocaleLowerCase().includes(query);
      const matchesStatus =
        !status || (status === 'active' ? user.active === true : user.active !== true);

      return matchesQuery && matchesStatus;
    });
  });
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredUsers().length / this.pageSize())),
  );
  protected readonly visibleUsers = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const startIndex = (page - 1) * this.pageSize();

    return this.filteredUsers().slice(startIndex, startIndex + this.pageSize());
  });
  protected newUser: UserFormModel = this.createEmptyUser();
  protected passwordConfirmation = '';
  protected passwordMismatch = false;

  ngOnInit(): void {
    this.loadUsers();
    this.loadAreas();
  }

  protected loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
        this.goToPage(this.currentPage());
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar los usuarios. Intenta nuevamente.');
        this.isLoading.set(false);
      },
    });
  }

  private loadAreas(): void {
    this.areaService.getAll().subscribe({
      next: (areas) => this.areas.set(areas),
      error: () => this.errorMessage.set('No se pudieron cargar las áreas. Intenta nuevamente.'),
    });
  }

  protected openCreateModal(): void {
    this.editingUserId.set(null);
    this.newUser = this.createEmptyUser();
    this.passwordConfirmation = '';
    this.passwordMismatch = false;
    this.isModalOpen.set(true);
  }

  protected editUser(user: UserModel): void {
    this.closeActionsMenu();
    this.editingUserId.set(user.userID);
    this.newUser = {
      userName: user.userName,
      name: user.name,
      apPaterno: user.apPaterno,
      apMaterno: user.apMaterno,
      email: user.email,
      password: '',
      active: user.active,
      role: user.role,
      areaID: user.areaID,
    };
    this.passwordConfirmation = '';
    this.passwordMismatch = false;
    this.isModalOpen.set(true);
  }

  protected toggleActionsMenu(userID: number, event: Event): void {
    event.stopPropagation();
    this.openActionsMenuUserId.update((openUserID) =>
      openUserID === userID ? null : userID,
    );
  }

  protected closeActionsMenu(): void {
    this.openActionsMenuUserId.set(null);
  }

  protected openDeleteConfirmation(user: UserModel): void {
    this.closeActionsMenu();
    this.userToDelete.set(user);
  }

  protected closeDeleteConfirmation(): void {
    if (!this.isDeleting()) {
      this.userToDelete.set(null);
    }
  }

  protected deleteUser(): void {
    const user = this.userToDelete();
    if (!user || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.userService.deleteUser(user.userID).subscribe({
      next: () => {
        this.users.update((users) =>
          users.filter((currentUser) => currentUser.userID !== user.userID),
        );
        this.isDeleting.set(false);
        this.userToDelete.set(null);
        this.toastMessage.set({
          title: 'Usuario eliminado',
          message: `La cuenta de ${user.name} ${user.apPaterno} se eliminó correctamente.`,
        });
        this.goToPage(this.currentPage());
      },
      error: (error: unknown) => {
        this.errorMessage.set(
          `No se pudo eliminar el usuario: ${getErrorMessage(error)}`,
        );
        this.isDeleting.set(false);
      },
    });
  }

  protected closeModal(): void {
    if (!this.isSaving()) {
      this.isModalOpen.set(false);
      this.editingUserId.set(null);
      this.passwordMismatch = false;
    }
  }

  protected onRoleChange(role: UserFormModel['role']): void {
    if (role === 'ADMIN') {
      this.newUser.areaID = null;
    }
  }

  protected validatePasswordMatch(): void {
    this.passwordMismatch =
      this.passwordConfirmation.length > 0 &&
      this.newUser.password !== this.passwordConfirmation;
  }

  protected updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  protected updateStatusFilter(event: Event): void {
    this.selectedStatus.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  protected updatePageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
  }

  protected initials(user: UserModel): string {
    return `${user.name.charAt(0)}${user.apPaterno.charAt(0)}`.toLocaleUpperCase();
  }

  protected saveUser(): void {
    const role = this.newUser.role;
    const areaID = role === 'ADMIN' ? null : this.newUser.areaID;
    const fields = {
      userName: this.newUser.userName.trim(),
      name: this.newUser.name.trim(),
      apPaterno: this.newUser.apPaterno.trim(),
      apMaterno: this.newUser.apMaterno.trim(),
      email: this.newUser.email.trim(),
      active: this.newUser.active,
    };
    const editingUserId = this.editingUserId();
    const requiresPassword = editingUserId === null;
    const hasPassword = this.newUser.password.length > 0;

    this.passwordMismatch =
      (requiresPassword || hasPassword) &&
      this.newUser.password !== this.passwordConfirmation;
    if (
      this.isSaving() ||
      !fields.userName ||
      !fields.name ||
      !fields.apPaterno ||
      !fields.apMaterno ||
      !fields.email ||
      !role ||
      (role !== 'ADMIN' && areaID === null) ||
      (requiresPassword && !hasPassword) ||
      this.passwordMismatch
    ) {
      return;
    }

    const userFields = {
      ...fields,
      role,
      areaID,
    };
    this.isSaving.set(true);
    this.errorMessage.set('');
    if (editingUserId !== null) {
      const payload: UpdateUserModel = {
        userID: editingUserId,
        ...userFields,
        ...(hasPassword ? { password: this.newUser.password } : {}),
      };
      this.userService.updateUser(payload).subscribe({
        next: (user) => {
          this.users.update((users) =>
            users.map((currentUser) => currentUser.userID === user.userID ? user : currentUser),
          );
          this.isSaving.set(false);
          this.closeModal();
          this.toastMessage.set({
            title: 'Usuario actualizado',
            message: `La cuenta de ${user.name} ${user.apPaterno} se actualizó correctamente.`,
          });
        },
        error: (error: unknown) => {
          this.errorMessage.set(`No se pudo actualizar el usuario: ${getErrorMessage(error)}`);
          this.isSaving.set(false);
        },
      });
      return;
    }
    const payload: NewUserModel = {
      ...userFields,
      password: this.newUser.password,
    };
    this.userService.createUser(payload).subscribe({
      next: (user) => {
        this.users.update((users) => [user, ...users]);
        this.isSaving.set(false);
        this.isModalOpen.set(false);
        this.currentPage.set(1);
        this.toastMessage.set({
          title: 'Usuario creado',
          message: `La cuenta de ${user.name} ${user.apPaterno} se creó correctamente.`,
        });
      },
      error: (error: unknown) => {
        this.errorMessage.set(
          `No se pudo crear el usuario: ${getErrorMessage(error)}`,
        );
        this.isSaving.set(false);
      },
    });
  }

  protected dismissToast(): void {
    this.toastMessage.set(null);
  }

  private createEmptyUser(): UserFormModel {
    return {
      userName: '',
      name: '',
      apPaterno: '',
      apMaterno: '',
      email: '',
      password: '',
      active: true,
      role: '',
      areaID: null,
    };
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : 'Intenta nuevamente.';
}
