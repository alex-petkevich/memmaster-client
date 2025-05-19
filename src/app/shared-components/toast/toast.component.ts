import { Component, TemplateRef, ViewChild } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
    standalone: false,
    selector: 'app-toast',
    templateUrl: './toast.component.html',
    styleUrls: ['./toast.component.scss']
})
export class ToastComponent {

    textRequest: String = '';
    closeResult: String = '';
    @ViewChild("content", { static: true }) content: TemplateRef<any> | undefined;

    constructor(private modalService: NgbModal) {
    }

    toasts: any[] = [];

    show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
        this.toasts.push({ textOrTpl, ...options });
    }

    success(textOrTpl: string | TemplateRef<any>, header: string = '') {
        this.show(textOrTpl,{ classname: 'bg-success text-light', delay: 5000, header: header });
    }

    error(textOrTpl: string | TemplateRef<any>, header: string = '') {
        this.show(textOrTpl, { classname: 'bg-danger text-light', delay: 5000, header: header })
    }

    remove(toast: any) {
        this.toasts = this.toasts.filter((t) => t !== toast);
    }

    clear() {
        this.toasts.splice(0, this.toasts.length);
    }

    isTemplate(toast: any) {
        return toast.textOrTpl instanceof TemplateRef;
    }
}