import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

interface MenuItem {
  href: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  readonly menuItems: MenuItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/search', label: 'Assisted search', icon: 'search' },
    { href: '/saved', label: 'Saved', icon: 'bookmark' },
    { href: '/graph', label: 'Graph', icon: 'graph' },
  ];

  constructor(private readonly router: Router) {}

  isActive(path: string): boolean {
    return this.router.isActive(path, {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }
}
