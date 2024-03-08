import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import { useTranslation } from 'react-i18next';
import useTransactionBulkService from '../../../services/TransactionBulkService';
import useSetProgress from '../../../hooks/useSetProgress';
import useEnvData from '../../../hooks/useEnvData';
import LoadingCard from '../../elements/loading-card/LoadingCard';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import { useParams } from 'react-router-dom';
import KeyValueItem from '../../elements/key-value/KeyValueItem';
import Tooltip from '../../elements/tooltip/Tooltip';
import TransactionBulk from '../../../props/models/TransactionBulk';
import ModalDangerZone from '../../modals/ModalDangerZone';
import useOpenModal from '../../../hooks/useOpenModal';
import usePushDanger from '../../../hooks/usePushDanger';
import usePushSuccess from '../../../hooks/usePushSuccess';
import { hasPermission } from '../../../helpers/utils';
import { BooleanParam, StringParam, useQueryParams } from 'use-query-params';
import useMakeExporterService from '../../../services/exports/useMakeExporterService';
import TransactionBulkTransactionsTable from './elements/TransactionBulkTransactionsTable';
import Bank from '../../../props/models/Bank';
import { ResponseError } from '../../../props/ApiResponses';

export default function TransactionBulksView() {
    const { t } = useTranslation();
    const envData = useEnvData();
    const activeOrganization = useActiveOrganization();

    const openModal = useOpenModal();
    const pushDanger = usePushDanger();
    const pushSuccess = usePushSuccess();
    const setProgress = useSetProgress();

    const transactionBulkService = useTransactionBulkService();
    const exporterService = useMakeExporterService();

    const bulkId = parseInt(useParams().id);

    const [transactionBulk, setTransactionBulk] = useState<TransactionBulk>(null);
    const [resettingBulk, setResettingBulk] = useState(false);
    const [submittingBulk, setSubmittingBulk] = useState(false);

    const isSponsor = useMemo(() => envData.client_type == 'sponsor', [envData.client_type]);

    const [{ success, error }, setParams] = useQueryParams({
        success: BooleanParam,
        error: StringParam,
    });

    const fetchTransactionBulk = useCallback(() => {
        setProgress(0);

        transactionBulkService
            .show(activeOrganization.id, bulkId)
            .then((res) => setTransactionBulk(res.data.data))
            .finally(() => setProgress(100));
    }, [activeOrganization.id, setProgress, transactionBulkService, bulkId]);

    const canManageBulks = useMemo(
        () => hasPermission(activeOrganization, 'manage_transaction_bulks'),
        [activeOrganization],
    );

    const confirmDangerAction = useCallback(
        (title: string, description: string, onSubmit?: () => void, onCancel?: () => void) => {
            openModal((modal) => (
                <ModalDangerZone
                    modal={modal}
                    title={title}
                    description_text={description}
                    buttonSubmit={{
                        text: 'Bevestigen',
                        onClick: () => {
                            onSubmit?.();
                            modal.close();
                        },
                    }}
                    buttonCancel={{
                        text: 'Annuleren',
                        onClick: () => {
                            onCancel?.();
                            modal.close();
                        },
                    }}
                />
            ));
        },
        [openModal],
    );

    const confirmReset = useCallback(
        (bank: Bank, onConfirm: () => void) => {
            if (bank.key === 'bunq') {
                // Reset Bunq bulk confirmation
                return confirmDangerAction(
                    'Bulktransactie opnieuw versturen',
                    [
                        'U staat op het punt om een bulktransactie opnieuw te versturen.',
                        'De vorige bulkbetaling was geannuleerd.',
                        'Het opnieuw versturen stelt de bulktransactie opnieuw in en stuurt de transactie naar uw mobiele app.\n',
                        'Weet u zeker dat u wilt verdergaan?',
                    ].join(' '),
                    onConfirm,
                );
            }

            if (bank.key === 'bng') {
                // Reset BNG bulk confirmation
                return confirmDangerAction(
                    'Reset BNG bulk',
                    [
                        'Weet u zeker dat u de bulk opnieuw wilt instellen?',
                        'Stel alleen de bulk opnieuw in als de link om te autoriseren niet meer geldig is.',
                        'Alleen de bulk betalingen die nog niet geautoriseerd zijn kunnen opnieuw worden ingesteld.\n\n',
                        'U wordt doorverwezen naar de betalingsverkeer pagina van de BNG.\n',
                        'Weet u zeker dat u door wil gaan?',
                    ].join(' '),
                    onConfirm,
                );
            }
        },
        [confirmDangerAction],
    );

    const confirmSubmitToBNG = useCallback(
        (onConfirm: () => void) => {
            confirmDangerAction(
                'Betalingsverkeer via de BNG',
                [
                    'U wordt doorverwezen naar de betalingsverkeer pagina van de BNG.\n',
                    'Weet u zeker dat u door wil gaan?',
                ].join(' '),
                onConfirm,
            );
        },
        [confirmDangerAction],
    );

    const confirmExport = useCallback(
        (onConfirm: () => void) => {
            confirmDangerAction('Exporteer SEPA bestand', 'Weet u zeker dat u het bestand wilt exporteren?', onConfirm);
        },
        [confirmDangerAction],
    );

    const confirmSetPaidExport = useCallback(
        (onConfirm: () => void) => {
            confirmDangerAction(
                'Markeer bulk lijst als betaald',
                [
                    'Bevestig dat de bulk lijst is betaald.\n',
                    'Betalingen via het SEPA bestand vinden niet (automatisch) via het systeem plaats.',
                    'Het is uw verantwoordelijkheid om de betaling te verwerken middels de SEPA export.',
                ].join(' '),
                onConfirm,
            );
        },
        [confirmDangerAction],
    );

    const onError = useCallback(
        (err: ResponseError = null) => {
            pushDanger('Mislukt!', err?.data?.message || 'Er ging iets mis!');
        },
        [pushDanger],
    );

    const resetPaymentRequest = useCallback(() => {
        const bank = transactionBulk.bank;

        confirmReset(bank, () => {
            setResettingBulk(true);
            setProgress(0);

            transactionBulkService
                .reset(activeOrganization.id, transactionBulk.id)
                .then((res) => {
                    if (bank.key === 'bunq') {
                        pushSuccess(`Succes!`, `Accepteer de transacties via uw bank.`);
                    }

                    if (bank.key === 'bng') {
                        document.location = res.data.data.auth_url;
                    }
                })
                .catch((res) => onError(res))
                .finally(() => {
                    setResettingBulk(false);
                    setProgress(100);
                });
        });
    }, [
        activeOrganization.id,
        confirmReset,
        onError,
        pushSuccess,
        setProgress,
        transactionBulk,
        transactionBulkService,
    ]);

    const submitPaymentRequestToBNG = useCallback(() => {
        confirmSubmitToBNG(() => {
            setSubmittingBulk(true);
            setProgress(0);

            transactionBulkService
                .submit(activeOrganization.id, transactionBulk.id)
                .then((res) => {
                    if (!res.data?.data?.auth_url) {
                        onError();
                    }

                    document.location = res.data.data.auth_url;
                })
                .catch((res: ResponseError) => onError(res))
                .finally(() => {
                    setSubmittingBulk(false);
                    setProgress(100);
                });
        });
    }, [activeOrganization.id, confirmSubmitToBNG, onError, setProgress, transactionBulk?.id, transactionBulkService]);

    const exportSepa = useCallback(() => {
        confirmExport(() => {
            setProgress(0);

            transactionBulkService
                .exportSepa(activeOrganization.id, transactionBulk.id)
                .then((res) => {
                    exporterService.saveExportedData(
                        { data_format: 'xml', fields: '' },
                        activeOrganization.id,
                        res,
                        transactionBulk.id,
                    );
                    fetchTransactionBulk();
                })
                .finally(() => setProgress(100));
        });
    }, [
        confirmExport,
        setProgress,
        transactionBulkService,
        activeOrganization.id,
        transactionBulk?.id,
        exporterService,
        fetchTransactionBulk,
    ]);

    const acceptManually = useCallback(() => {
        confirmSetPaidExport(() => {
            setProgress(0);

            transactionBulkService
                .acceptManually(activeOrganization.id, transactionBulk.id)
                .then(() => {
                    pushSuccess(`Succes!`, `De bulk lijst is handmatig geaccepteerd.`);
                    fetchTransactionBulk();
                })
                .catch((res) => pushDanger('Mislukt!', res?.data?.message || 'Er ging iets mis!'))
                .finally(() => setProgress(100));
        });
    }, [
        activeOrganization.id,
        confirmSetPaidExport,
        fetchTransactionBulk,
        pushDanger,
        pushSuccess,
        setProgress,
        transactionBulk?.id,
        transactionBulkService,
    ]);

    useEffect(() => {
        if (success === true) {
            pushSuccess('Succes!', 'De bulk is bevestigd!');
        }

        if (error) {
            pushDanger('Error!', { canceled: 'Geannuleerd.', unknown: 'Er is iets misgegaan!' }[error] || error);
        }

        if (success === true || error) {
            setParams({ success: null, error: null });
        }
    }, [error, pushDanger, pushSuccess, setParams, success]);

    useEffect(() => {
        fetchTransactionBulk();
    }, [fetchTransactionBulk]);

    if (!transactionBulk) {
        return <LoadingCard />;
    }

    return (
        <Fragment>
            <div className="block block-breadcrumbs">
                <StateNavLink
                    name={'transactions'}
                    params={{ organizationId: activeOrganization.id }}
                    className="breadcrumb-item">
                    {t('page_state_titles.transactions')}
                </StateNavLink>

                <div className="breadcrumb-item active">{`#${transactionBulk.id}`}</div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="flex-row">
                        <div className="flex flex-grow">
                            <div className="card-title">{t('financial_dashboard_transaction.labels.details')}</div>
                        </div>

                        {canManageBulks && (
                            <div className="flex">
                                <div className="button-group">
                                    {transactionBulk.bank.key === 'bng' && (
                                        <Fragment>
                                            {transactionBulk.state === 'pending' && transactionBulk.auth_url && (
                                                <a
                                                    className="button button-default button-sm"
                                                    href={transactionBulk.auth_url}>
                                                    <em className="mdi mdi-link icon-start" />
                                                    Autoriseer
                                                </a>
                                            )}

                                            {transactionBulk.state == 'draft' && (
                                                <Fragment>
                                                    {activeOrganization.allow_manual_bulk_processing && (
                                                        <button
                                                            className="button button-default button-sm"
                                                            onClick={() => exportSepa()}>
                                                            <em className="mdi mdi-download icon-start" />
                                                            Export SEPA file
                                                        </button>
                                                    )}

                                                    <button
                                                        className="button button-primary button-sm"
                                                        onClick={() => submitPaymentRequestToBNG()}
                                                        disabled={submittingBulk || resettingBulk}>
                                                        {!submittingBulk && (
                                                            <em className="mdi mdi-circle-multiple-outline icon-start" />
                                                        )}
                                                        {submittingBulk && (
                                                            <em className="mdi mdi-reload mdi-spin icon-start" />
                                                        )}
                                                        Verstuur de bulk naar BNG
                                                    </button>

                                                    {transactionBulk.is_exported && (
                                                        <button
                                                            className="button button-danger button-sm"
                                                            onClick={() => acceptManually()}>
                                                            <em className="mdi mdi-alert-outline icon-start" />
                                                            Markeer de bulk lijst en de transacties als betaald.
                                                        </button>
                                                    )}
                                                </Fragment>
                                            )}
                                        </Fragment>
                                    )}

                                    {((transactionBulk.bank.key === 'bng' && transactionBulk.state == 'pending') ||
                                        (transactionBulk.bank.key === 'bunq' &&
                                            transactionBulk.state == 'rejected')) && (
                                        <button
                                            className="button button-danger button-sm"
                                            onClick={() => resetPaymentRequest()}
                                            disabled={submittingBulk || resettingBulk}>
                                            {resettingBulk ? (
                                                <em className="mdi mdi-reload mdi-spin icon-start" />
                                            ) : (
                                                <em className="mdi mdi-reload icon-start" />
                                            )}
                                            Verstuur bulktransactie opnieuw
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="card-section">
                    <div className="flex">
                        <div className="flex">
                            <div className="card-block card-block-keyvalue">
                                <KeyValueItem label="Transactiewaarde">
                                    {transactionBulk.voucher_transactions_amount_locale}
                                </KeyValueItem>

                                <KeyValueItem label={t('financial_dashboard_transaction.labels.id')}>
                                    {transactionBulk.id}
                                </KeyValueItem>

                                {isSponsor && (
                                    <Fragment>
                                        {transactionBulk.payment_id && (
                                            <Fragment>
                                                {transactionBulk.bank.key === 'bunq' && (
                                                    <KeyValueItem
                                                        label={t('financial_dashboard_transaction.labels.bunq_id')}>
                                                        {transactionBulk.payment_id}
                                                    </KeyValueItem>
                                                )}

                                                {transactionBulk.bank.key === 'bng' && (
                                                    <KeyValueItem
                                                        label={t('financial_dashboard_transaction.labels.bng_id')}>
                                                        {transactionBulk.payment_id}
                                                    </KeyValueItem>
                                                )}
                                            </Fragment>
                                        )}

                                        <KeyValueItem label={t('financial_dashboard_transaction.labels.bunq')}>
                                            {transactionBulk.voucher_transactions_cost_locale}
                                        </KeyValueItem>
                                    </Fragment>
                                )}

                                <KeyValueItem label={t('financial_dashboard_transaction.labels.date')}>
                                    {transactionBulk.created_at_locale}
                                </KeyValueItem>

                                {transactionBulk.execution_date !== null && (
                                    <KeyValueItem label={t('financial_dashboard_transaction.labels.execution_date')}>
                                        {transactionBulk.execution_date_locale}
                                    </KeyValueItem>
                                )}

                                <KeyValueItem label={t('financial_dashboard_transaction.labels.status')}>
                                    <Fragment>
                                        {transactionBulk.state == 'rejected' && (
                                            <span className="label label-danger">{transactionBulk.state_locale}</span>
                                        )}
                                        {transactionBulk.state == 'error' && (
                                            <span className="label label-danger">{transactionBulk.state_locale}</span>
                                        )}
                                        {transactionBulk.state == 'draft' && (
                                            <span className="label label-default">{transactionBulk.state_locale}</span>
                                        )}
                                        {transactionBulk.state == 'accepted' && (
                                            <span className="label label-success">{transactionBulk.state_locale}</span>
                                        )}
                                        {transactionBulk.state == 'pending' && (
                                            <span className="label label-default">{transactionBulk.state_locale}</span>
                                        )}
                                        {transactionBulk.state == 'pending' && (
                                            <Tooltip text="De status van bulkbetaling wordt om het uur gecontroleerd." />
                                        )}
                                    </Fragment>
                                </KeyValueItem>

                                {canManageBulks &&
                                    transactionBulk.bank.key === 'bng' &&
                                    transactionBulk.state == 'accepted' &&
                                    activeOrganization.allow_manual_bulk_processing && (
                                        <KeyValueItem label={t('financial_dashboard_transaction.labels.accepted')}>
                                            {transactionBulk.accepted_manually ? 'Handmatig' : 'Verstuurd naar de BNG'}
                                        </KeyValueItem>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {transactionBulk && (
                <TransactionBulkTransactionsTable organization={activeOrganization} transactionBulk={transactionBulk} />
            )}
        </Fragment>
    );
}
