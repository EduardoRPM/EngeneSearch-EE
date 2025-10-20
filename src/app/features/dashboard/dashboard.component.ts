import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DashboardCardComponent } from './dashboard-card/dashboard-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardCardComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {}
