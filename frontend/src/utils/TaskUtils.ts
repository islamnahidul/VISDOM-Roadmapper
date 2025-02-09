import { DraggableLocation } from 'react-beautiful-dnd';
import { Customer, Roadmap, Task, Taskrating } from '../redux/roadmaps/types';
import { customerWeight } from './CustomerUtils';
import { UserInfo } from '../redux/user/types';
import {
  RoleType,
  TaskRatingDimension,
} from '../../../shared/types/customTypes';
import {
  SortingOrders,
  sorted,
  sortKeyNumeric,
  sortKeyLocale,
  SortComparison,
} from './SortUtils';
import { getType } from './UserUtils';

export { SortingOrders } from './SortUtils';

export enum FilterTypes {
  SHOW_ALL,
  NOT_RATED_BY_ME,
  RATED_BY_ME,
  COMPLETED,
  NOT_COMPLETED,
}

export enum SortingTypes {
  NO_SORT,
  SORT_NAME,
  SORT_STATUS,
  SORT_DESC,
  SORT_CREATEDAT,
  SORT_RATINGS,
}

const averageRatingsByDimension = (
  task: Task,
): Map<TaskRatingDimension, number> => {
  const ratings = task.ratings.reduce((result, { value, dimension }) => {
    const { sum, count } = result.get(dimension) || { sum: 0, count: 0 };
    return result.set(dimension, { sum: sum + value, count: count + 1 });
  }, new Map());
  return new Map(
    Array.from(ratings).map(([key, { sum, count }]) => [key, sum / count]),
  );
};

export const totalValueAndWork = (tasks: Task[]) =>
  tasks
    .map((task) => averageRatingsByDimension(task))
    .reduce(
      ({ value, work }, ratings) => ({
        value: value + (ratings.get(TaskRatingDimension.BusinessValue) || 0),
        work: work + (ratings.get(TaskRatingDimension.RequiredWork) || 0),
      }),
      { value: 0, work: 0 },
    );

export const averageValueAndWork = (tasks: Task[]) => {
  const totals = totalValueAndWork(tasks);
  return {
    value: totals.value / tasks.length,
    work: totals.work / tasks.length,
  };
};

export const calcTaskAverageRating = (
  dimension: TaskRatingDimension,
  task: Task,
) => {
  let sum = 0;
  let count = 0;
  task.ratings.forEach((rating) => {
    if (rating.dimension !== dimension) return;
    count += 1;
    sum += rating.value;
  });

  if (count > 0) {
    return sum / count;
  }
  return undefined;
};

export const calcTaskPriority = (task: Task) => {
  const ratings = averageRatingsByDimension(task);
  const avgBusinessRating = ratings.get(TaskRatingDimension.BusinessValue);
  const avgWorkRating = ratings.get(TaskRatingDimension.RequiredWork);
  if (!avgBusinessRating) return -2;
  if (!avgWorkRating) return -1;
  return avgBusinessRating / avgWorkRating;
};

export const filterTasksRatedByUser = (userId: number = -1, rated: boolean) => {
  return (task: Task) => {
    if (
      task.ratings?.find((taskrating) => taskrating.createdByUser === userId)
    ) {
      return rated;
    }
    return !rated;
  };
};

export const filterTasksByCompletion = (completion: boolean) => {
  return (task: Task) => task.completed === completion;
};

export const filterTasks = (
  taskList: Task[],
  filterType: FilterTypes,
  userId?: number,
) => {
  let filterFunc: (task: Task) => boolean;
  switch (filterType) {
    case FilterTypes.NOT_RATED_BY_ME:
      filterFunc = filterTasksRatedByUser(userId, false);
      break;
    case FilterTypes.RATED_BY_ME:
      filterFunc = filterTasksRatedByUser(userId, true);
      break;
    case FilterTypes.COMPLETED:
      filterFunc = filterTasksByCompletion(true);
      break;
    case FilterTypes.NOT_COMPLETED:
      filterFunc = filterTasksByCompletion(false);
      break;
    default:
      filterFunc = () => true;
  }
  return taskList.filter(filterFunc);
};

const taskCompare = (
  sortingType: SortingTypes,
): SortComparison<Task> | undefined => {
  switch (sortingType) {
    case SortingTypes.SORT_CREATEDAT:
      return sortKeyNumeric((t) => new Date(t.createdAt).getTime());
    case SortingTypes.SORT_NAME:
      return sortKeyLocale((t) => t.name);
    case SortingTypes.SORT_DESC:
      return sortKeyLocale((t) => t.description);
    case SortingTypes.SORT_STATUS:
      return sortKeyNumeric((t) => +t.completed);
    case SortingTypes.SORT_RATINGS:
      return sortKeyNumeric(calcTaskPriority);
    default:
      // SortingTypes.NO_SORT
      break;
  }
};

export const sortTasks = (
  taskList: Task[],
  sortingType: SortingTypes,
  sortingOrder: SortingOrders,
) => sorted(taskList, taskCompare(sortingType), sortingOrder);

// Function to help with reordering item in list
export const reorderList = (
  list: Task[],
  startIndex: number,
  endIndex: number,
) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

// Function to help move items between lists
export const dragDropBetweenLists = (
  source: Task[],
  destination: Task[],
  droppableSource: DraggableLocation,
  droppableDestination: DraggableLocation,
) => {
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);

  destClone.splice(droppableDestination.index, 0, removed);

  return {
    [droppableSource.droppableId]: sourceClone,
    [droppableDestination.droppableId]: destClone,
  };
};
export const calcTaskValueSum = (task: Task) => {
  let ratingValuesSum = 0;
  task.ratings.forEach((rating) => {
    if (rating.dimension !== TaskRatingDimension.BusinessValue) return;
    ratingValuesSum += rating.value;
  });

  return ratingValuesSum;
};

export const calcTaskWeightedValueSum = (
  task: Task,
  allCustomers: Customer[],
  roadmap: Roadmap,
) => {
  const customerValuesSum = allCustomers.reduce(
    (total, customer) => total + customerWeight(customer),
    0,
  );

  const ratingValue = (rating: Taskrating) => {
    const ratingCreator = allCustomers.find(
      ({ id }) => id === rating.forCustomer,
    );

    const ratingCreatorValue = ratingCreator
      ? customerWeight(ratingCreator, roadmap.plannerCustomerWeights)
      : 0;

    let creatorPlannerWeight = roadmap.plannerCustomerWeights?.find(
      ({ customerId }) => customerId === rating.forCustomer,
    )?.weight;
    if (creatorPlannerWeight === undefined) creatorPlannerWeight = 1;

    let creatorValueWeight = 0;
    if (ratingCreator === undefined) creatorValueWeight = 1;

    if (ratingCreatorValue > 0 && customerValuesSum > 0) {
      creatorValueWeight = ratingCreatorValue / customerValuesSum;
    }
    return rating.value * creatorValueWeight * creatorPlannerWeight;
  };

  return task.ratings
    .filter(({ dimension }) => dimension === TaskRatingDimension.BusinessValue)
    .map(ratingValue)
    .reduce((sum, value) => sum + value, 0);
};

export const calcWeightedTaskPriority = (
  task: Task,
  allCustomers: Customer[],
  roadmap: Roadmap,
) => {
  const weightedValue = calcTaskWeightedValueSum(task, allCustomers, roadmap);
  if (!weightedValue) return -2;

  const avgWorkRating = calcTaskAverageRating(
    TaskRatingDimension.RequiredWork,
    task,
  );

  if (!avgWorkRating) return -1;

  return weightedValue / avgWorkRating;
};

export const taskAwaitsRatings = (task: Task, userInfo?: UserInfo) => {
  const type = getType(userInfo?.roles, task.roadmapId);
  if (type === RoleType.Admin || type === RoleType.Business)
    return !!userInfo?.representativeFor?.find(
      (customer) =>
        !task.ratings.some(
          (rating) =>
            customer.id === rating.forCustomer &&
            rating.createdByUser === userInfo?.id,
        ),
    );
  return !task.ratings.find((rating) => rating.createdByUser === userInfo?.id);
};
