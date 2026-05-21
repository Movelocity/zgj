import { accountModule } from './account';
import { homeModule } from './home';
import { interviewReviewModule } from './interviewReview';
import { jobMatchingModule } from './jobMatching';
import { opportunitiesModule } from './opportunities';
import { resumeOptimizationModule } from './resumeOptimization';
import { resumeWorkspaceModule } from './resumeWorkspace';
import { systemModule } from './system';
import type { FrontendModule } from './types';

export type {
  FrontendModule,
  ModuleNavItem,
  ModuleRoute,
  ModuleRouteAccess,
  ModuleRouteLayout,
} from './types';

export const APP_MODULES: FrontendModule[] = [
  homeModule,
  resumeOptimizationModule,
  jobMatchingModule,
  opportunitiesModule,
  resumeWorkspaceModule,
  interviewReviewModule,
  accountModule,
  systemModule,
];

export const APP_ROUTES = APP_MODULES
  .flatMap((module) => module.routes)
  .filter((route) => route.layout !== 'standalone');

export const STANDALONE_ROUTES = APP_MODULES
  .flatMap((module) => module.routes)
  .filter((route) => route.layout === 'standalone');

export const APP_NAV_ITEMS = APP_MODULES
  .flatMap((module) => (module.nav ? [module.nav] : []))
  .sort((a, b) => a.order - b.order);
