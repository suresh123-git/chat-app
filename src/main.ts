import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthInterceptor } from './app/services/auth.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([
      { path: '', redirectTo: '/login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./app/components/login/login.component').then(m => m.LoginComponent) },
      { path: 'chat', loadComponent: () => import('./app/components/chat/chat.component').then(m => m.ChatComponent) }
    ]),
    provideHttpClient(withInterceptors([AuthInterceptor])),
    provideAnimations()
  ]
}).catch(err => console.error(err));
