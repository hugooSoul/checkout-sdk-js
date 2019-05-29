import {
    CardinalEventAction,
    CardinalEventResponse,
    CardinalPaymentStep, CardinalValidatedAction,
    CardinalValidatedData,
    CardinalWindow,
    CyberSourceCardinal, Payment, PaymentType
} from './cybersource';

const CardinalWindowMock: CardinalWindow = window;

export function getCyberSourceScriptMock(): CardinalWindow {
    return {
        ... CardinalWindowMock,
        Cardinal: {
            configure: jest.fn(),
            on: jest.fn(),
            setup: jest.fn(),
            trigger: jest.fn(),
            continue: jest.fn(),
        },
    };
}

export function getCyberSourceCardinal(): CyberSourceCardinal {
    return {
        configure: jest.fn(),
        on: jest.fn(),
        setup: jest.fn(),
        trigger: jest.fn(),
        continue: jest.fn(),
    };
}

export function getCardinalValidatedData(): CardinalValidatedData {
    return {
        ActionCode: CardinalValidatedAction.NOACTION,
        ErrorDescription: 'error',
        ErrorNumber: 12,
        Validated: true,
        Payment: {
            ProcessorTransactionId: '',
            Type: PaymentType.CCA,
        }
    }
}
