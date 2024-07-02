import Transaction from '../../../../props/models/Transaction';
import useTransactionService from '../../../../services/TransactionService';
import useProductReservationService from '../../../../services/ProductReservationService';
import Reservation from '../../../../props/models/Reservation';
import React, { useCallback, useEffect, useMemo } from 'react';
import useEnvData from '../../../../hooks/useEnvData';
import useActiveOrganization from '../../../../hooks/useActiveOrganization';
import useAssetUrl from '../../../../hooks/useAssetUrl';
import StateNavLink from '../../../../modules/state_router/StateNavLink';
import Tooltip from '../../../elements/tooltip/Tooltip';
import useOpenModal from '../../../../hooks/useOpenModal';
import ModalDangerZone from '../../../modals/ModalDangerZone';
import usePushSuccess from '../../../../hooks/usePushSuccess';
import usePushDanger from '../../../../hooks/usePushDanger';
import useShowRejectInfoExtraPaid from '../../../../services/helpers/reservations/useShowRejectInfoExtraPaid';
import LoadingCard from '../../../elements/loading-card/LoadingCard';
import useTranslate from '../../../../hooks/useTranslate';
import TableEmptyValue from '../../../elements/table-empty-value/TableEmptyValue';

export default function TransactionDetails({
    transaction,
    setTransaction,
    showDetailsPageButton = false,
    showReservationPageButton = false,
    showAmount = false,
    onUpdate,
}: {
    transaction: Transaction;
    setTransaction: React.Dispatch<Transaction>;
    showDetailsPageButton?: boolean;
    showReservationPageButton?: boolean;
    showAmount?: boolean;
    onUpdate?: () => void;
}) {
    const envData = useEnvData();
    const activeOrganization = useActiveOrganization();

    const assetUrl = useAssetUrl();
    const openModal = useOpenModal();
    const translate = useTranslate();
    const pushDanger = usePushDanger();
    const pushSuccess = usePushSuccess();
    const showRejectInfoExtraPaid = useShowRejectInfoExtraPaid();

    const isSponsor = useMemo(() => envData.client_type == 'sponsor', [envData.client_type]);
    const isProvider = useMemo(() => envData.client_type == 'provider', [envData.client_type]);
    const transactionService = useTransactionService();
    const productReservationService = useProductReservationService();

    const fetchTransaction = useCallback(() => {
        return transactionService.show(envData.client_type, activeOrganization.id, transaction.address);
    }, [activeOrganization.id, envData.client_type, transactionService, transaction.address]);

    const cancelTransaction = useCallback(
        (reservation: Reservation) => {
            if (reservation.extra_payment?.is_paid && !reservation.extra_payment?.is_fully_refunded) {
                return showRejectInfoExtraPaid();
            }

            openModal((modal) => {
                return (
                    <ModalDangerZone
                        modal={modal}
                        title={'Weet u zeker dat u de betaling wilt annuleren?'}
                        description_text={[
                            'Als u de betaling annuleert wordt de bestelling ongedaan gemaakt.',
                            'U ontvangt geen betaling en de klant krijgt het tegoed terug.',
                        ].join(' ')}
                        buttonCancel={{
                            text: 'Sluiten',
                            onClick: () => modal.close(),
                        }}
                        buttonSubmit={{
                            text: 'Bevestigen',
                            onClick: () => {
                                modal.close();
                                productReservationService.reject(activeOrganization.id, reservation.id).then(
                                    () => {
                                        pushSuccess('Opgeslagen!');
                                        fetchTransaction().then((res) => setTransaction(res.data.data));
                                        onUpdate?.();
                                    },
                                    (res) => pushDanger(res.data.message),
                                );
                            },
                        }}
                    />
                );
            });
        },
        [
            activeOrganization.id,
            fetchTransaction,
            onUpdate,
            openModal,
            productReservationService,
            pushDanger,
            pushSuccess,
            setTransaction,
            showRejectInfoExtraPaid,
        ],
    );

    useEffect(() => {
        fetchTransaction().then((res) => setTransaction(res.data.data));
    }, [fetchTransaction, setTransaction]);

    if (!transaction) {
        return <LoadingCard />;
    }

    return (
        <div className="block block-transaction-details">
            {showAmount && (
                <div className="card card-wrapped">
                    <div className="card-section">
                        <div className="card-title">
                            <strong>{transaction.amount_locale}</strong>
                            &nbsp;&nbsp;
                            <strong className="text-primary pull-right">
                                {translate('financial_dashboard_transaction.labels.payment')}
                            </strong>
                            <div className="flex flex-grow" />
                        </div>
                    </div>
                    {transaction.notes && transaction.notes.length != 0 && (
                        <div className="card-section">
                            <div className="card-block card-block-notes">
                                {transaction.notes.map((note) => (
                                    <div className="note-item" key={note.id}>
                                        <img
                                            alt={''}
                                            className="note-item-icon"
                                            src={assetUrl(`/assets/img/note-icons/note-icon-${note.icon}.jpg`)}
                                        />
                                        {note.message && <div className="note-item-text">{note.message}</div>}
                                        <div className="note-item-sign flex">
                                            <span>
                                                {'By ' +
                                                    (note.group == 'sponsor'
                                                        ? transaction.fund.organization_name
                                                        : transaction.organization.name)}
                                            </span>
                                            <em className="mdi mdi-circle" />
                                            <span>{note.created_at_locale}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div className="card card-wrapped">
                <div className="card-header">
                    <div className="flex">
                        <div className="flex flex-grow">
                            <div className="card-title">
                                {translate('financial_dashboard_transaction.labels.details')}
                            </div>
                        </div>
                        <div className="flex">
                            <div className="block block-inline-filters">
                                {showDetailsPageButton && (
                                    <StateNavLink
                                        name={'transaction'}
                                        className="button button-primary"
                                        activeExact={true}
                                        params={{
                                            organizationId: activeOrganization.id,
                                            address: transaction.address,
                                        }}>
                                        <em className="mdi mdi-eye-outline icon-start" />
                                        Transactie details
                                    </StateNavLink>
                                )}
                                {transaction.voucher_id && isSponsor && (
                                    <StateNavLink
                                        name={'vouchers-show'}
                                        params={{
                                            organizationId: activeOrganization.id,
                                            id: transaction.product_reservation?.voucher_id || transaction.voucher_id,
                                        }}
                                        className="button button-primary">
                                        <em className="mdi mdi-eye-outline icon-start" />
                                        Voucher details
                                    </StateNavLink>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card-section">
                    <div className="flex">
                        <div className="flex">
                            <div className="card-block card-block-keyvalue">
                                <div className="keyvalue-item">
                                    <div className="keyvalue-key">
                                        {translate('financial_dashboard_transaction.labels.id')}
                                    </div>
                                    <div className="keyvalue-value">{transaction.id}</div>
                                </div>
                                {!showAmount && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">
                                            {translate('financial_dashboard_transaction.labels.amount')}
                                        </div>
                                        <div className="keyvalue-value">{transaction.amount_locale}</div>
                                    </div>
                                )}
                                {isSponsor && transaction.payment_id && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">
                                            {translate('financial_dashboard_transaction.labels.bunq_id')}
                                        </div>
                                        <div className="keyvalue-value">{transaction.payment_id}</div>
                                    </div>
                                )}
                                {isSponsor && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">
                                            {translate('financial_dashboard_transaction.labels.statement')}
                                        </div>
                                        {['provider', 'iban'].includes(transaction.target) && (
                                            <div className="keyvalue-value">
                                                {transaction?.organization?.name || 'Aanvrager'}
                                            </div>
                                        )}
                                        {['top_up'].includes(transaction.target) && (
                                            <div className="keyvalue-value">Top up</div>
                                        )}
                                    </div>
                                )}
                                {transaction.product && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">
                                            {translate('financial_dashboard_transaction.labels.product_id')}
                                        </div>
                                        <div className="keyvalue-value">{transaction.product.id}</div>
                                    </div>
                                )}
                                {transaction.product && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">
                                            {translate('financial_dashboard_transaction.labels.product_name')}
                                        </div>
                                        <div className="keyvalue-value">{transaction.product.name}</div>
                                    </div>
                                )}
                                {isSponsor && transaction.target !== 'top_up' && transaction.state == 'success' && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">
                                            {translate('financial_dashboard_transaction.labels.bunq')}
                                        </div>
                                        <div className="keyvalue-value">{transaction.transaction_cost_locale}</div>
                                    </div>
                                )}
                                <div className="keyvalue-item">
                                    <div className="keyvalue-key">
                                        {translate('financial_dashboard_transaction.labels.date')}
                                    </div>
                                    <div className="keyvalue-value">{transaction.created_at_locale}</div>
                                </div>
                                {isSponsor && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">
                                            {translate('financial_dashboard_transaction.labels.date_non_cancelable')}
                                        </div>
                                        <div className="keyvalue-value">
                                            {transaction.non_cancelable_at_locale || <TableEmptyValue />}
                                        </div>
                                    </div>
                                )}
                                <div className="keyvalue-item">
                                    <div className="keyvalue-key">Status</div>
                                    <div className="keyvalue-value">
                                        {transaction.state_locale}
                                        {transaction.transaction_in > 0 && transaction.state == 'pending' && (
                                            <div className="text-sm text-muted-dark">
                                                <em className="mdi mdi-clock-outline"> </em>
                                                {transaction.transaction_in} dagen resterend
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {transaction.iban_from && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">IBAN (van)</div>
                                        <div className="keyvalue-value">
                                            <span className={transaction.iban_final ? '' : 'text-muted-dark'}>
                                                {transaction.iban_from}
                                            </span>
                                            {!transaction.iban_final && (
                                                <Tooltip
                                                    text={translate(
                                                        'financial_dashboard_transaction.tooltips.pending_iban_from',
                                                    )}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {transaction.iban_to && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">IBAN (naar)</div>
                                        <div className="keyvalue-value">
                                            <span
                                                className={
                                                    !transaction.iban_final && transaction.target != 'iban'
                                                        ? 'text-muted-dark'
                                                        : ''
                                                }>
                                                {transaction.iban_to}
                                            </span>

                                            {!transaction.iban_final && transaction.target != 'iban' && (
                                                <Tooltip
                                                    text={translate(
                                                        'financial_dashboard_transaction.tooltips.pending_iban_to',
                                                    )}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {transaction.iban_to_name && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">IBAN naam (naar)</div>
                                        <div className="keyvalue-value">
                                            <span
                                                className={
                                                    !transaction.iban_final && transaction.target != 'iban'
                                                        ? 'text-muted-dark'
                                                        : ''
                                                }>
                                                {transaction.iban_to_name}
                                            </span>
                                            {!transaction.iban_final && transaction.target != 'iban' && (
                                                <Tooltip
                                                    text={translate(
                                                        'financial_dashboard_transaction.tooltips.pending_iban_to',
                                                    )}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {transaction.reservation && isProvider && showReservationPageButton && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">Reservering</div>
                                        <StateNavLink
                                            name={'reservations-show'}
                                            className="text-primary text-strong keyvalue-value"
                                            params={{
                                                organizationId: activeOrganization.id,
                                                id: transaction.reservation.id,
                                            }}>
                                            {`#${transaction.reservation.code}`}
                                        </StateNavLink>
                                    </div>
                                )}
                            </div>
                        </div>

                        {transaction.cancelable && transaction.reservation && (
                            <div className="flex flex-column flex-end">
                                <button
                                    className="button button-default button-sm"
                                    onClick={() => cancelTransaction(transaction.reservation)}>
                                    <strong className="nowrap">Betaling annuleren</strong>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
