import { createTimeout } from '@bigcommerce/request-sender';
import { Observable } from 'rxjs';
import { omit } from 'lodash';

import { createCheckoutStore } from '../checkout';
import { getCheckout, getCheckoutState, getCheckoutStoreState } from '../checkout/checkouts.mock';
import { MissingDataError } from '../common/error/errors';
import { getErrorResponse, getResponse } from '../common/http-request/responses.mock';

import ConsignmentActionCreator from './consignment-action-creator';
import { ConsignmentActionType } from './consignment-actions';
import { getShippingAddress } from './shipping-addresses.mock';
import { getConsignment } from './consignments.mock';

describe('consignmentActionCreator', () => {
    let address;
    let consignment;
    let consignmentRequestSender;
    let checkoutRequestSender;
    let errorResponse;
    let response;
    let store;
    let consignmentActionCreator;
    let actions;
    let updateShippingOptionPayload;
    const options = { timeout: createTimeout() };

    beforeEach(() => {
        response = getResponse(getCheckout());
        errorResponse = getErrorResponse();
        store = createCheckoutStore(getCheckoutStoreState());

        consignmentRequestSender = {
            createConsignments: jest.fn(() => Promise.resolve(response)),
            updateConsignment: jest.fn(() => Promise.resolve(response)),
        };

        checkoutRequestSender = {
            loadCheckout: jest.fn(() => Promise.resolve(response)),
        };

        consignmentActionCreator = new ConsignmentActionCreator(consignmentRequestSender, checkoutRequestSender);
        address = getShippingAddress();
        consignment = getConsignment();
        updateShippingOptionPayload = {
            id: consignment.id,
            shippingOptionId: 'foo',
            lineItems: [],
        };
        actions = undefined;
    });

    describe('#loadShippingOptions', () => {
        describe('when store has no checkout data', () => {
            beforeEach(() => {
                store = createCheckoutStore({});
            });

            it('throws an exception, emit no actions and does not send a request', async () => {
                try {
                    actions = await Observable.from(consignmentActionCreator.loadShippingOptions()(store))
                        .toPromise();
                } catch (exception) {
                    expect(exception).toBeInstanceOf(MissingDataError);
                    expect(actions).toEqual(undefined);
                    expect(consignmentRequestSender.updateConsignment).not.toHaveBeenCalled();
                }
            });
        });

        it('emits actions and passes right arguments to consignmentRequestSender', async () => {
            const { id } = getCheckout();
            actions = await Observable.from(consignmentActionCreator.loadShippingOptions()(store))
                .toArray()
                .toPromise();

            expect(checkoutRequestSender.loadCheckout).toHaveBeenCalledWith(id, {
                params: {
                    include: ['consignments.availableShippingOptions'],
                },
            });

            expect(actions).toEqual([
                { type: ConsignmentActionType.LoadShippingOptionsRequested },
                { type: ConsignmentActionType.LoadShippingOptionsSucceeded, payload: getCheckout() },
            ]);
        });

        it('emits errors and passes right arguments to consignmentRequestSender', async () => {
            jest.spyOn(checkoutRequestSender, 'loadCheckout')
                .mockReturnValue(Promise.reject(getErrorResponse()));

            const errorHandler = jest.fn(action => Observable.of(action));

            actions = await Observable.from(consignmentActionCreator.loadShippingOptions()(store))
                .catch(errorHandler)
                .toArray()
                .toPromise();

            expect(errorHandler).toHaveBeenCalled();
            expect(actions).toEqual([
                { type: ConsignmentActionType.LoadShippingOptionsRequested },
                { type: ConsignmentActionType.LoadShippingOptionsFailed, error: true, payload: getErrorResponse() },
            ]);
        });
    });

    describe('#createConsignments()', () => {
        describe('when store has no checkout data / id', () => {
            beforeEach(() => {
                store = createCheckoutStore({});
            });

            it('throws an exception, emit no actions and does not send a request', async () => {
                try {
                    actions = await Observable.from(consignmentActionCreator.createConsignments([consignment])(store))
                        .toPromise();
                } catch (exception) {
                    expect(exception).toBeInstanceOf(MissingDataError);
                    expect(actions).toEqual(undefined);
                    expect(consignmentRequestSender.updateConsignment).not.toHaveBeenCalled();
                }
            });
        });

        describe('when store has no cart / line items', () => {
            beforeEach(() => {
                store = createCheckoutStore({
                    checkout: getCheckoutState(),
                });
            });

            it('throws an exception, emit no actions and does not send a request', async () => {
                try {
                    actions = await Observable.from(consignmentActionCreator.createConsignments([consignment])(store))
                        .toPromise();
                } catch (exception) {
                    expect(exception).toBeInstanceOf(MissingDataError);
                    expect(actions).toEqual(undefined);
                    expect(consignmentRequestSender.createConsignments).not.toHaveBeenCalled();
                }
            });
        });

        it('emits actions if able to create consignment', async () => {
            actions = await Observable.from(consignmentActionCreator.createConsignments([consignment])(store))
                .toArray()
                .toPromise();

            expect(actions).toEqual([
                { type: ConsignmentActionType.CreateConsignmentsRequested },
                { type: ConsignmentActionType.CreateConsignmentsSucceeded, payload: response.body },
            ]);
        });

        it('emits error actions if unable to create consignments', async () => {
            consignmentRequestSender.createConsignments.mockImplementation(() => Promise.reject(errorResponse));

            const errorHandler = jest.fn((action) => Observable.of(action));

            await Observable.from(consignmentActionCreator.createConsignments([consignment])(store))
                .catch(errorHandler)
                .toArray()
                .subscribe((actions) => {
                    expect(actions).toEqual([
                        { type: ConsignmentActionType.CreateConsignmentsRequested },
                        { type: ConsignmentActionType.CreateConsignmentsFailed, payload: errorResponse, error: true },
                    ]);
                });
        });

        it('sends request to create consigments', async () => {
            store = createCheckoutStore(omit(getCheckoutStoreState(), 'consignments'));

            await Observable.from(consignmentActionCreator.createConsignments([consignment], options)(store))
                .toPromise();

            expect(consignmentRequestSender.createConsignments).toHaveBeenCalledWith(
                'b20deef40f9699e48671bbc3fef6ca44dc80e3c7',
                [consignment],
                options
            );
        });
    });

    describe('#updateConsignment()', () => {
        describe('when store has no checkout data / id', () => {
            beforeEach(() => {
                store = createCheckoutStore({});
            });

            it('throws an exception, emit no actions and does not send a request', async () => {
                try {
                    actions = await Observable.from(consignmentActionCreator.updateConsignment(consignment)(store))
                        .toPromise();
                } catch (exception) {
                    expect(exception).toBeInstanceOf(MissingDataError);
                    expect(actions).toEqual(undefined);
                    expect(consignmentRequestSender.updateConsignment).not.toHaveBeenCalled();
                }
            });
        });

        it('emits actions if able to update consignment', async () => {
            actions = await Observable.from(consignmentActionCreator.updateConsignment(consignment)(store))
                .toArray()
                .toPromise();

            expect(actions).toEqual([
                { type: ConsignmentActionType.UpdateConsignmentRequested, payload: undefined, meta: { id: consignment.id } },
                {
                    type: ConsignmentActionType.UpdateConsignmentSucceeded,
                    payload: response.body,
                    meta: { id: consignment.id },
                },
            ]);
        });

        it('emits actions if able to update shipping option', async () => {
            actions = await Observable.from(consignmentActionCreator.updateConsignment(updateShippingOptionPayload)(store))
                .toArray()
                .toPromise();

            expect(actions).toEqual([
                { type: ConsignmentActionType.UpdateShippingOptionRequested, payload: undefined, meta: { id: consignment.id } },
                {
                    type: ConsignmentActionType.UpdateShippingOptionSucceeded,
                    payload: response.body,
                    meta: { id: consignment.id },
                },
            ]);
        });

        it('emits error actions if unable to update consignment', async () => {
            consignmentRequestSender.updateConsignment.mockImplementation(() => Promise.reject(errorResponse));

            const errorHandler = jest.fn((action) => Observable.of(action));

            await Observable.from(consignmentActionCreator.updateConsignment(consignment)(store))
                .catch(errorHandler)
                .toArray()
                .subscribe((actions) => {
                    expect(actions).toEqual([
                        { type: ConsignmentActionType.UpdateConsignmentRequested, payload: undefined, meta: { id: consignment.id } },
                        {
                            type: ConsignmentActionType.UpdateConsignmentFailed,
                            payload: errorResponse,
                            error: true,
                            meta: { id: consignment.id },
                        },
                    ]);
                });
        });

        it('emits error actions if unable to update shipping option', async () => {
            consignmentRequestSender.updateConsignment.mockImplementation(() => Promise.reject(errorResponse));

            const errorHandler = jest.fn((action) => Observable.of(action));

            await Observable.from(consignmentActionCreator.updateConsignment(updateShippingOptionPayload)(store))
                .catch(errorHandler)
                .toArray()
                .subscribe((actions) => {
                    expect(actions).toEqual([
                        { type: ConsignmentActionType.UpdateShippingOptionRequested, payload: undefined, meta: { id: consignment.id } },
                        {
                            type: ConsignmentActionType.UpdateShippingOptionFailed,
                            payload: errorResponse,
                            error: true,
                            meta: { id: consignment.id },
                        },
                    ]);
                });
        });

        it('sends request to update consignment', async () => {
            await Observable.from(consignmentActionCreator.updateConsignment(consignment, options)(store))
                .toPromise();

            expect(consignmentRequestSender.updateConsignment).toHaveBeenCalledWith(
                'b20deef40f9699e48671bbc3fef6ca44dc80e3c7',
                consignment,
                options
            );
        });
    });

    describe('#updateAddress()', () => {
        describe('when store has no checkout data / id', () => {
            beforeEach(() => {
                store = createCheckoutStore({});
            });

            it('throws an exception, emit no actions and does not send a request', async () => {
                try {
                    actions = await Observable.from(consignmentActionCreator.updateAddress(address)(store))
                        .toPromise();
                } catch (exception) {
                    expect(exception).toBeInstanceOf(MissingDataError);
                    expect(actions).toEqual(undefined);
                    expect(consignmentRequestSender.updateConsignment).not.toHaveBeenCalled();
                }
            });
        });

        describe('when store has no cart / line items', () => {
            beforeEach(() => {
                store = createCheckoutStore({
                    checkout: getCheckoutState(),
                });
            });

            it('throws an exception, emit no actions and does not send a request', async () => {
                try {
                    actions = await Observable.from(consignmentActionCreator.updateAddress(address)(store))
                        .toPromise();
                } catch (exception) {
                    expect(exception).toBeInstanceOf(MissingDataError);
                    expect(actions).toEqual(undefined);
                    expect(consignmentRequestSender.createConsignments).not.toHaveBeenCalled();
                }
            });
        });

        it('emits actions if able to update shipping address', async () => {
            actions = await Observable.from(consignmentActionCreator.updateAddress(address)(store))
                .toArray()
                .toPromise();

            expect(actions).toEqual([
                { type: ConsignmentActionType.UpdateConsignmentRequested, meta: { id: consignment.id } },
                { type: ConsignmentActionType.UpdateConsignmentSucceeded, payload: response.body, meta: { id: consignment.id } },
            ]);
        });

        it('emits error actions if unable to update shipping address', async () => {
            consignmentRequestSender.createConsignments.mockImplementation(() => Promise.reject(errorResponse));

            const errorHandler = jest.fn((action) => Observable.of(action));

            await Observable.from(consignmentActionCreator.updateAddress(address)(store))
                .catch(errorHandler)
                .toArray()
                .subscribe((actions) => {
                    expect(actions).toEqual([
                        { type: ConsignmentActionType.CreateConsignmentsRequested },
                        { type: ConsignmentActionType.CreateConsignmentsFailed, payload: errorResponse, error: true },
                    ]);
                });
        });

        it('sends request to update shipping address in first consigment', async () => {
            await Observable.from(consignmentActionCreator.updateAddress(address, options)(store))
                .toPromise();

            expect(consignmentRequestSender.updateConsignment).toHaveBeenCalledWith(
                'b20deef40f9699e48671bbc3fef6ca44dc80e3c7',
                {
                    id: '55c96cda6f04c',
                    shippingAddress: address,
                    lineItems: [
                        {
                            itemId: '666',
                            quantity: 1,
                        },
                    ],
                },
                options
            );
        });

        it('sends request to create consigments', async () => {
            store = createCheckoutStore(omit(getCheckoutStoreState(), 'consignments'));

            await Observable.from(consignmentActionCreator.updateAddress(address, options)(store))
                .toPromise();

            expect(consignmentRequestSender.createConsignments).toHaveBeenCalledWith(
                'b20deef40f9699e48671bbc3fef6ca44dc80e3c7',
                [{
                    shippingAddress: address,
                    lineItems: [
                        {
                            itemId: '666',
                            quantity: 1,
                        },
                    ],
                }],
                options
            );
        });
    });

    describe('#selectShippingOption()', () => {
        const shippingOptionId = 'foo';

        describe('when store has no checkout data / id', () => {
            beforeEach(() => {
                store = createCheckoutStore({});
            });

            it('throws an exception, emit no actions and does not send a request', async () => {
                try {
                    actions = await Observable.from(consignmentActionCreator.selectShippingOption(shippingOptionId)(store))
                        .toPromise();
                } catch (exception) {
                    expect(exception).toBeInstanceOf(MissingDataError);
                    expect(actions).toEqual(undefined);
                    expect(consignmentRequestSender.updateConsignment).not.toHaveBeenCalled();
                }
            });
        });

        describe('when store has no shipping address', () => {
            beforeEach(() => {
                store = createCheckoutStore({
                    checkout: getCheckoutState(),
                });
            });

            it('throws an exception, emit no actions and does not send a request', async () => {
                try {
                    actions = await Observable.from(consignmentActionCreator.selectShippingOption(shippingOptionId)(store))
                        .toPromise();
                } catch (exception) {
                    expect(exception).toBeInstanceOf(MissingDataError);
                    expect(actions).toEqual(undefined);
                    expect(consignmentRequestSender.updateConsignment).not.toHaveBeenCalled();
                }
            });
        });

        it('emits actions if able to select shipping option', async () => {
            actions = await Observable.from(consignmentActionCreator.selectShippingOption(shippingOptionId)(store))
                .toArray()
                .toPromise();

            expect(actions).toEqual([
                { type: ConsignmentActionType.UpdateShippingOptionRequested, payload: undefined, meta: { id: consignment.id } },
                { type: ConsignmentActionType.UpdateShippingOptionSucceeded, payload: response.body, meta: { id: consignment.id } },
            ]);
        });

        it('emits error actions if unable to update shipping option', async () => {
            consignmentRequestSender.createConsignments.mockImplementation(() => Promise.reject(errorResponse));

            const errorHandler = jest.fn((action) => Observable.of(action));

            await Observable.from(consignmentActionCreator.selectShippingOption(shippingOptionId)(store))
                .catch(errorHandler)
                .toArray()
                .subscribe((actions) => {
                    expect(actions).toEqual([
                        { type: ConsignmentActionType.UpdateShippingOptionRequested },
                        { type: ConsignmentActionType.UpdateShippingOptionFailed, payload: errorResponse, error: true },
                    ]);
                });
        });

        it('sends request to update consignment', async () => {
            await Observable.from(consignmentActionCreator.selectShippingOption(shippingOptionId, options)(store))
                .toPromise();

            expect(consignmentRequestSender.updateConsignment).toHaveBeenCalledWith(
                'b20deef40f9699e48671bbc3fef6ca44dc80e3c7',
                {
                    id: '55c96cda6f04c',
                    shippingOptionId,
                },
                options
            );
        });
    });
});
