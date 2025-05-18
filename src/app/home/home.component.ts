import { Component, OnInit } from '@angular/core';
import {UserService} from "../_services/user.service";
import {TokenStorageService} from "../_services/token-storage.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  content?: string;
  isLoggedIn: boolean = false;

  constructor(private userService: UserService, private tokenStorageService: TokenStorageService) { }
  ngOnInit(): void {
     this.isLoggedIn = !!this.tokenStorageService.getToken();
  }

}
