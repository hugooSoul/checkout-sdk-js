import { combineReducers, composeReducers, Action } from '@bigcommerce/data-store';
import { omit } from 'lodash';

import { clearErrorReducer } from '../common/error';

import { OrderAction, OrderActionType } from './order-actions';
import OrderState, { OrderDataState, OrderErrorsState, OrderMetaState, OrderStatusesState } from './order-state';
import { SpamProtectionAction, SpamProtectionActionType } from './spam-protection/spam-protection-actions';

const DEFAULT_STATE: OrderState = {
    errors: {},
    meta: {},
    statuses: {},
};

export default function orderReducer(
    state: OrderState = DEFAULT_STATE,
    action: Action
): OrderState {
    const reducer = combineReducers<OrderState>({
        data: dataReducer,
        errors: composeReducers(errorsReducer, clearErrorReducer),
        meta: metaReducer,
        statuses: statusesReducer,
    });

    return reducer(state, action);
}

function dataReducer(
    data: OrderDataState | undefined,
    action: OrderAction
): OrderDataState | undefined {
    switch (action.type) {
    case OrderActionType.LoadOrderSucceeded:
    case OrderActionType.LoadOrderPaymentsSucceeded:
        return action.payload
            ? omit({ ...data, ...action.payload }, ['billingAddress', 'coupons'])
            : data;

    default:
        return data;
    }
}

function metaReducer(
    meta: OrderMetaState | undefined,
    action: OrderAction | SpamProtectionAction
): OrderMetaState | undefined {
    switch (action.type) {
    case OrderActionType.FinalizeOrderSucceeded:
    case OrderActionType.SubmitOrderSucceeded:
        return action.payload ? {
            ...meta,
            ...action.meta,
            callbackUrl: action.payload.order.callbackUrl,
            orderToken: action.payload.order.token,
            payment: action.payload.order && action.payload.order.payment,
        } : meta;
    case SpamProtectionActionType.Completed:
        return action.payload ? {
            ...meta,
            spamProtectionToken: action.payload,
        } : meta;
    default:
        return meta;
    }
}

function errorsReducer(
    errors: OrderErrorsState = DEFAULT_STATE.errors,
    action: OrderAction
): OrderErrorsState {
    switch (action.type) {
    case OrderActionType.LoadOrderRequested:
    case OrderActionType.LoadOrderSucceeded:
    case OrderActionType.LoadOrderPaymentsSucceeded:
    case OrderActionType.LoadOrderPaymentsRequested:
        return { ...errors, loadError: undefined };

    case OrderActionType.LoadOrderFailed:
    case OrderActionType.LoadOrderPaymentsFailed:
        return { ...errors, loadError: action.payload };

    default:
        return errors;
    }
}

function statusesReducer(
    statuses: OrderStatusesState = DEFAULT_STATE.statuses,
    action: OrderAction
): OrderStatusesState {
    switch (action.type) {
    case OrderActionType.LoadOrderRequested:
    case OrderActionType.LoadOrderPaymentsRequested:
        return { ...statuses, isLoading: true };

    case OrderActionType.LoadOrderSucceeded:
    case OrderActionType.LoadOrderFailed:
    case OrderActionType.LoadOrderPaymentsSucceeded:
    case OrderActionType.LoadOrderPaymentsFailed:
        return { ...statuses, isLoading: false };

    default:
        return statuses;
    }
}
