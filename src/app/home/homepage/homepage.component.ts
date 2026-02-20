import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';

declare var lucide: any;

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit, AfterViewInit, OnDestroy {
  isMobileMenuOpen = false;
  private revealObserver?: IntersectionObserver;
  private scrollListener?: () => void;

  ngOnInit(): void {
    // Initialize scroll listener
    this.scrollListener = () => this.updateNav();
    window.addEventListener('scroll', this.scrollListener);
    this.updateNav();
  }

  ngAfterViewInit(): void {
    // Initialize Lucide Icons - use multiple attempts to ensure it loads
    this.initializeIcons();
    
    // Setup Intersection Observer for Reveal Effects
    this.setupRevealObserver();
  }

  private initializeIcons(): void {
    // Try multiple times to ensure Lucide loads
    const tryInit = () => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      } else {
        setTimeout(tryInit, 100);
      }
    };
    tryInit();
    
    // Also try after a delay
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    // Cleanup
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
    if (this.revealObserver) {
      this.revealObserver.disconnect();
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : '';
    
    // Reinitialize icons after toggle
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 100);
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
    
    // Reinitialize icons
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 100);
    }
  }

  private updateNav(): void {
    const navbar = document.getElementById('navbar');
    const logoIcon = document.getElementById('logo-icon');
    const logoText = document.getElementById('logo-text');
    const menuToggle = document.getElementById('menu-toggle');
      const signupBtn = document.getElementById('signup-btn');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!navbar || !logoIcon || !logoText || !menuToggle || !signupBtn) {
      return;
    }

    if (window.scrollY > 40) {
      navbar.classList.add('bg-zinc-100/90', 'backdrop-blur-2xl', 'shadow-2xl', 'border-b', 'border-zinc-200', 'py-4');
      navbar.classList.remove('py-6');
      logoIcon.classList.add('bg-zinc-950', 'text-white');
      logoIcon.classList.remove('bg-white/10');
      logoText.classList.add('text-zinc-950');
      logoText.classList.remove('text-white');
      menuToggle.classList.add('text-zinc-950');
      menuToggle.classList.remove('text-white');
      signupBtn.classList.add('bg-zinc-950', 'text-white');
      signupBtn.classList.remove('bg-white', 'text-zinc-900');
      navLinks.forEach((l: Element) => {
        l.classList.add('text-zinc-500');
        l.classList.remove('text-zinc-400');
      });
    } else {
      navbar.classList.remove('bg-zinc-100/90', 'backdrop-blur-2xl', 'shadow-2xl', 'border-b', 'border-zinc-200', 'py-4');
      navbar.classList.add('py-6');
      logoIcon.classList.remove('bg-zinc-950');
      logoIcon.classList.add('bg-white/10');
      logoText.classList.remove('text-zinc-950');
      logoText.classList.add('text-white');
      menuToggle.classList.remove('text-zinc-950');
      menuToggle.classList.add('text-white');
      signupBtn.classList.remove('bg-zinc-950', 'text-white');
      signupBtn.classList.add('bg-white', 'text-zinc-900');
      navLinks.forEach((l: Element) => {
        l.classList.remove('text-zinc-500');
        l.classList.add('text-zinc-400');
      });
    }
  }

  private setupRevealObserver(): void {
    // Make all reveal elements visible immediately
    setTimeout(() => {
      const componentElement = document.querySelector('app-homepage');
      if (componentElement) {
        componentElement.querySelectorAll('.reveal').forEach((el) => {
          el.classList.add('active');
        });
      }
      
      // Optional: Set up observer for future scroll animations if needed
      this.revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('active');
              this.revealObserver?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
    }, 50);
  }
}
