/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle } from 'react-bootstrap-icons';
import { Trans } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';
import classNames from 'classnames';
import { TableUnratedTaskRow } from './TableUnratedTaskRow';
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
import css from './TaskTableUnrated.module.scss';
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

export const TaskTableUnrated: React.FC<{
  tasks: Task[];
  nofilter?: boolean;
  nosearch?: boolean;
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
      searchFilter || FilterTypes.SHOW_ALL, // Show all tasks if component didn't receive searchFilter as props
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

  // Return length of the tasks that are in the Waiting for ratings -table
  const getWaitingLength = () => {
    if (getType(userInfo?.roles, currentRoadmap?.id) === RoleType.Admin)
      return getOwnerTask().length;
    return getUnratedTasks().length;
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

  const tableHeaders: TableHeader[] = [
    {
      label: 'Status',
      sorting: SortingTypes.SORT_STATUS,
      textAlign: 'center',
      width: '1em',
    },
    { label: 'Title', sorting: SortingTypes.SORT_NAME },
    { label: 'Description', sorting: SortingTypes.SORT_DESC },
    { label: 'Waiting for ratings', sorting: SortingTypes.NO_SORT },
    {
      label: 'Rating',
      sorting: SortingTypes.SORT_RATINGS,
      width: '1em',
    },
    {
      label: 'Created on',
      sorting: SortingTypes.SORT_CREATEDAT,
      width: '8em',
    },
  ];

  const renderUnratedTasks = () => {
    return (
      <table className={classes(css.styledTable)}>
        <thead>
          <tr className={classes(css.styledTr)}>
            {tableHeaders.map((header) => (
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
            getOwnerTask().map((task) => (
              <TableUnratedTaskRow key={task.id} task={task} />
            ))}
          {getType(userInfo?.roles, currentRoadmap?.id) !== RoleType.Admin &&
            getUnratedTasks().map((task) => (
              <TableUnratedTaskRow key={task.id} task={task} />
            ))}
        </tbody>
      </table>
    );
  };

  return (
    <>
      {getWaitingLength() > 0 && (
        <div className={classes(css.tableContainer)}>
          <h2 className={classes(css.taskTableHeader)}>
            Waiting for ratings ({getWaitingLength()})
            <div style={{ marginLeft: '24px' }}>
              <InfoButton />
            </div>
          </h2>
          <div>
            <div>{getWaitingLength() > 0 && renderUnratedTasks()}</div>
          </div>
        </div>
      )}
    </>
  );
};
