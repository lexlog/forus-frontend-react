import React, { Fragment, useCallback, useEffect, useState } from 'react';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import LoadingCard from '../../elements/loading-card/LoadingCard';
import usePushDanger from '../../../hooks/usePushDanger';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import { hasPermission } from '../../../helpers/utils';
import useSetProgress from '../../../hooks/useSetProgress';
import { useParams } from 'react-router-dom';
import useProductReservationService from '../../../services/ProductReservationService';
import useTransactionService from '../../../services/TransactionService';
import useEnvData from '../../../hooks/useEnvData';
import Transaction from '../../../props/models/Transaction';
import TransactionDetails from '../transactions-view/elements/TransactionDetails';
import useExtraPaymentService from '../../../services/ExtraPaymentService';
import ExtraPayment from '../../../props/models/ExtraPayment';
import ReservationExtraPaymentDetails from '../reservations-view/elements/ReservationExtraPaymentDetails';
import useTranslate from '../../../hooks/useTranslate';
import TableEmptyValue from '../../elements/table-empty-value/TableEmptyValue';

export default function ExtraPaymentsView() {
    const { id } = useParams();
    const envData = useEnvData();
    const activeOrganization = useActiveOrganization();

    const transactionService = useTransactionService();
    const extraPaymentService = useExtraPaymentService();
    const productReservationService = useProductReservationService();

    const translate = useTranslate();
    const pushDanger = usePushDanger();
    const setProgress = useSetProgress();

    const [transaction, setTransaction] = useState<Transaction>(null);
    const [extraPayment, setExtraPayment] = useState<ExtraPayment>(null);
    const [stateClass, setStateClass] = useState('label-default');

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

    const fetchExtraPayment = useCallback(
        (extra_payment_id: number) => {
            setProgress(0);

            extraPaymentService
                .read(activeOrganization.id, extra_payment_id)
                .then((res) => setExtraPayment(res.data.data))
                .catch((res) => pushDanger('Mislukt!', res.data?.message))
                .finally(() => setProgress(100));
        },
        [activeOrganization.id, extraPaymentService, pushDanger, setProgress],
    );

    useEffect(() => {
        fetchExtraPayment(parseInt(id));
    }, [fetchExtraPayment, id]);

    useEffect(() => {
        if (extraPayment?.reservation?.voucher_transaction?.address) {
            fetchTransaction(extraPayment.reservation.voucher_transaction.address);
        }
    }, [fetchTransaction, extraPayment?.reservation?.voucher_transaction?.address]);

    useEffect(() => {
        if (extraPayment?.reservation) {
            setStateClass(productReservationService.stateClass(extraPayment.reservation));
        }
    }, [productReservationService, extraPayment?.reservation]);

    if (!extraPayment) {
        return <LoadingCard />;
    }

    return (
        <Fragment>
            <div className="block block-breadcrumbs">
                <StateNavLink
                    name={'extra-payments'}
                    params={{ organizationId: activeOrganization.id }}
                    activeExact={true}
                    className="breadcrumb-item">
                    Bijbetalingen
                </StateNavLink>
                <div className="breadcrumb-item active">{`#${extraPayment.reservation.code}`}</div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <div className="flex-grow">
                            <span className="text-muted">Product name:&nbsp;</span>
                            {extraPayment.reservation.product.name}
                            &nbsp;&nbsp;
                        </div>
                        <div className="flex-center">
                            {extraPayment.reservation.expired ? (
                                <label className="label label-danger-light">Expired</label>
                            ) : (
                                <label className={`label ${stateClass}`}>{extraPayment.reservation.state_locale}</label>
                            )}
                        </div>
                    </div>
                    <div className="card-subtitle">
                        <div className="flex">
                            <div className="mdi mdi-clock-outline" />
                            {extraPayment.reservation.created_at_locale}
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
                                            <strong className="text-black">
                                                {extraPayment.reservation.price_locale}
                                            </strong>
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.fund')}
                                            </strong>
                                            <br />
                                            <strong className="text-black">{extraPayment.reservation.fund.name}</strong>
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.sponsor_organization')}
                                            </strong>
                                            <br />
                                            <strong className="text-black">
                                                {extraPayment.reservation.fund.organization.name}
                                            </strong>
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.product')}
                                            </strong>
                                            <br />
                                            <strong className="text-black">
                                                {extraPayment.reservation.product.name}
                                            </strong>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.created_at')}
                                            </strong>

                                            <br />
                                            <strong className="text-black">
                                                {extraPayment.reservation.created_at_locale}
                                            </strong>
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.expire_at')}
                                            </strong>
                                            <br />
                                            <strong className="text-black">
                                                {extraPayment.reservation.expire_at_locale}
                                            </strong>
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.accepted_at')}
                                            </strong>
                                            <br />
                                            {extraPayment.reservation.accepted_at ? (
                                                <strong className="text-black">
                                                    {extraPayment.reservation.accepted_at_locale}
                                                </strong>
                                            ) : (
                                                <TableEmptyValue />
                                            )}
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('reservation.labels.rejected_at')}
                                            </strong>
                                            <br />
                                            {extraPayment.reservation.rejected_at ? (
                                                <strong className="text-black">
                                                    {extraPayment.reservation.rejected_at_locale}
                                                </strong>
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

            {transaction && hasPermission(activeOrganization, 'view_finances') && (
                <TransactionDetails
                    transaction={transaction}
                    setTransaction={setTransaction}
                    showDetailsPageButton={true}
                    showAmount={false}
                />
            )}

            <ReservationExtraPaymentDetails
                organization={activeOrganization}
                reservation={extraPayment.reservation}
                payment={extraPayment}
            />
        </Fragment>
    );
}
