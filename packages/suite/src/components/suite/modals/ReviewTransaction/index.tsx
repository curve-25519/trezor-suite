import { AccountLabeling, FiatValue, Translation } from '@suite-components';
import { useDeviceActionLocks, useActions } from '@suite-hooks';
import * as notificationActions from '@suite-actions/notificationActions';
import * as accountActions from '@wallet-actions/accountActions';
import { Button, colors, Modal, variables } from '@trezor/components';
import { XRP_FLAG } from '@wallet-constants/sendForm';
import { Account } from '@wallet-types';
import { formatNetworkAmount, networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import React from 'react';
import styled from 'styled-components';
import TrezorConnect, { RipplePayment } from 'trezor-connect';
import { fromWei, toWei } from 'web3-utils';

import { Props } from './Container';

const Box = styled.div`
    height: 46px;
    border-radius: 3px;
    border: solid 2px ${colors.BLACK96};
    display: flex;
    align-items: center;
    padding: 12px;
    margin-bottom: 10px;
`;

const Symbol = styled.div`
    margin-right: 4px;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    min-width: 80px;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Value = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.NORMAL};
    align-items: center;
    flex: 1;
`;

const Content = styled.div`
    margin-top: 16px;
`;

const OutputWrapper = styled.div`
    background: ${colors.BLACK96};
    border-radius: 3px;
`;

const Buttons = styled.div`
    display: flex;
    width: 100%;
    margin-top: 24px;
    justify-content: space-between;
`;

const FiatValueWrapper = styled.div`
    margin-left: 10px;
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

const getFeeValue = (
    transactionInfo: any,
    networkType: Account['networkType'],
    symbol: Account['symbol'],
) => {
    if (networkType === 'ethereum') {
        const gasPriceInWei = toWei(transactionInfo.feePerUnit, 'gwei');
        return fromWei(gasPriceInWei, 'ether');
    }

    return formatNetworkAmount(transactionInfo.fee, symbol);
};

export default ({
    modalActions,
    account,
    getValues,
    token,
    selectedFee,
    outputs,
    transactionInfo,
    device,
}: Props) => {
    if (!account) return null;
    const { networkType, symbol } = account;
    if (!transactionInfo || transactionInfo.type === 'error') return null;
    const upperCaseSymbol = account.symbol.toUpperCase();
    const outputSymbol = token ? token.symbol!.toUpperCase() : symbol.toUpperCase();
    const [isEnabled] = useDeviceActionLocks();
    const { addToast } = useActions({ addToast: notificationActions.addToast });
    const { fetchAndUpdateAccount } = useActions({
        fetchAndUpdateAccount: accountActions.fetchAndUpdateAccount,
    });
    const fee = getFeeValue(transactionInfo, networkType, symbol);
    const totalSpent = formatNetworkAmount(transactionInfo.totalSpent, symbol);

    return (
        <Modal
            size="large"
            cancelable
            onCancel={isEnabled ? modalActions.onCancel : () => {}}
            heading={<Translation id="TR_MODAL_CONFIRM_TX_TITLE" />}
            bottomBar={
                <Buttons>
                    <Button
                        icon="ARROW_LEFT"
                        variant="secondary"
                        isDisabled={!isEnabled}
                        onClick={() => modalActions.onCancel()}
                    >
                        <Translation id="TR_EDIT" />
                    </Button>
                    <Button
                        isDisabled={!isEnabled}
                        onClick={async () => {
                            switch (networkType) {
                                case 'bitcoin':
                                    console.log('send');
                                    break;
                                case 'ethereum':
                                    console.log('send');
                                    break;
                                case 'ripple': {
                                    const { symbol, networkType } = account;
                                    if (networkType !== 'ripple' || !device) return null;

                                    const amount = getValues('amount-0');
                                    const address = getValues('address-0');
                                    const destinationTag = getValues('rippleDestinationTag');
                                    const { path, instance, state, useEmptyPassphrase } = device;

                                    const payment: RipplePayment = {
                                        destination: address,
                                        amount: networkAmountToSatoshi(amount, symbol),
                                    };

                                    if (destinationTag) {
                                        payment.destinationTag = parseInt(destinationTag, 10);
                                    }

                                    const signedTx = await TrezorConnect.rippleSignTransaction({
                                        device: {
                                            path,
                                            instance,
                                            state,
                                        },
                                        useEmptyPassphrase,
                                        path: account.path,
                                        transaction: {
                                            fee: selectedFee.feePerUnit,
                                            flags: XRP_FLAG,
                                            sequence: account.misc.sequence,
                                            payment,
                                        },
                                    });

                                    if (!signedTx.success) {
                                        addToast({
                                            type: 'sign-tx-error',
                                            error: signedTx.payload.error,
                                        });
                                        return;
                                    }

                                    // TODO: add possibility to show serialized tx without pushing (locktime)
                                    const sentTx = await TrezorConnect.pushTransaction({
                                        tx: signedTx.payload.serializedTx,
                                        coin: account.symbol,
                                    });

                                    if (sentTx.success) {
                                        addToast({
                                            type: 'tx-sent',
                                            formattedAmount: `${amount} ${account.symbol.toUpperCase()}`,
                                            device,
                                            descriptor: account.descriptor,
                                            symbol: account.symbol,
                                            txid: sentTx.payload.txid,
                                        });

                                        fetchAndUpdateAccount(account);
                                    } else {
                                        addToast({
                                            type: 'sign-tx-error',
                                            error: sentTx.payload.error,
                                        });
                                    }
                                    break;
                                } // no default
                            }
                        }}
                    >
                        <Translation id="TR_MODAL_CONFIRM_TX_BUTTON" />
                    </Button>
                </Buttons>
            }
        >
            <Content>
                <Box>
                    <Label>
                        <Translation id="TR_ADDRESS_FROM" />
                    </Label>
                    <Value>
                        <Symbol>{upperCaseSymbol}</Symbol> <AccountLabeling account={account} />
                    </Value>
                </Box>
                {outputs.map((output, index) => (
                    <OutputWrapper key={output.id}>
                        <Box>
                            <Label>
                                <Translation id="TR_TO" />
                            </Label>
                            <Value>{getValues(`address-${index}`)}</Value>
                        </Box>
                    </OutputWrapper>
                ))}
                <Box>
                    <Label>
                        <Translation id="TR_TOTAL_AMOUNT" />
                    </Label>
                    <Value>
                        {totalSpent} {outputSymbol}
                        <FiatValueWrapper>
                            <FiatValue
                                amount={totalSpent}
                                symbol={symbol}
                                badge={{ color: 'gray' }}
                            />
                        </FiatValueWrapper>
                    </Value>
                </Box>
                <Box>
                    <Label>
                        {networkType === 'ethereum' ? (
                            <Translation id="TR_GAS_PRICE" />
                        ) : (
                            <Translation id="TR_INCLUDING_FEE" />
                        )}
                    </Label>
                    <Value>
                        {fee} {outputSymbol}
                        <FiatValueWrapper>
                            <FiatValue amount={fee} symbol={symbol} badge={{ color: 'gray' }} />
                        </FiatValueWrapper>
                    </Value>
                </Box>
            </Content>
        </Modal>
    );
};
