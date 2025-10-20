import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DashboardCardComponent } from '../dashboard/dashboard-card/dashboard-card.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardCardComponent],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent {}
