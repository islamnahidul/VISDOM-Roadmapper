import { Context, Next } from 'koa';

export interface RouteHandlerFnc {
  (ctx: Context, next: Next): Promise<void>;
}

export const enum TaskRatingDimension {
  BusinessValue = 0,
  RequiredWork = 1,
}

export const enum UserType {
  BusinessUser = 0,
  DeveloperUser = 1,
  CustomerUser = 2,
  AdminUser = 3,
  TokenUser = 4,
}

export const enum RoleType {
  Admin,
  Customer,
  Developer,
  Business,
}
