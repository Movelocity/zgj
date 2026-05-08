import type { ReactNode } from 'react';

export type ModuleRouteAccess = 'public' | 'protected' | 'admin';
export type ModuleRouteLayout = 'app' | 'standalone';

export interface ModuleRoute {
  path: string;
  element: ReactNode;
  access?: ModuleRouteAccess;
  layout?: ModuleRouteLayout;
}

export interface ModuleNavItem {
  path: string;
  label: string;
  order: number;
}

export interface FrontendModule {
  id: string;
  name: string;
  description: string;
  ownerHint: string;
  nav?: ModuleNavItem;
  routes: ModuleRoute[];
}
