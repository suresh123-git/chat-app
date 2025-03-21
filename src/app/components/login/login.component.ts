import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>{{ isLogin ? 'Login' : 'Register' }}</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="authForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" placeholder="Enter username">
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" placeholder="Enter email">
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" placeholder="Enter password">
            </mat-form-field>
            
            <button mat-raised-button color="primary" type="submit" [disabled]="!authForm.valid" class="full-width">
              {{ isLogin ? 'Login' : 'Register' }}
            </button>
          </form>
          
          <p class="toggle-form">
            {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
            <a mat-button color="primary" (click)="toggleForm($event)">{{ isLogin ? 'Register' : 'Login' }}</a>
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f5f5;
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
    }

    mat-card-header {
      justify-content: center;
      margin-bottom: 20px;
    }

    mat-card-title {
      font-size: 24px;
      color: #333;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .toggle-form {
      text-align: center;
      margin-top: 16px;
      color: #666;
    }

    :host-context(.dark-theme) {
      .login-container {
        background: #121212;
      }

      mat-card {
        background: #1e1e1e;
      }

      mat-card-title {
        color: #fff;
      }

      .toggle-form {
        color: #bbb;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  authForm: FormGroup;
  isLogin: boolean = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.authForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/chat']);
    }
  }

  toggleForm(event: Event) {
    event.preventDefault();
    this.isLogin = !this.isLogin;
    this.authForm.reset();
  }

  onSubmit() {
    if (this.authForm.valid) {
      const { username, email, password } = this.authForm.value;
      
      if (this.isLogin) {
        this.authService.login(username, password).subscribe({
          next: () => {
            this.router.navigate(['/chat']);
          },
          error: (error) => {
            console.error('Login error:', error);
            this.snackBar.open(
              error.error?.message || error.message || 'Login failed. Please check your credentials.',
              'Close',
              { duration: 5000 }
            );
          }
        });
      } else {
        this.authService.register(username, email, password).subscribe({
          next: () => {
            this.snackBar.open('Registration successful! Please login.', 'Close', {
              duration: 3000
            });
            this.isLogin = true;
            this.authForm.reset();
          },
          error: (error) => {
            console.error('Registration error:', error);
            this.snackBar.open(
              error.error?.message || error.message || 'Registration failed. Please try again.',
              'Close',
              { duration: 5000 }
            );
          }
        });
      }
    }
  }
} 