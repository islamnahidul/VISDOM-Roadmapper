export enum ModalTypes {
  ADD_TASK_MODAL = 'ADD_TASK_MODAL',
  RATE_TASK_MODAL = 'RATE_TASK_MODAL',
  EDIT_TASK_MODAL = 'EDIT_TASK_MODAL',
  TASK_INFO_MODAL = 'TASK_INFO_MODAL',
  TASK_RATINGS_INFO_MODAL = 'TASK_RATINGS_INFO_MODAL',
  REMOVE_PEOPLE_MODAL = 'REMOVE_PEOPLE_MODAL',
  EDIT_CUSTOMER_MODAL = 'EDIT_CUSTOMER_MODAL',
  ADD_CUSTOMER_MODAL = 'ADD_CUSTOMER_MODAL',
  EDIT_TEAM_MEMBER_MODAL = 'EDIT_TEAM_MEMBER_MODAL',
  ADD_VERSION_MODAL = 'ADD_VERSION_MODAL',
  DELETE_VERSION_MODAL = 'DELETE_VERSION_MODAL',
  EDIT_VERSION_MODAL = 'EDIT_VERSION_MODAL',
  IMPORT_TASKS_MODAL = 'IMPORT_TASKS_MODAL',
  SETUP_OAUTH_MODAL = 'SETUP_OATH_MODAL',
  INTEGRATION_CONFIGURATION_MODAL = 'INTEGRATION_CONFIGURATION_MODAL',
  USER_AUTH_TOKEN_MODAL = 'USER_AUTH_TOKEN_MODAL',
}

export interface ShowModalPayload {
  modalType: ModalTypes;
  modalProps: { [K in any]: any };
}

export interface ModalsState {
  showModal: boolean;
  currentModal: ModalTypes;
  modalProps: { [K in any]: any };
}

export const modalLink = (modalType: ModalTypes, payload: any) =>
  `?openModal=${modalType}&modalProps=${encodeURIComponent(
    JSON.stringify(payload),
  )}`;
