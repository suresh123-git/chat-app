import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from './services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="app-container" [class.dark-theme]="isDarkMode">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background-color: #f5f5f5;
      transition: background-color 0.3s ease;
    }
    .dark-theme {
      background-color: #1a1a1a;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  private themeSubscription: Subscription;

  constructor(private themeService: ThemeService) {
    this.themeSubscription = this.themeService.isDarkMode$.subscribe(
      (isDark: boolean) => this.isDarkMode = isDark
    );
  }

  ngOnInit() {
    // Initialize any app-wide logic here
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }
}
