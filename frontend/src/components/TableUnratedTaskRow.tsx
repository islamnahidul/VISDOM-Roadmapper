/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState, useEffect } from 'react';
import BuildIcon from '@material-ui/icons/Build';
import PermIdentityIcon from '@material-ui/icons/PermIdentity';
import Tooltip from '@material-ui/core/Tooltip';
import { Trans } from 'react-i18next';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import { StylesProvider } from '@material-ui/core/styles';
import { StoreDispatchType } from '../redux';
import { modalsActions } from '../redux/modals';
import { ModalTypes } from '../redux/modals/types';
import { Task, Customer, RoadmapUser } from '../redux/roadmaps/types';
import { RootState } from '../redux/types';
import { userInfoSelector } from '../redux/user/selectors';
import { UserInfo } from '../redux/user/types';
import { RoleType } from '../../../shared/types/customTypes';
import {
  roadmapUsersSelector,
  allCustomersSelector,
} from '../redux/roadmaps/selectors';
import { Dot } from './Dot';
import { getType } from '../utils/UserUtils';
import css from './TableUnratedTaskRow.module.scss';
import {
  calcAverageTaskValue,
  calcAverageTaskWorkSum,
  taskAwaitsRatings,
} from '../utils/TaskUtils';

const classes = classNames.bind(css);

interface TableTaskRowProps {
  task: Task;
}

export const TableUnratedTaskRow: React.FC<TableTaskRowProps> = ({ task }) => {
  const dispatch = useDispatch<StoreDispatchType>();
  const { name, roadmapId } = task;
  const userInfo = useSelector<RootState, UserInfo | undefined>(
    userInfoSelector,
    shallowEqual,
  );
  const type = getType(userInfo?.roles, roadmapId);
  const allUsers = useSelector<RootState, RoadmapUser[] | undefined>(
    roadmapUsersSelector,
    shallowEqual,
  );
  const allCustomers = useSelector<RootState, Customer[] | undefined>(
    allCustomersSelector,
    shallowEqual,
  );
  const [missingRatings, setMissingRatings] = useState<Customer[] | undefined>(
    undefined,
  );
  const [missingDevRatings, setMissingDevRatings] = useState<
    RoadmapUser[] | undefined
  >([]);
  const [userRatingMissing, setUserRatingMissing] = useState<boolean>(true);

  /*
    AdminUsers can see missing customer and developer ratings
    DeveloperUser can see missing developer ratings
    CustomerUser and BusinessUser can see their own missing ratings
  */
  useEffect(() => {
    if (getType(userInfo?.roles, task.roadmapId) === RoleType.Admin) {
      const ratingIds = task.ratings.map((rating) => rating.createdByUser);
      const unratedCustomers = allCustomers?.filter((customer) => {
        const representativeIds = customer?.representatives?.map(
          (rep) => rep.id,
        );
        return !representativeIds?.every((rep) => ratingIds?.includes(rep));
      });
      setMissingRatings(unratedCustomers);
    }

    if (type === RoleType.Admin || type === RoleType.Developer) {
      const ratingIds = task.ratings.map((rating) => rating.createdByUser);
      const developers = allUsers?.filter(
        (user) => user.type === RoleType.Developer,
      );
      const missingDevs = developers?.filter(
        (developer) => !ratingIds.includes(developer.id),
      );
      setMissingDevRatings(missingDevs);
    }

    if (type === RoleType.Customer || type === RoleType.Business) {
      // if task doesn't have ratings from the user that is logged in, display icon to them.
      setUserRatingMissing(
        !task.ratings.some((rating) => rating.createdByUser === userInfo?.id),
      );
    }
  }, [task.ratings, allCustomers, allUsers, userInfo, type, task.roadmapId]);

  const rateTaskClicked = (e: React.MouseEvent<any, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(
      modalsActions.showModal({
        modalType: ModalTypes.RATE_TASK_MODAL,
        modalProps: {
          taskId: task.id,
        },
      }),
    );
  };

  const taskDetailsClicked = (e: React.MouseEvent<any, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(
      modalsActions.showModal({
        modalType: ModalTypes.TASK_INFO_MODAL,
        modalProps: {
          taskId: task.id,
        },
      }),
    );
  };

  const notifyUsersClicked = (e: React.MouseEvent<any, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(
      modalsActions.showModal({
        modalType: ModalTypes.NOTIFY_USERS_MODAL,
        modalProps: {
          taskId: task.id,
        },
      }),
    );
  };

  return (
    <tr
      className={classes(css.styledTr, css.clickable)}
      onClick={taskDetailsClicked}
    >
      <td className={`styledTd ${classes(css.taskTitle)}`}>{name}</td>
      <td className={`styledTd ${classes(css.unratedTd)}`}>
        {calcAverageTaskValue(task) || 0}
      </td>
      <td className={`styledTd ${classes(css.unratedTd)}`}>
        {calcAverageTaskWorkSum(task) || 0}
      </td>
      <td className={`styledTd ${classes(css.unratedTd)}`}>
        <div className={classes(css.missingContainer)}>
          <StylesProvider injectFirst>
            {missingRatings && (
              <div className={classes(css.missingContainer)}>
                {missingRatings.map((customer) => (
                  <div key={customer.id}>
                    <Tooltip
                      classes={{
                        arrow: classNames(css.tooltipArrow),
                        tooltip: classNames(css.tooltip),
                      }}
                      title={customer.name}
                      placement="top"
                      arrow
                    >
                      <div className={classes(css.dotContainer)}>
                        <Dot fill={customer.color || 'red'} />
                      </div>
                    </Tooltip>
                  </div>
                ))}
              </div>
            )}
            {missingDevRatings && (
              <div>
                {missingDevRatings.map((dev) => (
                  <Tooltip
                    classes={{
                      arrow: classNames(css.tooltipArrow),
                      tooltip: classNames(css.tooltip),
                    }}
                    key={dev.username}
                    title={dev.username}
                    placement="top"
                    arrow
                  >
                    <BuildIcon className={classes(css.developerIcon)} />
                  </Tooltip>
                ))}
              </div>
            )}
            {userRatingMissing &&
              (type === RoleType.Customer || type === RoleType.Business) && (
                <div>
                  <Tooltip
                    classes={{
                      arrow: classNames(css.tooltipArrow),
                      tooltip: classNames(css.tooltip),
                    }}
                    key={userInfo?.username}
                    title={userInfo?.username || ''}
                    placement="top"
                    arrow
                  >
                    <PermIdentityIcon className={classes(css.userIcon)} />
                  </Tooltip>
                </div>
              )}
          </StylesProvider>
        </div>
      </td>
      <td className="styledTd textAlignEnd nowrap" style={{ width: '702px' }}>
        {type === RoleType.Admin && (
          <button
            style={{ marginRight: '10px' }}
            className={classes(css['button-small-outlined'])}
            type="button"
            onClick={notifyUsersClicked}
          >
            <Trans i18nKey="Notify" />
          </button>
        )}
        {taskAwaitsRatings(task, userInfo) ? (
          <a
            href={`?openModal=${
              ModalTypes.TASK_RATINGS_INFO_MODAL
            }&modalProps=${encodeURIComponent(
              JSON.stringify({ taskId: task.id }),
            )}`}
          >
            <button
              className={classes(css['button-small-filled'])}
              type="button"
              onClick={rateTaskClicked}
            >
              <Trans i18nKey="Rate" />
            </button>
          </a>
        ) : (
          <button
            className={classes(css['button-small-filled'])}
            type="button"
            disabled
          >
            <Trans i18nKey="Rate" />
          </button>
        )}
      </td>
    </tr>
  );
};
