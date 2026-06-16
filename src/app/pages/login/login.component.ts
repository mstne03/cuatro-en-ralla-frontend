import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = '';
  isRegistering = false;

  async submitEmail() {
    this.error = '';
    try {
      if (this.isRegistering) {
        await this.auth.registerWithEmail(this.email, this.password).toPromise();
      } else {
        await this.auth.signInWithEmail(this.email, this.password).toPromise();
      }
      this.router.navigate(['/lobby']);
    } catch (e: any) {
      this.error = e.message ?? 'Autenticación fallida';
    }
  }
}
