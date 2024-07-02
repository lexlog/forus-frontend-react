import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import LoadingCard from '../../elements/loading-card/LoadingCard';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import Voucher from '../../../props/models/Voucher';
import { strLimit } from '../../../helpers/string';
import useOpenModal from '../../../hooks/useOpenModal';
import ModalVoucherTransaction from '../../modals/ModalVoucherTransaction/ModalVoucherTransaction';
import Fund from '../../../props/models/Fund';
import ModalVoucherDeactivation from '../../modals/ModalVoucherDeactivation';
import ModalVoucherActivate from '../../modals/ModalVoucherActivate';
import { useParams } from 'react-router-dom';
import useVoucherService from '../../../services/VoucherService';
import { useFundService } from '../../../services/FundService';
import { hasPermission } from '../../../helpers/utils';
import ModalAddPhysicalCard from '../../modals/ModalAddPhysicalCard';
import ModalDangerZone from '../../modals/ModalDangerZone';
import { usePhysicalCardService } from '../../../services/PhysicalCardService';
import NumericControl from '../../elements/forms/controls/NumericControl';
import useSetProgress from '../../../hooks/useSetProgress';
import usePushSuccess from '../../../hooks/usePushSuccess';
import usePushDanger from '../../../hooks/usePushDanger';
import { ApiResponseSingle, ResponseError } from '../../../props/ApiResponses';
import VoucherRecords from './elements/VoucherRecords';
import VoucherTransactions from './elements/VoucherTransactions';
import useFilter from '../../../hooks/useFilter';
import EventLogsTable from '../../elements/tables/EventLogsTable';
import ModalOrderPhysicalCard from '../../modals/ModalOrderPhysicalCard';
import useTranslate from '../../../hooks/useTranslate';
import useShowVoucherQrCode from '../vouchers/hooks/useShowVoucherQrCode';
import usePushApiError from '../../../hooks/usePushApiError';

export default function VouchersViewComponent() {
    const { id } = useParams();
    const activeOrganization = useActiveOrganization();

    const openModal = useOpenModal();
    const translate = useTranslate();
    const pushDanger = usePushDanger();
    const showQrCode = useShowVoucherQrCode();
    const setProgress = useSetProgress();
    const pushSuccess = usePushSuccess();
    const pushApiError = usePushApiError();

    const fundService = useFundService();
    const voucherService = useVoucherService();
    const physicalCardService = usePhysicalCardService();

    const eventLogsBlock = useRef<() => void>();
    const transactionsBlock = useRef<() => void>();
    const reservationTransactionsBlock = useRef<() => void>();

    const [fund, setFund] = useState<Fund>(null);
    const [voucher, setVoucher] = useState<Voucher>(null);

    const physicalCardsAvailable = useMemo(() => {
        return (
            voucher &&
            voucher.fund.allow_physical_cards &&
            voucher.fund.type === 'subsidies' &&
            voucher.state !== 'deactivated' &&
            !voucher.is_external
        );
    }, [voucher]);

    const showMakeTransactionButton = useMemo(() => {
        return (
            voucher &&
            hasPermission(activeOrganization, 'make_direct_payments') &&
            voucher.fund.type === 'budget' &&
            voucher.state === 'active' &&
            fund?.state != 'closed' &&
            !voucher.product &&
            !voucher.expired
        );
    }, [activeOrganization, fund?.state, voucher]);

    const transactionsFilters = useFilter({
        per_page: 20,
        order_by: 'created_at',
        order_dir: 'desc',
        voucher_id: parseInt(id),
    });

    const reservationTransactionsFilters = useFilter({
        per_page: 20,
        order_by: 'created_at',
        order_dir: 'desc',
        reservation_voucher_id: parseInt(id),
    });

    const fetchVoucher = useCallback(() => {
        setProgress(0);

        voucherService
            .show(activeOrganization.id, parseInt(id))
            .then((res) => setVoucher(res.data.data))
            .catch(pushApiError)
            .finally(() => setProgress(100));
    }, [activeOrganization.id, id, setProgress, voucherService, pushApiError]);

    const fetchFund = useCallback(
        (voucher: Voucher) => {
            setProgress(0);

            fundService
                .read(voucher.fund.organization_id, voucher.fund.id)
                .then((res) => setFund(res.data.data))
                .finally(() => setProgress(100));
        },
        [fundService, setProgress],
    );

    const makeTopUpTransaction = useCallback(() => {
        openModal((modal) => (
            <ModalVoucherTransaction
                modal={modal}
                target={'top_up'}
                voucher={voucher}
                onCreated={fetchVoucher}
                organization={activeOrganization}
            />
        ));
    }, [activeOrganization, fetchVoucher, openModal, voucher]);

    const makeTransaction = useCallback(() => {
        openModal((modal) => (
            <ModalVoucherTransaction
                modal={modal}
                voucher={voucher}
                onCreated={fetchVoucher}
                organization={activeOrganization}
            />
        ));
    }, [activeOrganization, fetchVoucher, openModal, voucher]);

    const onOpenAction = useCallback(() => {
        showQrCode(activeOrganization, voucher, fund, fetchVoucher);
    }, [activeOrganization, fetchVoucher, fund, showQrCode, voucher]);

    const onStateChanged = useCallback(
        (promise: Promise<ApiResponseSingle<Voucher>>, action: 'deactivation' | 'activation' = 'deactivation') => {
            promise
                .then((res: ApiResponseSingle<Voucher>) => {
                    setVoucher(res.data.data);

                    if (action == 'deactivation') {
                        pushSuccess('Gelukt!', 'Voucher gedeactiveerd');
                    }

                    if (action == 'activation') {
                        pushSuccess('Gelukt!', 'Voucher geactiveerd');
                    }
                })
                .catch((res: ResponseError) => {
                    const data = res.data;
                    const message = data.errors ? (Object.values(data.errors)[0] || [data.message])[0] : data.message;

                    pushDanger('Mislukt!', message);
                })
                .finally(() => setProgress(100));
        },
        [pushDanger, pushSuccess, setProgress],
    );

    const deactivateVoucher = useCallback(() => {
        openModal((modal) => (
            <ModalVoucherDeactivation
                modal={modal}
                voucher={voucher}
                onSubmit={(data) => {
                    setProgress(0);
                    onStateChanged(voucherService.deactivate(activeOrganization.id, voucher.id, data), 'deactivation');
                }}
            />
        ));
    }, [activeOrganization.id, onStateChanged, openModal, setProgress, voucher, voucherService]);

    const activateVoucher = useCallback(() => {
        openModal((modal) => (
            <ModalVoucherActivate
                modal={modal}
                voucher={voucher}
                onSubmit={(data) => {
                    setProgress(0);
                    onStateChanged(voucherService.activate(activeOrganization.id, voucher.id, data), 'activation');
                }}
            />
        ));
    }, [activeOrganization.id, onStateChanged, openModal, setProgress, voucher, voucherService]);

    const addPhysicalCard = useCallback(() => {
        openModal((modal) => (
            <ModalAddPhysicalCard
                modal={modal}
                voucher={voucher}
                organization={activeOrganization}
                onAttached={fetchVoucher}
            />
        ));
    }, [activeOrganization, fetchVoucher, openModal, voucher]);

    const deletePhysicalCard = useCallback(() => {
        openModal((modal) => (
            <ModalDangerZone
                modal={modal}
                title={translate('modals.modal_voucher_physical_card.delete_card.title', {
                    code: voucher.physical_card.code,
                })}
                description={translate('modals.modal_voucher_physical_card.delete_card.description')}
                buttonCancel={{
                    onClick: modal.close,
                    text: translate('modals.modal_voucher_physical_card.delete_card.cancelButton'),
                }}
                buttonSubmit={{
                    onClick: () => {
                        modal.close();

                        physicalCardService
                            .delete(activeOrganization.id, voucher.id, voucher.physical_card.id)
                            .then(() => fetchVoucher());
                    },
                    text: translate('modals.modal_voucher_physical_card.delete_card.confirmButton'),
                }}
            />
        ));
    }, [
        activeOrganization.id,
        fetchVoucher,
        openModal,
        physicalCardService,
        translate,
        voucher?.id,
        voucher?.physical_card.code,
        voucher?.physical_card.id,
    ]);

    const orderPhysicalCard = useCallback(() => {
        openModal((modal) => <ModalOrderPhysicalCard modal={modal} voucher={voucher} onRequested={fetchVoucher} />);
    }, [fetchVoucher, openModal, voucher]);

    const submitLimitMultiplier = useCallback(
        (value) => {
            openModal((modal) => (
                <ModalDangerZone
                    modal={modal}
                    title={translate('modals.danger_zone.increase_limit_multiplier.title')}
                    description={translate('modals.danger_zone.increase_limit_multiplier.description')}
                    buttonCancel={{
                        onClick: modal.close,
                        text: translate('modals.danger_zone.increase_limit_multiplier.buttons.cancel'),
                    }}
                    buttonSubmit={{
                        onClick: () => {
                            setProgress(0);
                            modal.close();

                            voucherService
                                .update(activeOrganization.id, voucher.id, { limit_multiplier: value })
                                .then((res) => {
                                    setVoucher(res.data.data);
                                    pushSuccess('Opgeslagen!');
                                })
                                .catch((err: ResponseError) => pushDanger('Mislukt!', err.data?.message))
                                .finally(() => setProgress(100));
                        },
                        text: translate('modals.danger_zone.increase_limit_multiplier.buttons.confirm'),
                    }}
                />
            ));
        },
        [activeOrganization.id, openModal, pushDanger, pushSuccess, setProgress, translate, voucher, voucherService],
    );

    useEffect(() => {
        fetchVoucher();
    }, [fetchVoucher]);

    useEffect(() => {
        voucher && fetchFund(voucher);
    }, [fetchFund, voucher]);

    useEffect(() => {
        eventLogsBlock.current?.();
        transactionsBlock.current?.();
        reservationTransactionsBlock.current?.();
    }, [voucher]);

    if (!voucher || !fund) {
        return <LoadingCard />;
    }

    return (
        <Fragment>
            <div className="block block-breadcrumbs">
                {!voucher.product && (
                    <StateNavLink
                        name={'vouchers'}
                        params={{ organizationId: activeOrganization.id }}
                        activeExact={true}
                        className="breadcrumb-item">
                        Vouchers
                    </StateNavLink>
                )}

                {voucher.product && (
                    <StateNavLink
                        name={'product-vouchers'}
                        params={{ organizationId: activeOrganization.id }}
                        activeExact={true}
                        className="breadcrumb-item">
                        Aanbiedingsvouchers
                    </StateNavLink>
                )}

                <div className="breadcrumb-item active">{`${strLimit(voucher.fund.name, 50)} #${voucher.id}`}</div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="flex">
                        <div className="flex flex-grow">
                            <div className="card-title">
                                <div className="flex flex-vertical flex-center">
                                    {`${strLimit(voucher.fund.name, 50)} #${voucher.id}`}
                                </div>
                                <div className="flex flex-vertical flex-center">
                                    {!voucher.expired && voucher.state == 'active' && (
                                        <div className="tag tag-success tag-sm">{voucher.state_locale}</div>
                                    )}
                                </div>
                                <div className="flex flex-vertical flex-center">
                                    {!voucher.expired && voucher.state == 'pending' && (
                                        <div className="tag tag-default tag-sm">{voucher.state_locale}</div>
                                    )}
                                </div>
                                <div className="flex flex-vertical flex-center">
                                    {!voucher.expired && voucher.state == 'deactivated' && (
                                        <div className="tag tag-danger tag-sm">{voucher.state_locale}</div>
                                    )}
                                </div>
                                <div className="flex flex-vertical flex-center">
                                    {voucher.expired && (
                                        <div className="tag tag-warning tag-sm">
                                            {translate('vouchers.labels.expired')}
                                        </div>
                                    )}
                                </div>
                                &nbsp;&nbsp;
                                {voucher.fund.type == 'budget' && (
                                    <span className="text-primary">{voucher.amount_total_locale}</span>
                                )}
                            </div>
                        </div>

                        {hasPermission(activeOrganization, 'manage_vouchers') && (
                            <div className="flex flex-self-start">
                                <div className="flex-row">
                                    <div className="button-group">
                                        {showMakeTransactionButton && fund?.allow_voucher_top_ups && (
                                            <div
                                                className="button button-default button-sm"
                                                onClick={makeTopUpTransaction}>
                                                <em className="mdi mdi-cash-plus icon-start" />
                                                {translate('vouchers.buttons.make_top_up_transaction')}
                                            </div>
                                        )}

                                        {showMakeTransactionButton && (
                                            <div className="button button-primary button-sm" onClick={makeTransaction}>
                                                <em className="mdi mdi-cash-fast icon-start" />
                                                {translate('vouchers.buttons.make_transaction')}
                                            </div>
                                        )}

                                        {!voucher.expired && voucher.state === 'active' && (
                                            <div className="button button-danger button-sm" onClick={deactivateVoucher}>
                                                <em className="mdi mdi-close icon-start" />
                                                Deactiveren
                                            </div>
                                        )}

                                        {!voucher.expired &&
                                            voucher.state === 'deactivated' &&
                                            !voucher.is_external && (
                                                <div
                                                    className="button button-danger button-sm"
                                                    onClick={activateVoucher}>
                                                    <em className="mdi mdi-alert-outline icon-start" />
                                                    Activeren
                                                </div>
                                            )}

                                        {physicalCardsAvailable && !voucher.expired && (
                                            <div
                                                className="button button-default button-sm"
                                                onClick={orderPhysicalCard}>
                                                <em className="mdi mdi-card-text-outline icon-start" />
                                                Plastic pas bestellen
                                            </div>
                                        )}

                                        {physicalCardsAvailable && !voucher.physical_card && (
                                            <div className="button button-default button-sm" onClick={addPhysicalCard}>
                                                <em className="mdi mdi-ticket-account icon-start" />
                                                {translate('vouchers.buttons.physical_card_add')}
                                            </div>
                                        )}

                                        {physicalCardsAvailable && voucher.physical_card && (
                                            <div
                                                className="button button-default button-sm"
                                                onClick={deletePhysicalCard}>
                                                <em className="mdi mdi-ticket-account icon-start" />
                                                {translate('vouchers.buttons.physical_card_delete')}
                                            </div>
                                        )}

                                        {!voucher.expired &&
                                            !voucher.is_granted &&
                                            voucher.state === 'pending' &&
                                            !voucher.is_external && (
                                                <div className="button button-primary button-sm" onClick={onOpenAction}>
                                                    <em className="mdi mdi-clipboard-account icon-start " />
                                                    {translate('vouchers.buttons.activate')}
                                                </div>
                                            )}

                                        {!voucher.is_granted &&
                                            !voucher.expired &&
                                            voucher.state === 'active' &&
                                            !voucher.is_external && (
                                                <div className="button button-primary button-sm" onClick={onOpenAction}>
                                                    <em className="mdi mdi-qrcode icon-start " />
                                                    {translate('vouchers.labels.qr_code')}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card-section">
                    <div className="card-block card-block-keyvalue">
                        <div className="keyvalue-item">
                            <div className="keyvalue-key">{translate('vouchers.labels.id')}</div>
                            <div className="keyvalue-value text-black">{voucher.id}</div>
                        </div>

                        <div className="keyvalue-item">
                            <div className="keyvalue-key">{translate('vouchers.labels.email')}</div>
                            <div className="keyvalue-value text-muted-dark">
                                {voucher.identity_email || 'Niet toegewezen'}
                            </div>
                        </div>

                        {(voucher.identity_bsn || voucher.relation_bsn) && (
                            <div className="keyvalue-item">
                                <div className="keyvalue-key">{translate('vouchers.labels.bsn')}</div>
                                <div className="keyvalue-value">{voucher.identity_bsn || voucher.relation_bsn}</div>
                            </div>
                        )}

                        {voucher.physical_card && (
                            <div className="keyvalue-item">
                                <div className="keyvalue-key">{translate('vouchers.labels.physical_card')}</div>
                                <div className="keyvalue-value">{voucher.physical_card.code}</div>
                            </div>
                        )}

                        {voucher.activation_code && (
                            <div className="keyvalue-item">
                                <div className="keyvalue-key">
                                    {translate('vouchers.labels.details_activation_code')}
                                </div>
                                <div className="keyvalue-value">{voucher.activation_code}</div>
                            </div>
                        )}

                        {voucher.client_uid && (
                            <div className="keyvalue-item">
                                <div className="keyvalue-key">{translate('vouchers.labels.uid')}</div>
                                <div className="keyvalue-value">{voucher.client_uid}</div>
                            </div>
                        )}

                        {voucher.fund.type == 'subsidies' && (
                            <div className="keyvalue-item">
                                <div className="keyvalue-key">{translate('vouchers.labels.limit_multiplier')}</div>
                                {hasPermission(activeOrganization, 'manage_vouchers') ? (
                                    <div className="keyvalue-value">
                                        <div className="form">
                                            <NumericControl
                                                minValue={1}
                                                maxValue={1000}
                                                value={voucher.limit_multiplier}
                                                applyText={'Aanpassen'}
                                                onSubmit={submitLimitMultiplier}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="keyvalue-value">{voucher.limit_multiplier}</div>
                                )}
                            </div>
                        )}

                        {voucher.product && (
                            <div className="keyvalue-item">
                                <div className="keyvalue-key">{translate('vouchers.labels.provider_name')}</div>
                                <div className="keyvalue-value text-black">
                                    {voucher.product.organization.name || 'Niet aanbieder'}
                                </div>
                            </div>
                        )}

                        {voucher.product && (
                            <div className="keyvalue-item">
                                <div className="keyvalue-key">{translate('vouchers.labels.product_name')}</div>
                                <div className="keyvalue-value text-black">{voucher.product.name}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="flex">
                        <div className="flex flex-grow">
                            <div className="card-title">
                                <div className="flex flex-vertical flex-center">Voucher details</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-section">
                    <div className="card-block card-block-table">
                        <div className="table-wrapper">
                            <table className="table table-fixed table-align-top">
                                <tbody>
                                    <tr>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('vouchers.labels.expire_at')}
                                            </strong>
                                            <br />
                                            <strong className="text-black">{voucher.expire_at_locale}</strong>
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('vouchers.labels.created_at')}
                                            </strong>
                                            <br />
                                            <strong className="text-black">
                                                {voucher.created_at_locale.split(' - ')[1]}
                                            </strong>
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('vouchers.labels.source')}
                                            </strong>
                                            <br />
                                            <strong className="text-black">{voucher.source_locale}</strong>
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('vouchers.labels.in_use')}
                                            </strong>
                                            <br />
                                            <em className="mdi mdi-close text-black" />
                                            <strong className="text-black">
                                                {!voucher.in_use
                                                    ? translate('product_vouchers.labels.no')
                                                    : translate('product_vouchers.labels.yes')}
                                            </strong>
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('vouchers.labels.used_date')}
                                            </strong>
                                            <br />
                                            {voucher.first_use_date_locale ? (
                                                <div>
                                                    <strong className="text-black">
                                                        {voucher.first_use_date_locale}
                                                    </strong>
                                                </div>
                                            ) : (
                                                <div>
                                                    <em className="mdi mdi-close text-black" />
                                                    <strong className="text-black">
                                                        {translate('product_vouchers.labels.no')}
                                                    </strong>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <strong className="text-strong text-md text-primary">
                                                {translate('vouchers.labels.has_payouts')}
                                            </strong>
                                            <br />
                                            <em className="mdi mdi-close text-black" />
                                            <strong className="text-black">
                                                {!voucher.has_payouts
                                                    ? translate('vouchers.labels.no')
                                                    : translate('vouchers.labels.yes')}
                                            </strong>
                                        </td>
                                    </tr>

                                    {!voucher.product && voucher.fund.type != 'subsidies' && (
                                        <tr>
                                            <td>
                                                <strong className="text-strong text-md text-primary">
                                                    Totaal toegekend
                                                </strong>
                                                <br />
                                                <strong className="text-black">{voucher.amount_total_locale}</strong>
                                            </td>
                                            <td>
                                                <strong className="text-strong text-md text-primary">
                                                    Initieel toegekend
                                                </strong>
                                                <br />
                                                <strong className="text-black">{voucher.amount_locale}</strong>
                                            </td>
                                            <td>
                                                <strong className="text-strong text-md text-primary">
                                                    Totaal opgewaardeerd
                                                </strong>
                                                <br />
                                                <strong className="text-black">{voucher.amount_top_up_locale}</strong>
                                            </td>
                                            <td>
                                                <strong className="text-strong text-md text-primary">
                                                    Huidig bedrag
                                                </strong>
                                                <br />
                                                <strong className="text-black">
                                                    {voucher.amount_available_locale}
                                                </strong>
                                            </td>
                                            <td>
                                                <strong className="text-strong text-md text-primary">
                                                    Uitgegeven bedrag
                                                </strong>
                                                <br />
                                                <strong className="text-black">{voucher.amount_spent_locale}</strong>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {voucher.fund.allow_voucher_records && (
                <VoucherRecords voucher={voucher} organization={activeOrganization} />
            )}

            <EventLogsTable
                title={'Geschiedenis'}
                loggable={['voucher']}
                loggableId={voucher.id}
                organization={activeOrganization}
                hideEntity={true}
                hideFilterDropdown={true}
                fetchEventLogsRef={eventLogsBlock}
            />

            {voucher.note && (
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">{translate('vouchers.labels.note')}</div>
                    </div>

                    <div className="card-section">
                        <div className="card-text">{voucher.note}</div>
                    </div>
                </div>
            )}

            {hasPermission(activeOrganization, 'manage_vouchers') && (
                <Fragment>
                    <VoucherTransactions
                        organization={activeOrganization}
                        blockTitle={'Transacties'}
                        filterValues={transactionsFilters.activeValues}
                        fetchTransactionsRef={transactionsBlock}
                    />

                    <VoucherTransactions
                        organization={activeOrganization}
                        blockTitle={'Reserveringen'}
                        filterValues={reservationTransactionsFilters.activeValues}
                        fetchTransactionsRef={reservationTransactionsBlock}
                    />
                </Fragment>
            )}
        </Fragment>
    );
}
