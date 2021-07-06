import { Customer, PlannerCustomerWeight, Task } from '../redux/roadmaps/types';
import { unratedTasksAmount } from './TaskUtils';
import { customerWeight } from './CustomerUtils';

import {
  SortingOrders,
  SortComparison,
  sorted,
  sortKeyLocale,
  sortKeyNumeric,
} from './SortUtils';

export { SortingOrders } from './SortUtils';

export enum CustomerSortingTypes {
  NO_SORT,
  SORT_NAME,
  SORT_EMAIL,
  SORT_VALUE,
  SORT_COLOR,
  SORT_UNRATED,
}

const customerCompare = (
  sortingType: CustomerSortingTypes,
  tasks: Task[],
  plannedWeights?: PlannerCustomerWeight[],
): SortComparison<Customer> | undefined => {
  switch (sortingType) {
    case CustomerSortingTypes.SORT_NAME:
      return sortKeyLocale(({ name }) => name);
    case CustomerSortingTypes.SORT_EMAIL:
      return sortKeyLocale(({ email }) => email);
    case CustomerSortingTypes.SORT_VALUE:
      return sortKeyNumeric((customer) =>
        customerWeight(customer, plannedWeights),
      );
    case CustomerSortingTypes.SORT_COLOR:
      return sortKeyLocale(({ color }) => color || '');
    case CustomerSortingTypes.SORT_UNRATED:
      return sortKeyNumeric((customer) => unratedTasksAmount(customer, tasks));
    default:
      // SortingTypes.NO_SORT
      break;
  }
};

export const sortCustomers = (
  customers: Customer[],
  type: CustomerSortingTypes,
  order: SortingOrders,
  tasks: Task[],
  plannedWeights?: PlannerCustomerWeight[],
) => sorted(customers, customerCompare(type, tasks, plannedWeights), order);
