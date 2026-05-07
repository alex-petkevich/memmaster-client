import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ContactService } from '../_services/contact.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule]
})
export class ContactComponent implements OnInit {

  questionTypes = ['General', 'Technic'];
  form: any = {
    questionType: '',
    subject: '',
    comment: ''
  };
  isSuccessful = false;
  isSendFailed = false;
  errorMessage = '';
  isSubmitted = false;

  constructor(private contactService: ContactService) {}

  ngOnInit(): void {}

  onSubmit(): void {
    this.isSubmitted = true;
    if (!this.form.questionType || !this.form.subject || !this.form.comment) {
      return;
    }

    this.contactService.send(this.form).subscribe({
      next: () => {
        this.isSuccessful = true;
        this.isSendFailed = false;
      },
      error: err => {
        this.errorMessage = err.error?.message || 'An error occurred';
        this.isSendFailed = true;
      }
    });
  }
}

