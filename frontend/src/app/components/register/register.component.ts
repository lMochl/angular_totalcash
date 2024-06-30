import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent{
  registerData = {
    username: '',
    email: '',
    password: ''
  };
  confirmPassword = '';

  constructor(private authService: AuthService, private router: Router, private toastr: ToastrService) {}

  onRegister(registerForm: NgForm): void {
    
    if (registerForm.controls['email'].invalid) {
      this.toastr.warning('Por favor, ingresa un correo válido.', 'Advertencia');
      return;
    }
    
    if (registerForm.invalid) {
      this.toastr.error('Por favor, complete todos los campos del formulario.', 'Error');
      return;
    }

    if (this.registerData.password !== this.confirmPassword) {
      this.toastr.error('Las contraseñas no coinciden', 'Error');
      return;
    }

    this.authService.register(registerForm.value).subscribe(
      response => {
        this.toastr.success('Registro exitoso');
        this.router.navigate(['/login']);
      },
      error => {
        if (error.status === 400) {
          this.toastr.error('El correo ya está siendo utilizado.', 'Error');
        } else {
          this.toastr.error('Ocurrió un error. Inténtalo de nuevo más tarde.', 'Error');
        }
      }
    );
  }
}
