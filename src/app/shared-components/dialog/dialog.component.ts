import {Component, TemplateRef, ViewChild} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

/*
Example of use:
<app-dialog #dialog></app-dialog>
@ViewChild("dialog") dialogComponent: DialogComponent | undefined;
var modal = this.dialogComponent?.open("testtesttest");
    (modal as NgbModalRef).result.then((result) => {
      alert('OK PRESSED');
    }, (reason) => {
      alert(`Dismissed`);
    });
 */

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent {

  textRequest: String = '';
  closeResult: String = '';
  @ViewChild("content", { static: true }) content: TemplateRef<any> | undefined;

  constructor(private modalService: NgbModal) {
  }

  open(text: String, content?: String) {
    this.textRequest = text;
    return this.modalService.open(content ? content : this.content, {ariaLabelledBy: 'modal-basic-title', backdrop: false});
  }
}
