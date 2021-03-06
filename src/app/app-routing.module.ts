import { NgModule } from '@angular/core';
import { Routes, RouterModule, ExtraOptions } from '@angular/router';
import { HomePage } from './core/home/home';
import { RegisterConfirmPage } from './core/register/confirm/confirm';
import { AccountPage } from './core/account/account';
import { AuthGuardService } from './core/core.module';
import { UsersPage } from './admin/users/list/users';
import { VesselsPage } from './referential/vessel/list/vessels';
import { VesselPage } from './referential/vessel/page/page-vessel';
import { ReferentialsPage } from './referential/list/referentials';
import { TripsPage, TripPage } from './trip/trip.module';

import { environment } from '../environments/environment';
import { OperationPage } from './trip/operation/operation.page';

const routeOptions: ExtraOptions = {
  enableTracing: false,
  //enableTracing: !environment.production,
  useHash: false
};

const routes: Routes = [
  // Core path
  {
    path: '',
    component: HomePage
  },

  {
    path: 'home/:action',
    component: HomePage
  },
  {
    path: 'confirm/:email/:code',
    component: RegisterConfirmPage
  },
  {
    path: 'account',
    component: AccountPage,
    canActivate: [AuthGuardService]
  },

  // Admin
  {
    path: 'admin/users',
    component: UsersPage,
    canActivate: [AuthGuardService],
    data: {
      profile: 'ADMIN'
    }
  },

  // Referential path
  {
    path: 'referential',
    canActivate: [AuthGuardService],
    children: [
      {
        path: 'vessels',
        children: [
          {
            path: '',
            component: VesselsPage,
            data: {
              profile: 'USER'
            }
          },
          {
            path: ':id',
            component: VesselPage,
            data: {
              profile: 'USER'
            }
          }
        ]
      },
      {
        path: 'list',
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: '/referential/list/Location',
            data: {
              profile: 'ADMIN'
            }
          },
          {
            path: ':entityName',
            component: ReferentialsPage,
            data: {
              profile: 'ADMIN'
            }
          }
        ]
      }
    ]
  },

  // Trip path
  {
    path: 'trips',
    canActivate: [AuthGuardService],
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: TripsPage,
        data: {
          profile: 'USER'
        }
      },
      {
        path: ':tripId',
        component: TripPage,
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        data: {
          profile: 'USER'
        }
      }
    ]
  },

  {
    path: 'operations',
    canActivate: [AuthGuardService],
    children: [
      {
        path: ':tripId/:opeId',
        component: OperationPage,
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        data: {
          profile: 'USER'
        }
      }
    ]
  },

  {
    path: "**",
    redirectTo: '/'
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, routeOptions)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
