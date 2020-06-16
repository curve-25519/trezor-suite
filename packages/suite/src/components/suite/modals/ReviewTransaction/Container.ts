import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { useForm } from 'react-hook-form';
import { SendContext } from '@wallet-hooks/useSendContext';
import { TokenInfo, PrecomposedTransaction } from 'trezor-connect';
import * as modalActions from '@suite-actions/modalActions';

import { AppState, Dispatch } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    account: state.wallet.selectedAccount.account,
    device: state.suite.device,
    suite: state.suite,
    fiat: state.wallet.fiat,
    settings: state.wallet.settings,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    modalActions: bindActionCreators(modalActions, dispatch),
});

interface ComponentProps {
    transactionInfo: PrecomposedTransaction;
    outputs: SendContext['outputs'];
    token: TokenInfo | null;
    getValues: ReturnType<typeof useForm>['getValues'];
    selectedFee: SendContext['selectedFee'];
}

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps & ComponentProps;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
