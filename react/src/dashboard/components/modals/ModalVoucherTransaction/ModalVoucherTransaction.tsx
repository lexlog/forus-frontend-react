import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ModalState } from '../../../modules/modals/context/ModalContext';
import { hasPermission } from '../../../helpers/utils';
import useFormBuilder from '../../../hooks/useFormBuilder';
import Voucher from '../../../props/models/Voucher';
import Organization from '../../../props/models/Organization';
import { useFundService } from '../../../services/FundService';
import Fund from '../../../props/models/Fund';
import { useOrganizationService } from '../../../services/OrganizationService';
import { useReimbursementsService } from '../../../services/ReimbursementService';
import useVoucherService from '../../../services/VoucherService';
import usePushDanger from '../../../hooks/usePushDanger';
import SelectControl from '../../elements/select-control/SelectControl';
import SelectControlOptions from '../../elements/select-control/templates/SelectControlOptions';
import FormError from '../../elements/forms/errors/FormError';
import { currencyFormat } from '../../../helpers/string';
import ModalVoucherTransactionPreview from './ModalVoucherTransactionPreview';
import Reimbursement from '../../../props/models/Reimbursement';
import useSetProgress from '../../../hooks/useSetProgress';
import useTranslate from '../../../hooks/useTranslate';

type ReimbursementLocale = Partial<Reimbursement & { id?: number; name: string }>;

export default function ModalVoucherTransaction({
    modal,
    target,
    voucher,
    onCreated,
    className,
    organization,
}: {
    modal: ModalState;
    target?: string;
    voucher: Voucher;
    onCreated: () => void;
    className?: string;
    organization: Organization;
}) {
    const translate = useTranslate();

    const pushDanger = usePushDanger();
    const setProgress = useSetProgress();

    const fundService = useFundService();
    const voucherService = useVoucherService();
    const organizationService = useOrganizationService();
    const reimbursementService = useReimbursementsService();

    const [fund, setFund] = useState<Fund>(null);
    const [state, setState] = useState<'form' | 'finish' | 'preview'>('form');
    const [providers, setProviders] = useState<Array<Partial<Organization>>>([]);
    const [reimbursements, setReimbursements] = useState<Array<ReimbursementLocale>>([]);
    const [reimbursement, setReimbursement] = useState<ReimbursementLocale>(null);

    const ibanSources = useMemo(() => {
        const manualSource = {
            key: 'manual',
            name: translate('modals.modal_voucher_transaction.labels.manual_source'),
        };

        const reimbursementSource = {
            key: 'reimbursement',
            name: translate('modals.modal_voucher_transaction.labels.reimbursement_source'),
        };

        return [manualSource, ...(reimbursements?.length > 0 ? [reimbursementSource] : [])];
    }, [reimbursements?.length, translate]);

    const targets = useMemo(() => {
        const targetProvider = {
            key: 'provider',
            name: translate(`modals.modal_voucher_transaction.labels.target_provider_option`),
        };

        const targetDirect = {
            key: 'iban',
            name: translate('modals.modal_voucher_transaction.labels.target_iban_option'),
        };

        return [targetProvider, fund?.allow_direct_payments ? targetDirect : null].filter((target) => target);
    }, [fund?.allow_direct_payments, translate]);

    const canUseReimbursements = useMemo(() => {
        return (
            fund?.allow_reimbursements &&
            fund?.allow_direct_payments &&
            hasPermission(organization, 'manage_reimbursements')
        );
    }, [fund?.allow_direct_payments, fund?.allow_reimbursements, organization]);

    const amountLimit = useMemo(() => {
        if (!fund) {
            return null;
        }

        if (target === 'top_up') {
            return Math.min(
                parseFloat(fund?.limit_voucher_top_up_amount),
                parseFloat(fund?.limit_voucher_total_amount) - parseFloat(voucher.amount_total),
            );
        }

        return voucher.amount_available;
    }, [fund, target, voucher]);

    const form = useFormBuilder<{
        target?: string;
        target_iban?: string;
        target_name?: string;
        note?: string;
        note_shared?: boolean;
        amount?: string;
        voucher_id?: number;
        organization_id?: number;
        iban_source?: 'manual' | 'reimbursement';
        reimbursement_id?: number;
        target_reimbursement_id?: number;
    }>(
        {
            note: '',
            note_shared: false,
            amount: null,
            target: target || targets[0]?.key,
            voucher_id: voucher.id,
            organization_id: providers[0]?.id,
            iban_source: 'manual',
            reimbursement_id: null,
        },

        (values) => {
            const { note, note_shared, amount, target, voucher_id } = values;
            const data = { note, note_shared, amount, target, voucher_id };

            if (target === 'provider') {
                Object.assign(data, { organization_id: values.organization_id });
            } else if (form.values.target === 'iban') {
                const { iban_source, target_iban, target_name } = form.values;
                const target_reimbursement_id = reimbursement?.id || null;

                if (iban_source == 'manual') {
                    Object.assign(data, { target_iban, target_name });
                }

                if (iban_source == 'reimbursement') {
                    Object.assign(data, { target_reimbursement_id });
                }
            }

            setProgress(0);

            voucherService
                .makeSponsorTransaction(organization.id, data)
                .then(() => {
                    setState('finish');
                    onCreated?.();
                })
                .catch((res) => {
                    form.setErrors(res.data.errors);
                    setState('form');
                    pushDanger('Mislukt!', res.data.message);
                })
                .finally(() => {
                    setProgress(100);
                    form.setIsLocked(false);
                });
        },
    );

    const { update: updateForm } = form;

    const submitButtonDisabled = useMemo(() => {
        const { target, organization_id, target_iban, target_name } = form.values;
        const { amount, iban_source } = form.values;

        if (target === 'provider') {
            return !organization_id || !amount || parseFloat(amount) === 0;
        }

        if (target === 'top_up') {
            return !amount || parseFloat(amount) === 0;
        }

        if (target === 'iban') {
            return iban_source === 'manual' ? !target_iban || !target_name || !amount : !reimbursement?.id || !amount;
        }

        return true;
    }, [form.values, reimbursement?.id]);

    const fetchProviders = useCallback(() => {
        organizationService
            .providerOrganizations(organization.id, {
                state: 'accepted',
                resource_type: 'select',
                fund_id: voucher.fund_id,
                allow_budget: 1,
                per_page: 1000,
            })
            .then((res) => {
                const list =
                    res.data.data.length == 1
                        ? res.data.data
                        : [{ id: null, name: 'Selecteer aanbieder' }, ...res.data.data];

                setProviders(list);
                updateForm({ organization_id: list[0]?.id });
            });
    }, [organization.id, organizationService, voucher.fund_id, updateForm]);

    const fetchReimbursements = useCallback(() => {
        reimbursementService
            .list(organization.id, {
                fund_id: voucher.fund_id,
                identity_address: voucher.identity_address,
                state: 'approved',
                per_page: 100,
            })
            .then((res) => {
                const list = [
                    { id: null, name: 'Selecteer declaratie' },
                    ...res.data.data.map((item) => ({ ...item, name: `NR: ${item.code} IBAN: ${item.iban}` })),
                ];

                setReimbursements(list);
                setReimbursement(list[0]);
            });
    }, [organization.id, reimbursementService, voucher.fund_id, voucher.identity_address]);

    const fetchVoucherFund = useCallback(() => {
        setProgress(0);

        fundService
            .read(voucher.fund.organization_id, voucher.fund_id)
            .then((res) => setFund(res.data.data))
            .finally(() => setProgress(100));
    }, [fundService, setProgress, voucher]);

    useEffect(() => {
        if (canUseReimbursements) {
            fetchReimbursements();
        }
    }, [canUseReimbursements, fetchReimbursements]);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    useEffect(() => {
        fetchVoucherFund();
    }, [fetchVoucherFund]);

    return (
        <div
            className={`modal modal-md modal-animated modal-voucher-transaction ${
                modal.loading ? 'modal-loading' : ''
            } ${className || ''}`}>
            <div className="modal-backdrop" onClick={modal.close} />

            {state == 'form' && (
                <form className="modal-window form" onSubmit={() => setState('preview')}>
                    <a className="mdi mdi-close modal-close" onClick={modal.close} role="button" />
                    {form.values.target !== 'top_up' ? (
                        <div className="modal-header">{translate('modals.modal_voucher_transaction.title')}</div>
                    ) : (
                        <div className="modal-header">{translate('modals.modal_voucher_transaction.top_up_title')}</div>
                    )}

                    <div className="modal-body modal-body-visible">
                        <div className="modal-section modal-section-pad">
                            {targets.length > 1 && form.values.target !== 'top_up' && (
                                <div className="form-group form-group-inline form-group-inline-md">
                                    <div className="form-label form-label-required">
                                        {translate('modals.modal_voucher_transaction.labels.target')}
                                    </div>
                                    <SelectControl
                                        className="form-control"
                                        value={form.values.target}
                                        propKey={'key'}
                                        options={targets}
                                        allowSearch={false}
                                        optionsComponent={SelectControlOptions}
                                        onChange={(target: string) => {
                                            form.update({ target });
                                        }}
                                    />
                                    <FormError error={form.errors?.target} />
                                </div>
                            )}

                            {form.values.target === 'provider' && (
                                <div className="form-group form-group-inline form-group-inline-md">
                                    <div className="form-label form-label-required">
                                        {translate('modals.modal_voucher_transaction.labels.provider')}
                                    </div>
                                    <SelectControl
                                        className={'form-control'}
                                        value={form.values?.organization_id}
                                        propKey={'id'}
                                        propValue={'name'}
                                        allowSearch={true}
                                        options={providers}
                                        optionsComponent={SelectControlOptions}
                                        onChange={(organization_id: number) => form.update({ organization_id })}
                                    />
                                    <FormError error={form.errors?.organization_id} />
                                </div>
                            )}

                            {ibanSources && canUseReimbursements && form.values.target === 'iban' && (
                                <div className="form-group form-group-inline form-group-inline-md">
                                    <div className="form-label form-label-required">
                                        {translate('modals.modal_voucher_transaction.labels.iban_source')}
                                    </div>
                                    <SelectControl
                                        className="form-control"
                                        value={form.values.iban_source}
                                        propKey={'key'}
                                        options={ibanSources}
                                        allowSearch={false}
                                        optionsComponent={SelectControlOptions}
                                        onChange={(iban_source: 'manual' | 'reimbursement') => {
                                            form.update({ iban_source: iban_source });
                                        }}
                                    />
                                    <FormError error={form.errors?.iban_source} />
                                </div>
                            )}

                            {ibanSources &&
                                form.values.iban_source === 'reimbursement' &&
                                form.values.target === 'iban' && (
                                    <div className="form-group form-group-inline form-group-inline-md">
                                        <div className="form-label form-label-required">
                                            {translate('modals.modal_voucher_transaction.labels.reimbursement')}
                                        </div>
                                        <SelectControl
                                            className="form-control"
                                            value={reimbursement}
                                            options={reimbursements}
                                            allowSearch={false}
                                            optionsComponent={SelectControlOptions}
                                            onChange={setReimbursement}
                                        />
                                        <FormError error={form.errors?.iban_source} />
                                    </div>
                                )}

                            {form.values.target === 'iban' &&
                                (form.values.iban_source === 'manual' || reimbursement?.id) && (
                                    <div className="form-group form-group-inline form-group-inline-md">
                                        <div className="form-label form-label-required">
                                            {translate('modals.modal_voucher_transaction.labels.target_iban')}
                                        </div>
                                        <div className="form-offset">
                                            {form.values.iban_source === 'manual' ? (
                                                <input
                                                    type={'text'}
                                                    className="form-control"
                                                    defaultValue={form.values.target_iban || ''}
                                                    placeholder="IBAN-nummer"
                                                    onChange={(e) => form.update({ target_iban: e.target.value })}
                                                />
                                            ) : (
                                                <input
                                                    type={'text'}
                                                    className="form-control"
                                                    value={reimbursement.iban || ''}
                                                    disabled={true}
                                                />
                                            )}

                                            <FormError error={form.errors?.target_iban} />
                                        </div>
                                    </div>
                                )}

                            {form.values.target === 'iban' &&
                                (form.values.iban_source === 'manual' || reimbursement?.id) && (
                                    <div className="form-group form-group-inline form-group-inline-md">
                                        <div className="form-label form-label-required">
                                            {translate('modals.modal_voucher_transaction.labels.target_name')}
                                        </div>
                                        <div className="form-offset">
                                            {form.values.iban_source === 'manual' ? (
                                                <input
                                                    type={'text'}
                                                    className="form-control"
                                                    defaultValue={form.values.target_name || ''}
                                                    placeholder="IBAN-naam"
                                                    onChange={(e) => form.update({ target_name: e.target.value })}
                                                />
                                            ) : (
                                                <input
                                                    type={'text'}
                                                    className="form-control"
                                                    value={reimbursement.iban_name || ''}
                                                    disabled={true}
                                                />
                                            )}

                                            <FormError error={form.errors?.target_name} />
                                        </div>
                                    </div>
                                )}

                            <div className="form-group form-group-inline form-group-inline-md">
                                <div className="form-label form-label-required">
                                    {translate('modals.modal_voucher_transaction.labels.amount')}
                                </div>
                                <div className="form-offset">
                                    <input
                                        className="form-control"
                                        type="number"
                                        value={form.values.amount || ''}
                                        step=".01"
                                        min=".02"
                                        max={amountLimit}
                                        placeholder={translate('modals.modal_voucher_transaction.labels.amount')}
                                        onChange={(e) => form.update({ amount: e.target.value })}
                                    />
                                    {!form.errors?.amount ? (
                                        <div className="form-hint">
                                            Limiet {currencyFormat(parseFloat(amountLimit?.toString()))}
                                        </div>
                                    ) : (
                                        <FormError error={form.errors?.amount} />
                                    )}
                                </div>
                                <FormError error={form.errors?.amount} />
                            </div>

                            <div className="form-group form-group-inline form-group-inline-md">
                                <div className="form-label">
                                    {translate('modals.modal_voucher_transaction.labels.note')}
                                </div>
                                <div className="form-offset">
                                    <textarea
                                        className="form-control r-n"
                                        value={form.values.note}
                                        placeholder={translate('modals.modal_voucher_transaction.labels.note')}
                                        onChange={(e) => form.update({ note: e.target.value })}
                                    />
                                    {!form.errors?.note ? (
                                        <div className="form-hint">Max. 255 tekens</div>
                                    ) : (
                                        <FormError error={form.errors?.note} />
                                    )}
                                </div>
                                <FormError error={form.errors?.note} />
                            </div>

                            <div className="form-group form-group-inline form-group-inline-md">
                                <div className="form-label" />
                                <div className="form-offset">
                                    <label className="checkbox">
                                        <input
                                            type="checkbox"
                                            checked={form.values.note_shared}
                                            onChange={(e) => form.update({ note_shared: e.target.checked })}
                                        />
                                        <div className="checkbox-label">
                                            <div className="checkbox-box">
                                                <div className="mdi mdi-check" />
                                            </div>
                                            {translate('modals.modal_voucher_transaction.labels.note_shared')}
                                        </div>
                                    </label>
                                </div>
                                <FormError error={form.errors?.note_shared} />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer text-center">
                        <button type="button" className="button button-default" onClick={modal.close}>
                            {translate('modals.modal_voucher_transaction.buttons.cancel')}
                        </button>
                        <button type="submit" className="button button-primary" disabled={submitButtonDisabled}>
                            {translate('modals.modal_voucher_transaction.buttons.submit')}
                        </button>
                    </div>
                </form>
            )}

            {state == 'preview' && (
                <div className="modal-window">
                    <div className="modal-close mdi mdi-close" onClick={modal.close} role="button" />
                    <div className="modal-icon modal-icon-primary">
                        <div className="mdi mdi-alert-outline" />
                    </div>

                    <div className="modal-body form">
                        <div className="modal-section">
                            <div className="modal-heading text-center">
                                {translate('modals.modal_voucher_transaction.preview.title')}
                            </div>
                        </div>

                        <ModalVoucherTransactionPreview
                            formValues={form.values}
                            providers={providers}
                            organization={organization}
                            reimbursement={reimbursement}
                        />

                        <div className="modal-section">
                            <div className="modal-text text-center">
                                {translate('modals.modal_voucher_transaction.preview.description')}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer modal-footer-light text-center">
                        <button type="button" className="button button-default" onClick={() => setState('form')}>
                            {translate('modals.modal_voucher_transaction.buttons.cancel')}
                        </button>

                        <button type="button" className="button button-primary" onClick={() => form.submit()}>
                            {translate('modals.modal_voucher_transaction.buttons.submit')}
                        </button>
                    </div>
                </div>
            )}

            {state == 'finish' && (
                <div className="modal-window">
                    <div className="modal-close mdi mdi-close" onClick={modal.close} role="button" />
                    <div className="modal-icon modal-icon-primary">
                        <div className="mdi mdi-check-circle-outline" />
                    </div>

                    <div className="modal-body form">
                        {form.values.target !== 'top_up' ? (
                            <div className="modal-section text-center">
                                <div className="modal-heading">
                                    {translate('modals.modal_voucher_transaction.success.title')}
                                </div>
                                <div className="modal-text">
                                    {translate('modals.modal_voucher_transaction.success.description')}
                                </div>
                            </div>
                        ) : (
                            <div className="modal-section text-center">
                                <div className="modal-heading">
                                    {translate('modals.modal_voucher_transaction.success.top_up_title')}
                                </div>
                                <div className="modal-text">
                                    {translate('modals.modal_voucher_transaction.success.top_up_description')}
                                </div>
                            </div>
                        )}

                        <ModalVoucherTransactionPreview
                            formValues={form.values}
                            organization={organization}
                            providers={providers}
                            reimbursement={reimbursement}
                        />
                    </div>

                    <div className="modal-footer modal-footer-light text-centers">
                        <button type="button" className="button button-primary" onClick={modal.close}>
                            {translate('modals.modal_voucher_transaction.buttons.close')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
