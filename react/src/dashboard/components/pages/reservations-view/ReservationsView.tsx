import React, { Fragment, useCallback, useEffect, useState } from 'react';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import LoadingCard from '../../elements/loading-card/LoadingCard';
import usePushSuccess from '../../../hooks/usePushSuccess';
import usePushDanger from '../../../hooks/usePushDanger';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import { hasPermission } from '../../../helpers/utils';
import useSetProgress from '../../../hooks/useSetProgress';
import Reservation from '../../../props/models/Reservation';
import { useParams } from 'react-router-dom';
import useProductReservationService from '../../../services/ProductReservationService';
import useConfirmReservationApproval from '../../../services/helpers/reservations/useConfirmReservationApproval';
import useTransactionService from '../../../services/TransactionService';
import useEnvData from '../../../hooks/useEnvData';
import Transaction from '../../../props/models/Transaction';
import useShowRejectInfoExtraPaid from '../../../services/helpers/reservations/useShowRejectInfoExtraPaid';
import useConfirmReservationRejection from '../../../services/helpers/reservations/useConfirmReservationRejection';
import TransactionDetails from '../transactions-view/elements/TransactionDetails';
import ReservationExtraPaymentRefunds from './elements/ReservationExtraPaymentRefunds';
import ReservationExtraPaymentDetails from './elements/ReservationExtraPaymentDetails';
import useTranslate from '../../../hooks/useTranslate';
import TableEmptyValue from '../../elements/table-empty-value/TableEmptyValue';

export default function ReservationsView() {
    const { id } = useParams();

    const envData = useEnvData();
    const activeOrganization = useActiveOrganization();

    const translate = useTranslate();
    const pushDanger = usePushDanger();
    const pushSuccess = usePushSuccess();
    const setProgress = useSetProgress();

    const transactionService = useTransactionService();
    const productReservationService = useProductReservationService();

    const [transaction, setTransaction] = useState<Transaction>(null);
    const [reservation, setReservation] = useState<Reservation>(null);
    const [stateClass, setStateClass] = useState('label-default');

    const showRejectInfoExtraPaid = useShowRejectInfoExtraPaid();
    const confirmReservationApproval = useConfirmReservationApproval();
    const confirmReservationRejection = useConfirmReservationRejection();

    const fetchTransaction = useCallback(
        (transaction_address: string) => {
            setProgress(0);

            transactionService
                .show(envData.client_type, activeOrganization.id, transaction_address)
                .then((res) => setTransaction(res.data.data))
                .catch((res) => pushDanger('Mislukt!', res.data?.message))
                .finally(() => setProgress(100));
        },
        [activeOrganization.id, envData.client_type, pushDanger, setProgress, transactionService],
    );

    const fetchReservation = useCallback(
        (reservation_id: number) => {
            setProgress(0);

            productReservationService
                .read(activeOrganization.id, reservation_id)
                .then((res) => setReservation(res.data.data))
                .catch((res) => pushDanger('Mislukt!', res.data?.message))
                .finally(() => setProgress(100));
        },
        [activeOrganization.id, productReservationService, pushDanger, setProgress],
    );

    const acceptReservation = useCallback(
        (reservation) => {
            confirmReservationApproval(reservation, () => {
                setProgress(0);

                productReservationService
                    .accept(activeOrganization.id, reservation.id)
                    .then((res) => {
                        pushSuccess('Opgeslagen!');

                        setReservation(res.data.data);

                        if (reservation.voucher_transaction?.address) {
                            fetchTransaction(reservation.voucher_transaction?.address);
                        }
                    })
                    .catch((res) => pushDanger('Mislukt!', res.data?.message))
                    .then(() => setProgress(100));
            });
        },
        [
            activeOrganization.id,
            confirmReservationApproval,
            fetchTransaction,
            productReservationService,
            pushDanger,
            pushSuccess,
            setProgress,
        ],
    );

    const rejectReservation = useCallback(
        (reservation) => {
            if (reservation.extra_payment?.is_paid && !reservation.extra_payment?.is_fully_refunded) {
                return showRejectInfoExtraPaid();
            }

            confirmReservationRejection(reservation, () => {
                productReservationService
                    .reject(activeOrganization.id, reservation.id)
                    .then((res) => {
                        pushSuccess('Opgeslagen!');
                        setReservation(res.data.data);
                    })
                    .catch((res) => pushDanger('Mislukt!', res.data?.message))
                    .then(() => setProgress(100));
            });
        },
        [
            activeOrganization.id,
            confirmReservationRejection,
            productReservationService,
            pushDanger,
            pushSuccess,
            setProgress,
            showRejectInfoExtraPaid,
        ],
    );

    const onTransactionUpdate = useCallback(() => {
        fetchReservation(reservation.id);
    }, [fetchReservation, reservation?.id]);

    const onExtraPaymentUpdate = useCallback(() => {
        fetchReservation(reservation.id);

        if (reservation?.voucher_transaction?.address) {
            fetchTransaction(reservation.voucher_transaction.address);
        }
    }, [fetchReservation, fetchTransaction, reservation?.id, reservation?.voucher_transaction?.address]);

    useEffect(() => {
        fetchReservation(parseInt(id));
    }, [fetchReservation, id]);

    useEffect(() => {
        if (reservation?.voucher_transaction?.address) {
            fetchTransaction(reservation.voucher_transaction.address);
        }
    }, [fetchTransaction, reservation?.voucher_transaction?.address]);

    useEffect(() => {
        setStateClass(productReservationService.stateClass(reservation));
    }, [productReservationService, reservation]);

    if (!reservation) {
        return <LoadingCard />;
    }

    return (
        <Fragment>
            <div className="block block-breadcrumbs">
                <StateNavLink
                    name={'reservations'}
                    params={{ organizationId: activeOrganization.id }}
                    activeExact={true}
                    className="breadcrumb-item">
                    Reservations
                </StateNavLink>
                <div className="breadcrumb-item active">{`#${reservation.code}`}</div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="flex">
                        <div className="flex flex-grow">
                            <div className="flex flex-vertical">
                                <div className="card-title">
                                    <div className="flex">
                                        <div className="flex flex-vertical">
                                            <div className="flex">
                                                <span className="text-muted">Product name:&nbsp;</span>
                                                {reservation.product.name}
                                                &nbsp;&nbsp;
                                            </div>
                                        </div>
                                        <div className="flex flex-vertical flex-center">
                                            <div className="flex flex-horizontal">
                                                {reservation.expired ? (
                                                    <label className="label label-danger-light">Expired</label>
                                                ) : (
                                                    <label className={`label ${stateClass}`}>
                                                        {reservation.state_locale}
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-subtitle">
                                    <div className="flex">
                                        <div className="mdi mdi-clock-outline" />
                                        {reservation.created_at_locale}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-self-start">
                            <div className="flex-row">
                                <div className="button-group">
                                    {reservation.acceptable && (
                                        <div
                                            className="button button-primary button-sm"
                                            onClick={() => acceptReservation(reservation)}>
                                            <em className="mdi mdi-check icon-start" />
                                            Accepteer
                                        </div>
                                    )}

                                    {reservation.rejectable && (
                                        <div
                                            className="button button-danger button-sm"
                                            onClick={() => rejectReservation(reservation)}>
                                            <em className="mdi mdi-close icon-start" />
                                            Weiger
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card-section">
                    <div className="card-block card-block-table">
                        <div className="table-wrapper">
                            <table className="table table-fixed">
                                <tbody>
                                    <tr>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.price')}
                                            </strong>
                                            <br />
                                            <strong className="text-black">{reservation.price_locale}</strong>
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.fund')}
                                            </strong>
                                            <br />
                                            <strong className="text-black">{reservation.fund.name}</strong>
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.sponsor_organization')}
                                            </strong>
                                            <br />
                                            <strong className="text-black">{reservation.fund.organization.name}</strong>
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.product')}
                                            </strong>
                                            <br />
                                            <strong className="text-black">{reservation.product.name}</strong>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.created_at')}
                                            </strong>

                                            <br />
                                            <strong className="text-black">{reservation.created_at_locale}</strong>
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.expire_at')}
                                            </strong>
                                            <br />
                                            <strong className="text-black">{reservation.expire_at_locale}</strong>
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.accepted_at')}
                                            </strong>
                                            <br />
                                            {reservation.accepted_at ? (
                                                <strong className="text-black">{reservation.accepted_at_locale}</strong>
                                            ) : (
                                                <TableEmptyValue />
                                            )}
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.rejected_at')}
                                            </strong>
                                            <br />
                                            {reservation.rejected_at ? (
                                                <strong className="text-black">{reservation.rejected_at_locale}</strong>
                                            ) : (
                                                <TableEmptyValue />
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title">Gegevens</div>
                </div>
                <div className="card-section">
                    <div className="flex">
                        <div className="flex">
                            <div className="card-block card-block-keyvalue">
                                <div className="keyvalue-item">
                                    <div className="keyvalue-key">{translate('reservation.labels.email')}</div>
                                    <div className="keyvalue-value">{reservation.identity_email}</div>
                                </div>
                                <div className="keyvalue-item">
                                    <div className="keyvalue-key">{translate('reservation.labels.first_name')}</div>
                                    <div className="keyvalue-value">{reservation.first_name}</div>
                                </div>
                                <div className="keyvalue-item">
                                    <div className="keyvalue-key">{translate('reservation.labels.last_name')}</div>
                                    <div className="keyvalue-value">{reservation.last_name}</div>
                                </div>
                                {reservation.phone && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">{translate('reservation.labels.phone')}</div>
                                        <div className="keyvalue-value">{reservation.phone}</div>
                                    </div>
                                )}
                                {reservation.address && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">{translate('reservation.labels.address')}</div>
                                        <div className="keyvalue-value">{reservation.address}</div>
                                    </div>
                                )}
                                {reservation.birth_date && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">{translate('reservation.labels.birth_date')}</div>
                                        <div className="keyvalue-value">{reservation.birth_date_locale}</div>
                                    </div>
                                )}
                                {reservation.custom_fields?.map((field, index) => (
                                    <div className="keyvalue-item" key={index}>
                                        <div className="keyvalue-key">{field.label}</div>
                                        <div className="keyvalue-value">{field.value}</div>
                                    </div>
                                ))}
                                {reservation.user_note && (
                                    <div className="keyvalue-item">
                                        <div className="keyvalue-key">{translate('reservation.labels.user_note')}</div>
                                        <div className="keyvalue-value">{reservation.user_note}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {transaction && hasPermission(activeOrganization, 'view_finances') && (
                <TransactionDetails
                    transaction={transaction}
                    setTransaction={setTransaction}
                    showDetailsPageButton={true}
                    showAmount={false}
                    onUpdate={onTransactionUpdate}
                />
            )}

            {reservation.extra_payment && (
                <ReservationExtraPaymentDetails
                    organization={activeOrganization}
                    reservation={reservation}
                    payment={reservation.extra_payment}
                    onUpdate={onExtraPaymentUpdate}
                />
            )}

            {reservation.extra_payment && reservation.extra_payment.refunds.length > 0 && (
                <ReservationExtraPaymentRefunds refunds={reservation.extra_payment.refunds} />
            )}
        </Fragment>
    );
}
