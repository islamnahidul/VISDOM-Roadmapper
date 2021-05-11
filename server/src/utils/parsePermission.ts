import { Permission, RoleType, RoleObject } from '../types/customTypes';

const popcount = (n: number) => n.toString(2).replace(/0/g, '').length;

const enumEntries = (e: any) =>
  (Object.entries(e).filter(([key, _]) => isNaN(Number(key))) as [
    string,
    number,
  ][]).sort(([_a, a], [_b, b]) => popcount(b) - popcount(a));

const roles = enumEntries(RoleType);
const permissions = enumEntries(Permission).filter(
  ([_, value]) => value !== Permission.All,
);

export const roleToObject = (role: number): RoleObject => {
  const toNames = (role: number, entries: [string, number][]) => {
    const names: string[] = [];
    entries.forEach(([name, value]) => {
      if (value && (role & value) === value) {
        names.push(name);
        role &= ~value;
      }
    });
    return names;
  };
  return {
    roles: toNames(role, roles),
    permissions: toNames(role, permissions),
  };
};

export const parseRole = (obj: RoleObject) => {
  const parse = (names: string[], from: any) =>
    names.reduce((role, name) => role | (from[name] || 0), 0);
  return parse(obj.roles, RoleType) | parse(obj.permissions, Permission);
};
