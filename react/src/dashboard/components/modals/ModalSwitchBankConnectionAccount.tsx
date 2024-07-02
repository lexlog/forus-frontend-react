import React from 'react';
import { ModalState } from '../../modules/modals/context/ModalContext';
import useFormBuilder from '../../hooks/useFormBuilder';
import usePushSuccess from '../../hooks/usePushSuccess';
import { useBankConnectionService } from '../../services/BankConnectionService';
import BankConnection from '../../props/models/BankConnection';
import SelectControlOptions from '../elements/select-control/templates/SelectControlOptions';
import SelectControl from '../elements/select-control/SelectControl';
import FormError from '../elements/forms/errors/FormError';
import { ResponseError } from '../../props/ApiResponses';

export default function ModalSwitchBankConnectionAccount({
    modal,
    className,
    bankConnection,
    onChange,
}: {
    modal: ModalState;
    className?: string;
    bankConnection: BankConnection;
    onChange: (connection: BankConnection) => void;
}) {
    const pushSuccess = usePushSuccess();
    const bankConnectionService = useBankConnectionService();

    const form = useFormBuilder(
        {
            bank_connection_account_id: bankConnection?.account_default?.id,
        },
        () => {
            bankConnectionService
                .update(bankConnection.organization_id, bankConnection.id, form.values)
                .then((res) => {
                    onChange(res.data.data);
                    pushSuccess('Succes!', 'Het actieve bankaccount is gewijzigd!');
                    modal.close();
                })
                .catch((err: ResponseError) => form.setErrors(err?.data?.errors))
                .finally(() => form.setIsLocked(false));
        },
    );

    return (
        <div className={`modal modal-sm modal-animated ${modal.loading ? 'modal-loading' : ''} ${className}`}>
            <div className="modal-backdrop" onClick={modal.close} />
            <div className="modal-window">
                <form className="form" onSubmit={form.submit}>
                    <a className="mdi mdi-close modal-close" onClick={modal.close} role="button" />
                    <div className="modal-header">Selecteer bankrekeningnummer</div>
                    <div className="modal-body modal-body-visible">
                        <div className="modal-section">
                            <div className="form-group">
                                <label className="form-label" htmlFor="bank_connection_account_id">
                                    IBAN
                                </label>

                                <SelectControl
                                    value={form.values.bank_connection_account_id}
                                    propValue={'monetary_account_iban'}
                                    propKey={'id'}
                                    onChange={(bank_connection_account_id: number) => {
                                        form.update({ bank_connection_account_id });
                                    }}
                                    options={bankConnection.accounts}
                                    allowSearch={false}
                                    optionsComponent={SelectControlOptions}
                                />

                                <FormError error={form.errors?.bank_connection_account_id} />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer text-center">
                        <button type="submit" className="button button-primary">
                            Bevestigen
                        </button>

                        <button type="button" className="button button-default" onClick={modal.close}>
                            Annuleren
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
