export interface RemoveService {
  ServiceRequestId: number;
}

export interface ReturnToState {
  ServiceRequestId: number;
}

export interface AddRequest {}

export interface UpdateBox {
  ServiceRequestId: number,
  BoxNumber: string,
}

export interface UpdateReference {
  ServiceRequestId: number,
  Reference: string
}

export interface UpdateOperation {
  ServiceRequestId: number,
  OperationTypeId: number
}

export interface UpdateTmw{
  ServiceRequestId: number,
  TmwOrder: number,
}

export interface UpdateUuid {
  ServiceRequestId: number,
  Uuid: string
}

export interface UpdateConsignmentNote {
  documentId: number,
  consignmentNote: string,
}

export interface UpdateLayoutStatus {
  ServiceRequestId: number,
  DocumentId: number,
  AcceptedLayout: boolean,
  NotAcceptedLayout: boolean,
}

export interface CreateRequest {
  BoxNumber: string,
  Reference: string,
  StopId: number,
  OperationTypeId: number,
  CustomerId: string,
}
