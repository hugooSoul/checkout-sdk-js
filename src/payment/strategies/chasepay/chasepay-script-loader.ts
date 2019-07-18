import { ScriptLoader } from '@bigcommerce/script-loader';

import { StandardError } from '../../../common/error/errors';
import { ChasePayHostWindow, JPMC } from '../chasepay/chasepay';

export default class ChasePayScriptLoader {
    constructor(
        private _scriptLoader: ScriptLoader,
        public _window: ChasePayHostWindow = window
    ) {}

    load(testMode?: boolean): Promise<JPMC> {
        return this._scriptLoader
            .loadScript(`//pwc${testMode ? 'psb' : ''}.chase.com/pwc/checkout/js/v20170521/list.action?type=raw&applId=PWC&channelId=CWC&version=1`)
            .then(() => {
                if (!this._window.JPMC) {
                    throw new StandardError();
                }

                return this._window.JPMC;
            });
    }
}
