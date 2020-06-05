import { useContext, createContext } from 'react';
import { Account } from '@wallet-types';

interface Output {
    id: number;
    address: string;
    amount: string;
    setMax: boolean;
    fiatValue: string;
    localCurrency: { value: string; label: string };
}

interface SendContext {
    account: Account;
    selectedFee: { value: string; label: string };
    outputs: Output[];
    isAdditionalFormVisible: boolean;
}

export const SendContext = createContext<SendContext | null>(null);

export const useSendContext = () => {
    const sendContext = useContext(SendContext);
    if (sendContext == null) throw Error('sendContext: Please provide sendContext value.');
    return sendContext;
};
