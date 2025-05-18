import { NgModule } from '@angular/core';
import { DialogComponent } from "./dialog/dialog.component";
import { NgxTranslateModule } from "../translate/translate.module";
import { ToastComponent } from "./toast/toast.component";
import { PaginationComponent } from "./pagination/pagination.component";
import { SortComponent } from "./sort/sort.component";
import { StatusIconComponent } from "./status-icon/status-icon.component";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { BrowserModule } from "@angular/platform-browser";
import { ImageUploadComponent } from "./image-upload/image-upload.component";

@NgModule({
    imports: [
        BrowserModule,
        NgxTranslateModule,
        NgbModule,
    ],
    declarations: [
        ImageUploadComponent,
        DialogComponent,
        ToastComponent,
        PaginationComponent,
        SortComponent,
        StatusIconComponent,
    ],
    providers: [],
    exports: [
        ImageUploadComponent,
        DialogComponent,
        ToastComponent,
        PaginationComponent,
        SortComponent,
        StatusIconComponent,
    ]
})
export class SharedModule { }