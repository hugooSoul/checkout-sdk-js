import { find, reject } from 'lodash';

import { FormField } from '../form';
import { getFormFields } from '../form/form.mocks';
import { getUnitedStates } from '../geography/countries.mock';
import { getAustralia } from '../shipping/shipping-countries.mock';
import { getShippingOptions } from '../shipping/shipping-options.mock';

import CheckoutStoreSelector from './checkout-store-selector';
import CheckoutStoreState from './checkout-store-state';
import { getCheckoutStoreStateWithOrder } from './checkouts.mock';
import createInternalCheckoutSelectors from './create-internal-checkout-selectors';
import InternalCheckoutSelectors from './internal-checkout-selectors';

describe('CheckoutStoreSelector', () => {
    let state: CheckoutStoreState;
    let internalSelectors: InternalCheckoutSelectors;
    let selector: CheckoutStoreSelector;

    beforeEach(() => {
        state = getCheckoutStoreStateWithOrder();
        internalSelectors = createInternalCheckoutSelectors(state);
        selector = new CheckoutStoreSelector(internalSelectors);
    });

    it('returns checkout data', () => {
        expect(selector.getCheckout()).toEqual(internalSelectors.checkout.getCheckout());
    });

    it('returns order', () => {
        expect(selector.getOrder()).toEqual(internalSelectors.order.getOrder());
    });

    it('returns config', () => {
        expect(selector.getConfig()).toEqual(internalSelectors.config.getStoreConfig());
    });

    it('returns shipping options', () => {
        expect(selector.getShippingOptions()).toEqual(getShippingOptions());
    });

    it('returns consignments', () => {
        expect(selector.getConsignments()).toEqual(internalSelectors.consignments.getConsignments());
    });

    it('returns shipping countries', () => {
        expect(selector.getShippingCountries()).toEqual(internalSelectors.shippingCountries.getShippingCountries());
    });

    it('returns billing countries', () => {
        expect(selector.getBillingCountries()).toEqual(internalSelectors.countries.getCountries());
    });

    it('returns payment methods', () => {
        expect(selector.getPaymentMethods()).toEqual(internalSelectors.paymentMethods.getPaymentMethods());
    });

    it('returns payment method', () => {
        expect(selector.getPaymentMethod('braintree')).toEqual(internalSelectors.paymentMethods.getPaymentMethod('braintree'));
    });

    it('returns cart', () => {
        expect(selector.getCart()).toEqual(internalSelectors.cart.getCart());
    });

    it('returns customer', () => {
        expect(selector.getCustomer()).toEqual(internalSelectors.customer.getCustomer());
    });

    it('returns billing address', () => {
        expect(selector.getBillingAddress()).toEqual(internalSelectors.billingAddress.getBillingAddress());
    });

    describe('#getShippingAddress()', () => {
        it('returns shipping address', () => {
            expect(selector.getShippingAddress()).toEqual(internalSelectors.shippingAddress.getShippingAddress());
        });

        it('returns geo-ip dummy shipping address', () => {
            jest.spyOn(internalSelectors.shippingAddress, 'getShippingAddress').mockReturnValue(undefined);

            expect(selector.getShippingAddress()).toEqual({
                address1: '',
                address2: '',
                city: '',
                company: '',
                country: '',
                customFields: [],
                firstName: '',
                lastName: '',
                phone: '',
                postalCode: '',
                stateOrProvince: '',
                stateOrProvinceCode: '',
                countryCode: 'AU',
            });
        });

        it('returns undefined if shippingAddress & geoIp are not present', () => {
            jest.spyOn(internalSelectors.shippingAddress, 'getShippingAddress').mockReturnValue(undefined);
            jest.spyOn(internalSelectors.config, 'getContextConfig').mockReturnValue(undefined);

            expect(selector.getShippingAddress()).toBeUndefined();
        });
    });

    it('returns instruments', () => {
        expect(selector.getInstruments()).toEqual(internalSelectors.instruments.getInstruments());
    });

    it('returns flag indicating if payment is submitted', () => {
        expect(selector.isPaymentDataSubmitted('braintree')).toEqual(true);
    });

    it('returns shipping address fields', () => {
        const results = selector.getShippingAddressFields('AU');
        const predicate = ({ name }: FormField) => name === 'stateOrProvince' || name === 'stateOrProvinceCode' || name === 'countryCode';
        const field = find(results, { name: 'stateOrProvinceCode' });

        expect(reject(results, predicate)).toEqual(reject(getFormFields(), predicate));
        expect(field && field.options && field.options.items)
            .toEqual(getAustralia().subdivisions.map(({ code, name }) => ({ label: name, value: code })));
    });

    it('returns billing address fields', () => {
        const results = selector.getBillingAddressFields('US');
        const predicate = ({ name }: FormField) => name === 'stateOrProvince' || name === 'stateOrProvinceCode' || name === 'countryCode';
        const field = find(results, { name: 'stateOrProvinceCode' });

        expect(reject(results, predicate)).toEqual(reject(getFormFields(), predicate));
        expect(field && field.options && field.options.items)
            .toEqual(getUnitedStates().subdivisions.map(({ code, name }) => ({ label: name, value: code })));
    });

    it('changes to the public objects do not affect the private copy', () => {
        const publicCheckout = selector.getCheckout();
        const privateCheckout = internalSelectors.checkout.getCheckout();

        // tslint:disable-next-line:no-non-null-assertion
        publicCheckout!.customer.email = 'should@notchange.com';

        // tslint:disable-next-line:no-non-null-assertion
        expect(privateCheckout!.customer.email).not.toEqual('should@notchange.com');
    });
});
