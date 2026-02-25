import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

declare var lucide: any;

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, AfterViewInit {
  sidebarOpen = false;

  constructor(private router: Router) {}

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    if (this.sidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    setTimeout(() => this.initializeIcons(), 50);
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
    document.body.classList.remove('sidebar-open');
  }

  ngOnInit(): void {
    // Initialize component
  }

  ngAfterViewInit(): void {
    // Initialize Lucide Icons
    this.initializeIcons();
    
    // Reinitialize icons when route changes; close sidebar on nav (mobile)
    this.router.events.subscribe(() => {
      this.closeSidebar();
      setTimeout(() => this.initializeIcons(), 100);
    });
  }

  private initializeIcons(): void {
    const tryInit = () => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      } else {
        setTimeout(tryInit, 100);
      }
    };
    tryInit();
    
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }, 500);
  }
}
