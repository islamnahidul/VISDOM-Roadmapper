import React, { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import classNames from 'classnames';
import { StoreDispatchType } from '../../redux';
import {
  allCustomersSelector,
  roadmapUsersSelector,
  taskSelector,
} from '../../redux/roadmaps/selectors';
import { LoadingSpinner } from '../LoadingSpinner';
import { ModalProps } from '../types';
import { ModalCloseButton } from './modalparts/ModalCloseButton';
import { ModalContent } from './modalparts/ModalContent';
import { ModalFooter } from './modalparts/ModalFooter';
import { ModalFooterButtonDiv } from './modalparts/ModalFooterButtonDiv';
import { ModalHeader } from './modalparts/ModalHeader';
import { Checkbox } from '../forms/Checkbox';
import { RootState } from '../../redux/types';
import { UserInfo } from '../../redux/user/types';
import { userInfoSelector } from '../../redux/user/selectors';
import { Customer, RoadmapUser } from '../../redux/roadmaps/types';
import { RoleType } from '../../../../shared/types/customTypes';
import css from './NotifyUsersModal.module.scss';
import { getType } from '../../utils/UserUtils';

const classes = classNames.bind(css);

export interface NotifyUsersModal extends ModalProps {
  taskId: number;
}

interface CheckableUser extends RoadmapUser {
  checked: boolean;
}

export const NotifyUsersModal: React.FC<NotifyUsersModal> = ({
  closeModal,
  taskId,
}) => {
  const task = useSelector(taskSelector(taskId))!;
  const dispatch = useDispatch<StoreDispatchType>();
  const [isLoading, setIsLoading] = useState(false);
  const userInfo = useSelector<RootState, UserInfo | undefined>(
    userInfoSelector,
    shallowEqual,
  );
  const customers = useSelector<RootState, Customer[] | undefined>(
    allCustomersSelector,
    shallowEqual,
  );
  const allUsers = useSelector<RootState, RoadmapUser[] | undefined>(
    roadmapUsersSelector,
    shallowEqual,
  );
  const [missingUsers, setMissingUsers] = useState<CheckableUser[] | undefined>(
    [],
  );

  const [allChecked, setAllChecked] = useState<boolean>(false);

  useEffect(() => {
    if (getType(userInfo?.roles, task.roadmapId) === RoleType.Admin) {
      const ratingIds = task.ratings.map((rating) => rating.createdByUser);
      const missingCustomers = customers?.filter((customer) => {
        const representativeIds = customer?.representatives?.map(
          (rep) => rep.id,
        );
        return !representativeIds?.every((rep) => ratingIds?.includes(rep));
      });

      const missingRepresentatives: CheckableUser[] = [];

      // Find representatives for missing customer
      if (missingCustomers) {
        missingCustomers.forEach((customer) => {
          const ratingsForCustomerIds = task.ratings
            .filter((rating) => rating.forCustomer !== customer.id)
            .map((e) => e.createdByUser);
          if (customer.representatives) {
            customer.representatives.forEach((rep) => {
              if (
                !ratingsForCustomerIds.includes(rep.id) &&
                !missingRepresentatives.some((e) => e.id === rep.id)
              )
                missingRepresentatives.push({ ...rep, checked: false });
            });
          }
        });
      }

      // Filter developers, check who haven't given ratings, add checked attribute for all of them
      const missingDevelopers = allUsers
        ?.filter((user) => user.type === RoleType.Developer)
        .filter((developer) => !ratingIds.includes(developer.id))
        .map((dev) => ({ ...dev, checked: false }));

      setMissingUsers([
        ...(missingRepresentatives ?? []),
        ...(missingDevelopers ?? []),
      ]);
    }
  }, [allUsers, customers, task.ratings, task.roadmapId, userInfo]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!missingUsers) return;
    setIsLoading(true);

    missingUsers.forEach((user) => {
      if (user.checked) {
        console.log('send email to ', user);
        /* dispatch(roadmapsActions.notifyUserByEmail(user));
          }).then((res) => {
        setIsLoading(false);
        }) */
      }
    });
  };

  const checkAll = (checked: boolean) => {
    const copy = [...(missingUsers ?? [])];
    setAllChecked(!allChecked);
    if (!copy) return;
    // eslint-disable-next-line no-return-assign
    copy.forEach((_user, idx) => (copy[idx].checked = checked));
    setMissingUsers(copy);
  };

  const checkUser = (checked: boolean, idx: number) => {
    setAllChecked(false);
    const copy = [...(missingUsers ?? [])];
    if (!copy) return;
    copy[idx].checked = checked;
    setMissingUsers(copy);
  };

  return (
    <>
      <Form onSubmit={handleSubmit}>
        <ModalHeader>
          <h3>
            <Trans i18nKey="Send notification by email" />
          </h3>
          <ModalCloseButton onClick={closeModal} />
        </ModalHeader>
        <ModalContent>
          <p className={`typography-pre-title ${classes(css.azure)}`}>
            <Trans i18nKey="Send the notification to" />
          </p>
          <Checkbox
            label="All"
            checked={allChecked}
            onChange={(checked: boolean) => checkAll(checked)}
          />
          <hr />
          {missingUsers?.map((user, idx) => (
            <Checkbox
              key={user.id}
              label={user.username}
              checked={user.checked}
              onChange={(checked: boolean) => checkUser(checked, idx)}
            />
          ))}
        </ModalContent>
        <ModalFooter>
          <ModalFooterButtonDiv>
            <button
              className="button-large cancel"
              onClick={closeModal}
              type="button"
            >
              <Trans i18nKey="Cancel" />
            </button>
          </ModalFooterButtonDiv>
          <ModalFooterButtonDiv>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <button className="button-large" type="submit">
                <Trans i18nKey="Confirm" />
              </button>
            )}
          </ModalFooterButtonDiv>
        </ModalFooter>
      </Form>
    </>
  );
};
