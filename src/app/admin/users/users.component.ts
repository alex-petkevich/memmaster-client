import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { AuthService } from "../../_services/auth.service";
import { DialogComponent } from "../../shared-components/dialog/dialog.component";
import { NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { finalize } from "rxjs";
import { UsersService } from "../../_services/users.service";
import { IPaginatedUsers } from "../../model/user.model";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { ToastComponent } from "../../shared-components/toast/toast.component";
import { PaginationComponent } from "../../shared-components/pagination/pagination.component";
import { FormControl } from "@angular/forms";

@Component({
    standalone: false,
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
    users?: IPaginatedUsers;
    loadProgress: boolean = false;
    sort: string = "createdAt";
    sortOrder: string = "desc";
    isFilterOpen: boolean = false;
    factive: FormControl = new FormControl(false);
    femail: FormControl = new FormControl('');
    fname: FormControl = new FormControl('');
    fusername: FormControl = new FormControl('');
    frole: FormControl = new FormControl('');

    @ViewChild("dialog") dialogComponent: DialogComponent | undefined;
    @ViewChild("toast") toastComponent: ToastComponent | undefined;
    @ViewChild("pagination") paginationComponent: PaginationComponent | undefined;

    constructor(private usersService: UsersService,
                private translate: TranslateService,
                private auth: AuthService,
                private router: Router,
                private location: Location,
                private activatedRoute: ActivatedRoute) {
    }

    async ngOnInit(): Promise<void> {
        await this.auth.isLoggedIn();

        this.activatedRoute.queryParams.subscribe(params => {
            this.loadUsers(params['page']);
        });
    }

    private loadUsers(pg : number = 0) {
        this.loadProgress = true;
        this.usersService.list(this.fname.value, this.fusername.value, this.femail.value, this.frole.value, this.factive.value, pg, this.sort, this.sortOrder)
            .pipe(
                finalize(() => {
                    this.loadProgress = false;
                })
            )
            .subscribe({
                next: data => {
                    this.users = data;
                }
            });
    }

    confirmDelete(id: any) {
        this.translate.get('users.delete-confirm').subscribe({
            next: data => {
                var modal = this.dialogComponent?.open(data);
                (modal as NgbModalRef).result.then((result) => {
                    this.usersService.delete(id).subscribe({
                        next: data => {
                            this.loadUsers();
                        }
                    });
                });
            }
        });
    }

    pageCallback = (args: any): void => {
        const url = this.router.createUrlTree([], {relativeTo: this.activatedRoute, queryParams: {page: args}}).toString()
        this.location.go(url);
        this.loadUsers(args);
    }

    private showInternalError(err: any) {
        this.toastComponent?.error( err );
    }

    reorderCallback = (args: any): void => {
        this.sort = args[0];
        this.sortOrder = args[1];

        this.loadUsers();
    }

    displayFilter() {
        return false;
    }

    applyFilters() {
        this.isFilterOpen = true;
        this.loadUsers();
        return false;
    }

    resetFilters() {
        this.isFilterOpen = true;
        this.factive.setValue(false);
        this.fname.setValue("");
        this.fusername.setValue("");
        this.femail.setValue("");
        this.frole.setValue("");
        this.loadUsers();
        return false;
    }

    activeUser(id: number | undefined) {
        if (!id) {
            return;
        }
        this.usersService.activateUser(id).subscribe({
            next: (user) => {
                this.users?.content.forEach((usr, idx) => {
                    if (usr.id == user.id) {
                        this.users!.content[idx] = user;
                    }
                })
            }
        })
    }
}
