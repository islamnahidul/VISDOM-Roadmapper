/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle } from 'react-bootstrap-icons';
import BuildIcon from '@material-ui/icons/Build';
import PermIdentityIcon from '@material-ui/icons/PermIdentity';
import Tooltip from '@material-ui/core/Tooltip';
import { Trans } from 'react-i18next';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import { StylesProvider } from '@material-ui/core/styles';
import { StoreDispatchType } from '../redux';
import { modalsActions } from '../redux/modals';
import { ModalTypes, modalLink } from '../redux/modals/types';
import { roadmapsActions } from '../redux/roadmaps/index';
import { Task, Customer, RoadmapUser } from '../redux/roadmaps/types';
import { RootState } from '../redux/types';
import { userInfoSelector } from '../redux/user/selectors';
import { UserInfo } from '../redux/user/types';
import { RoleType } from '../../../shared/types/customTypes';
import {
  roadmapUsersSelector,
  allCustomersSelector,
} from '../redux/roadmaps/selectors';
import { taskAwaitsRatings } from '../utils/TaskUtils';
import {
  DeleteButton,
  EditButton,
  InfoButton,
  RatingsButton,
} from './forms/SvgButton';
import { TaskRatingsText } from './TaskRatingsText';
import { Dot } from './Dot';
import { getType } from '../utils/UserUtils';
import css from './TableTaskRow.module.scss';

const classes = classNames.bind(css);

interface TableTaskRowProps {
  task: Task;
}

export const TableTaskRow: React.FC<TableTaskRowProps> = ({ task }) => {
  const dispatch = useDispatch<StoreDispatchType>();
  const { id, name, completed, roadmapId, description, createdAt } = task;
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
    BusinessUser can see their missing customer ratings
    DeveloperUser can see missing developer ratings
    CustomerUser can see their own missing ratings
  */
  useEffect(() => {
    if (type === RoleType.Admin) {
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

    if (type === RoleType.Business) {
      const unratedCustomers = userInfo?.representativeFor?.filter(
        (customer) =>
          !task.ratings.some(
            (rating) =>
              customer.id === rating.forCustomer &&
              rating.createdByUser === userInfo?.id,
          ),
      );
      setMissingRatings(unratedCustomers);
    }

    if (type === RoleType.Customer) {
      // if task doesn't have ratings from the user that is logged in, display icon to them.
      setUserRatingMissing(
        !task.ratings.some((rating) => rating.createdByUser === userInfo?.id),
      );
    }
  }, [task.ratings, allCustomers, allUsers, userInfo, type, task.roadmapId]);

  const deleteTaskClicked = (e: React.MouseEvent<unknown, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(roadmapsActions.deleteTask({ id, roadmapId }));
  };

  const openModal = (modalType: ModalTypes) => (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(
      modalsActions.showModal({
        modalType,
        modalProps: {
          taskId: task.id,
        },
      }),
    );
  };

  const editTaskClicked = openModal(ModalTypes.EDIT_TASK_MODAL);
  const rateTaskClicked = openModal(ModalTypes.RATE_TASK_MODAL);
  const taskRatingDetailsClicked = openModal(
    ModalTypes.TASK_RATINGS_INFO_MODAL,
  );
  const taskDetailsClicked = openModal(ModalTypes.TASK_INFO_MODAL);

  const toggleCompletedClicked = (e: React.MouseEvent<unknown, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(roadmapsActions.patchTask({ id, completed: !completed }));
  };

  return (
    <tr
      className={classes(css.styledTr, css.clickable)}
      onClick={taskDetailsClicked}
    >
      <td
        className="styledTd clickable textAlignCenter"
        onClick={toggleCompletedClicked}
      >
        {completed ? (
          <CheckCircle onClick={toggleCompletedClicked} />
        ) : (
          <Circle onClick={toggleCompletedClicked} />
        )}
      </td>
      <td className="styledTd">{name}</td>
      <td className="styledTd">
        {description.length > 75
          ? `${description.slice(0, 75)}...`
          : description}
      </td>
      <td className="styledTd">
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
            {userRatingMissing && type === RoleType.Customer && (
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
      <td className="styledTd nowrap">
        <TaskRatingsText task={task} />
      </td>
      <td className="styledTd">{new Date(createdAt).toLocaleDateString()}</td>
      <td className="styledTd textAlignEnd nowrap" style={{ width: '202px' }}>
        {taskAwaitsRatings(task, userInfo) && (
          <a
            href={modalLink(ModalTypes.TASK_RATINGS_INFO_MODAL, {
              taskId: task.id,
            })}
          >
            <button
              className={classes(css['button-small-filled'])}
              type="button"
              onClick={rateTaskClicked}
            >
              <Trans i18nKey="Rate" />
            </button>
          </a>
        )}
        <div className={classes(css.buttonWrapper)}>
          <RatingsButton
            onClick={taskRatingDetailsClicked}
            href={modalLink(ModalTypes.TASK_RATINGS_INFO_MODAL, {
              taskId: task.id,
            })}
          />
          <InfoButton
            onClick={taskDetailsClicked}
            href={modalLink(ModalTypes.TASK_INFO_MODAL, { taskId: task.id })}
          />
          {type === RoleType.Admin && (
            <>
              <EditButton
                fontSize="default"
                onClick={editTaskClicked}
                href={modalLink(ModalTypes.EDIT_TASK_MODAL, {
                  taskId: task.id,
                })}
              />
              <DeleteButton type="outlined" onClick={deleteTaskClicked} />
            </>
          )}
        </div>
      </td>
    </tr>
  );
};
