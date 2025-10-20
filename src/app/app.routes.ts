import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { MainLayoutComponent } from './features/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SearchComponent } from './features/search/search.component';
import { SavedComponent } from './features/saved/saved.component';
import { GraphComponent } from './features/graph/graph.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AdminDashboardComponent } from './features/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'search', component: SearchComponent },
      { path: 'saved', component: SavedComponent },
      { path: 'graph', component: GraphComponent },
      { path: 'admin', component: AdminDashboardComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
