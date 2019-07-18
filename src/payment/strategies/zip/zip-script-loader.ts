import { ScriptLoader } from '@bigcommerce/script-loader';

import { StandardError } from '../../../common/error/errors';
import { Zip, ZipHostWindow } from '../zip/zip';

export default class ZipScriptLoader {
    constructor(
        private _scriptLoader: ScriptLoader,
        public _window: ZipHostWindow = window
    ) {}

    load(): Promise<Zip> {
        return this._scriptLoader
            .loadScript(`//static.zipmoney.com.au/checkout/checkout-v1.min.js`)
            .then(() => {
                if (!this._window.Zip) {
                    throw new StandardError();
                }

                return this._window.Zip;
            });
    }
}
