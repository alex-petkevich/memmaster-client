import {Component, Input} from "@angular/core";
import {IPagination} from "../model/pagination.model";

@Component({
  standalone: false,
  selector: 'app-sort',
  templateUrl: './sort.component.html',
  styleUrls: ['./sort.component.scss']
})
export class SortComponent {

  @Input() sort: string = 'received';
  @Input() curentSort: string = '';
  @Input() sortOrder: string = 'desc';
  @Input() callbackFunction: ((args: any) => void) | undefined;

  reorder(sort: string, sortOrder: string) {

    if (sort == this.curentSort && sortOrder == '') {
      sort = '';
    } else {
      sortOrder = sort != this.curentSort ? 'desc' : sortOrder !== 'desc' ? 'desc' : '';
    }

    this.callbackFunction != undefined && this.callbackFunction([sort, sortOrder] );

    return false;
  }
}
