import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { IPagination } from "../model/pagination.model";

@Component({
  standalone: false,
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent {

  @Input() pages: IPagination | undefined;
  @Input() callbackFunction: ((args: any) => void) | undefined;

  constructor() {
  }

  counter(length: number): Array<any> {
    if (length >= 0) {
      return new Array(length);
    }
    return [];
  }

  changePg(page: number) {
    this.callbackFunction != undefined && this.callbackFunction(page);
  }
}
