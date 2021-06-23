/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle } from 'react-bootstrap-icons';
import { Trans } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';
import classNames from 'classnames';
import { TableRatedTaskRow } from './TableRatedTaskRow';
import { Task, Customer, RoadmapUser, Roadmap } from '../redux/roadmaps/types';
import { RootState } from '../redux/types';
import { userInfoSelector } from '../redux/user/selectors';
import { UserInfo } from '../redux/user/types';
import { RoleType } from '../../../shared/types/customTypes';
import {
  filterTasks,
  FilterTypes,
  SortingOrders,
  SortingTypes,
  sortTasks,
  taskAwaitsRatings,
} from '../utils/TaskUtils';
import css from './TaskTableRated.module.scss';
import {
  allCustomersSelector,
  chosenRoadmapSelector,
  roadmapUsersSelector,
} from '../redux/roadmaps/selectors';
import { InfoButton } from './forms/InfoButton';
import { getType } from '../utils/UserUtils';

const classes = classNames.bind(css);

interface TableHeader {
  label: string;
  sorting: SortingTypes;
  textAlign?: 'end' | 'left' | 'center';
  width?: string;
}

export const TaskTableRated: React.FC<{
  tasks: Task[];
  searchString?: string;
  searchFilter?: FilterTypes;
}> = ({ tasks, searchString, searchFilter }) => {
  const [sortingType, setSortingType] = useState(SortingTypes.NO_SORT);
  const [sortingOrder, setSortingOrder] = useState(SortingOrders.ASCENDING);
  const userInfo = useSelector<RootState, UserInfo | undefined>(
    userInfoSelector,
    shallowEqual,
  );

  const allUsers = useSelector<RootState, RoadmapUser[] | undefined>(
    roadmapUsersSelector,
    shallowEqual,
  );
  const allCustomers = useSelector<RootState, Customer[] | undefined>(
    allCustomersSelector,
    shallowEqual,
  );
  const currentRoadmap = useSelector<RootState, Roadmap | undefined>(
    chosenRoadmapSelector,
    shallowEqual,
  );

  const getRenderTaskList: () => Task[] = () => {
    // Filter, search, sort tasks
    const filtered = filterTasks(
      tasks,
      searchFilter || FilterTypes.SHOW_ALL,
      userInfo?.id,
    );
    const searched = filtered.filter(
      (task) =>
        task.name.toLowerCase().includes(searchString || '') ||
        task.description.toLowerCase().includes(searchString || ''),
    );
    const sorted = sortTasks(searched, sortingType, sortingOrder);

    return sorted;
  };

  // Return tasks that don't have ratings from everyone involved in the task - View for product owner
  const getOwnerTask: () => Task[] = () => {
    const developers = allUsers?.filter(
      (user) => user.type === RoleType.Developer,
    );
    const unrated = getRenderTaskList().filter((task) => {
      const ratingIds = task.ratings.map((rating) => rating.createdByUser);

      const unratedCustomers = allCustomers?.filter((customer) => {
        const representativeIds = customer?.representatives?.map(
          (rep) => rep.id,
        );
        return !representativeIds?.every((rep) => ratingIds?.includes(rep));
      });

      const missingDevs = developers?.filter(
        (developer) => !ratingIds.includes(developer.id),
      );

      if (
        unratedCustomers &&
        unratedCustomers?.length < 1 &&
        missingDevs &&
        missingDevs?.length < 1
      )
        return false;
      return true;
    });

    return unrated;
  };

  // Return tasks that are not rated by logged in user
  const getUnratedTasks: () => Task[] = () => {
    return getRenderTaskList().filter((task) =>
      taskAwaitsRatings(task, userInfo),
    );
  };

  // Compare all tasks to given array of tasks and return the difference
  const getRemainingTasks: (passedTasks: Task[]) => Task[] = (
    passedTasks: Task[],
  ) => {
    return getRenderTaskList().filter((task) => !passedTasks.includes(task));
  };

  // Return length of the tasks that are in the Rated tasks -table
  const getRemainingLength = () => {
    if (getType(userInfo?.roles, currentRoadmap?.id) === RoleType.Admin)
      return getRemainingTasks(getOwnerTask()).length;
    return getRemainingTasks(getUnratedTasks()).length;
  };

  const toggleSortOrder = () => {
    if (sortingOrder === SortingOrders.ASCENDING) {
      setSortingOrder(SortingOrders.DESCENDING);
    } else {
      setSortingOrder(SortingOrders.ASCENDING);
    }
  };

  const onSortingChange = (sorter: SortingTypes) => {
    if (sorter === sortingType) {
      toggleSortOrder();
    } else {
      setSortingOrder(SortingOrders.ASCENDING);
    }
    setSortingType(sorter);
  };

  const renderSortingArrow = () => {
    return sortingOrder === SortingOrders.ASCENDING ? (
      <ArrowUpCircle />
    ) : (
      <ArrowDownCircle />
    );
  };

  const tableHeadersRated: TableHeader[] = [
    {
      label: 'Task title',
      sorting: SortingTypes.SORT_NAME,
      textAlign: 'center',
      width: '1em',
    },
    { label: 'Average value', sorting: SortingTypes.SORT_AVG_VALUE },
    { label: 'Average work', sorting: SortingTypes.SORT_AVG_WORK },
    { label: 'Total value', sorting: SortingTypes.SORT_TOTAL_VALUE },
    {
      label: 'Total work',
      sorting: SortingTypes.SORT_TOTAL_WORK,
      width: '1em',
    },
  ];

  const renderRemainingTasks = () => {
    return (
      <table className={classes(css.styledTable)}>
        <thead>
          <tr className={classes(css.styledTr)}>
            {tableHeadersRated.map((header) => (
              <th
                className={classes(css.styledTh, css.clickable, {
                  textAlignEnd: header.textAlign === 'end',
                  textAlignCenter: header.textAlign === 'center',
                })}
                key={header.label}
                onClick={() => onSortingChange(header.sorting)}
                style={{ width: header.width }}
              >
                <span className="headerSpan">
                  <Trans i18nKey={header.label} />
                  {sortingType === header.sorting ? renderSortingArrow() : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getType(userInfo?.roles, currentRoadmap?.id) === RoleType.Admin &&
            getRemainingTasks(getOwnerTask()).map((task) => (
              <TableRatedTaskRow key={task.id} task={task} />
            ))}
          {getType(userInfo?.roles, currentRoadmap?.id) !== RoleType.Admin &&
            getRemainingTasks(getUnratedTasks()).map((task) => (
              <TableRatedTaskRow key={task.id} task={task} />
            ))}
        </tbody>
      </table>
    );
  };

  return (
    <>
      {getRemainingLength() > 0 && (
        <div>
          <h2 className={classes(css.taskTableHeader)}>
            Rated tasks ({getRemainingLength()})
            <div style={{ marginLeft: '24px' }}>
              <InfoButton />
            </div>
          </h2>
          <div>
            {getRemainingLength() > 0 && <div>{renderRemainingTasks()}</div>}
          </div>
        </div>
      )}
    </>
  );
};
