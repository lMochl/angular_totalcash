import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit{
  loginData = {
    email: '',
    password: ''
  };

  constructor(private authService: AuthService, private router: Router, private toastr: ToastrService) {}

  onLogin(loginForm: NgForm): void {

    if (loginForm.invalid) {
      this.toastr.error('Por favor, rellena todos los campos', 'Error');
      return;
    }
    
    this.authService.login(loginForm.value).subscribe(
      response => {
        this.toastr.success('Inicio de sesión exitoso');
        this.router.navigate(['/dashboard']);
      },
      error => {
        this.toastr.error('Inicio de sesión fallido', 'Error');
      }
    );
  }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(['/dashboard']);
    }
  }
  
}
