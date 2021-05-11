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

export enum Permission {
  Any = 0,
  All = ~0,

  TaskCreate = 1 << 0,
  TaskEdit = 1 << 1,
  TaskDelete = 1 << 2,
  TaskRate = 1 << 3,

  VersionCreate = 1 << 4,
  VersionEdit = 1 << 5,
  VersionDelete = 1 << 6,

  RoadmapEdit = 1 << 7,
  RoadmapDelete = 1 << 8,
  RoadmapInviteUser = 1 << 9,
  RoadmapReadUsers = 1 << 10,
}

export enum RoleType {
  Admin = Permission.All,
  Developer = Permission.TaskRate | Permission.TaskCreate,
  Customer = Permission.TaskRate,
  Business = RoleType.Customer,
}

export interface RoleObject {
  roles: string[];
  permissions: string[];
}
