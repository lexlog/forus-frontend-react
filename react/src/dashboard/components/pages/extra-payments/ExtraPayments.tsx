import React, { useCallback, useEffect, useState } from 'react';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import { useTranslation } from 'react-i18next';
import LoadingCard from '../../elements/loading-card/LoadingCard';
import useSetProgress from '../../../hooks/useSetProgress';
import useExtraPaymentService from '../../../services/ExtraPaymentService';
import ExtraPayment from '../../../props/models/ExtraPayment';
import { PaginationData } from '../../../props/ApiResponses';
import useFilter from '../../../hooks/useFilter';
import ThSortable from '../../elements/tables/ThSortable';
import { strLimit } from '../../../helpers/string';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import Paginator from '../../../modules/paginator/components/Paginator';
import FilterItemToggle from '../../elements/tables/elements/FilterItemToggle';
import SelectControl from '../../elements/select-control/SelectControl';
import SelectControlOptions from '../../elements/select-control/templates/SelectControlOptions';
import CardHeaderFilter from '../../elements/tables/elements/CardHeaderFilter';
import Fund from '../../../props/models/Fund';
import { useFundService } from '../../../services/FundService';
import usePaginatorService from '../../../modules/paginator/services/usePaginatorService';

export default function ExtraPayments() {
    const { t } = useTranslation();
    const fundService = useFundService();
    const activeOrganization = useActiveOrganization();
    const extraPaymentService = useExtraPaymentService();
    const setProgress = useSetProgress();
    const paginatorService = usePaginatorService();

    const [loading, setLoading] = useState(false);
    const [funds, setFunds] = useState(null);
    const [paginatorKey] = useState('extra_payments');
    const [extraPayments, setExtraPayments] = useState<PaginationData<ExtraPayment>>(null);

    const filter = useFilter({
        q: '',
        fund_id: null,
        per_page: paginatorService.getPerPage(paginatorKey),
        order_by: 'paid_at',
        order_dir: 'desc',
    });

    const fetchExtraPayments = useCallback(() => {
        setProgress(0);
        setLoading(true);

        extraPaymentService
            .list(activeOrganization.id, filter.activeValues)
            .then((res) => setExtraPayments(res.data))
            .finally(() => {
                setLoading(false);
                setProgress(100);
            });
    }, [extraPaymentService, activeOrganization.id, setProgress, filter?.activeValues]);

    const fetchFunds = useCallback(
        async (query: object): Promise<Array<Fund>> => {
            setProgress(0);

            return fundService
                .list(activeOrganization.id, query)
                .then((res) => res.data.data)
                .finally(() => setProgress(100));
        },
        [activeOrganization.id, fundService, setProgress],
    );

    useEffect(() => {
        fetchExtraPayments();
    }, [fetchExtraPayments]);

    useEffect(() => {
        fetchFunds({}).then((funds) => setFunds([{ id: null, name: 'Selecteer fond' }, ...funds]));
    }, [fetchFunds]);

    if (!extraPayments) {
        return <LoadingCard />;
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="flex-row">
                    <div className="flex flex-grow">
                        <div className="card-title">
                            {t('extra_payments.header.title')} ({extraPayments.meta.total})
                        </div>
                    </div>
                    <div className="flex">
                        <div className="block block-inline-filters">
                            {filter.show && (
                                <button
                                    className="button button-text"
                                    onClick={() => {
                                        filter.resetFilters();
                                        filter.setShow(false);
                                    }}>
                                    <em className="mdi mdi-close icon-start" />
                                    {t('extra_payments.buttons.clear_filter')}
                                </button>
                            )}

                            {!filter.show && (
                                <div className="form">
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={filter.values.q}
                                            onChange={(e) => filter.update({ q: e.target.value })}
                                            placeholder={t('extra_payments.labels.search')}
                                        />
                                    </div>
                                </div>
                            )}

                            <CardHeaderFilter filter={filter}>
                                <FilterItemToggle show={true} label={t('extra_payments.labels.search')}>
                                    <input
                                        type="text"
                                        value={filter.values?.q}
                                        onChange={(e) => filter.update({ q: e.target.value })}
                                        placeholder={t('extra_payments.labels.search')}
                                        className="form-control"
                                    />
                                </FilterItemToggle>
                                <FilterItemToggle label={t('extra_payments.labels.fund')}>
                                    <SelectControl
                                        className={'form-control'}
                                        options={funds}
                                        propKey={'id'}
                                        allowSearch={false}
                                        optionsComponent={SelectControlOptions}
                                        onChange={(fund_id: string) => filter.update({ fund_id })}
                                    />
                                </FilterItemToggle>
                            </CardHeaderFilter>
                        </div>
                    </div>
                </div>
            </div>

            {!loading && extraPayments?.meta.total > 0 && (
                <div className="card-section">
                    <div className="card-block card-block-table">
                        <div className="table-wrapper">
                            <table className="table">
                                <tbody>
                                    <tr>
                                        <ThSortable
                                            className="th-narrow nowrap"
                                            filter={filter}
                                            label={t('extra_payments.labels.id')}
                                            value="id"
                                        />

                                        <ThSortable
                                            className={'nowrap'}
                                            filter={filter}
                                            label={t('extra_payments.labels.price')}
                                            value="price"
                                        />

                                        <ThSortable
                                            className={'nowrap'}
                                            filter={filter}
                                            label={t('extra_payments.labels.amount_extra')}
                                            value="amount"
                                        />

                                        <ThSortable
                                            className={'nowrap'}
                                            filter={filter}
                                            label={t('extra_payments.labels.method')}
                                            value="method"
                                        />

                                        <ThSortable
                                            className={'nowrap'}
                                            filter={filter}
                                            label={t('extra_payments.labels.paid_at')}
                                            value="paid_at"
                                        />

                                        <ThSortable
                                            className={'nowrap'}
                                            filter={filter}
                                            label={t('extra_payments.labels.fund')}
                                            value="fund_name"
                                        />

                                        <ThSortable
                                            className={'nowrap'}
                                            filter={filter}
                                            label={t('extra_payments.labels.product')}
                                            value="product_name"
                                        />

                                        <ThSortable
                                            className={'nowrap'}
                                            filter={filter}
                                            label={t('extra_payments.labels.provider')}
                                            value="provider_name"
                                        />

                                        <ThSortable
                                            className={'th-narrow text-right'}
                                            filter={filter}
                                            label={t('extra_payments.labels.actions')}
                                        />
                                    </tr>
                                    {extraPayments?.data.map((extraPayment) => (
                                        <tr key={extraPayment.id} data-dusk="extraPaymentItem">
                                            <td>{extraPayment.id}</td>
                                            <td>{extraPayment.reservation.price_locale}</td>
                                            <td>{extraPayment.amount_locale}</td>
                                            <td>{extraPayment.method}</td>
                                            <td>
                                                <strong className="text-primary">
                                                    {extraPayment.paid_at_locale.split(' - ')[0]}
                                                </strong>
                                                <br />
                                                <strong className="text-strong text-md text-muted-dark">
                                                    {extraPayment.paid_at_locale.split(' - ')[1]}
                                                </strong>
                                            </td>
                                            <td title={extraPayment.reservation.fund.name || ''}>
                                                {strLimit(extraPayment.reservation.fund.name, 25)}
                                            </td>
                                            <td title={extraPayment.reservation.product?.name || '-'}>
                                                {strLimit(extraPayment.reservation.product?.name || '-', 25)}
                                            </td>
                                            <td title={extraPayment.reservation.product?.organization?.name || '-'}>
                                                {strLimit(
                                                    extraPayment.reservation.product?.organization?.name || '-',
                                                    25,
                                                )}
                                            </td>
                                            <td className="td-narrow text-right">
                                                <StateNavLink
                                                    name="extra-payments-show"
                                                    params={{
                                                        organizationId: activeOrganization.id,
                                                        id: extraPayment.id,
                                                    }}
                                                    className="button button-sm button-primary button-icon pull-right">
                                                    <em className="mdi mdi-eye-outline icon-start" />
                                                </StateNavLink>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {!loading && extraPayments?.meta.last_page > 1 && (
                <div className="card-section">
                    <Paginator
                        meta={extraPayments.meta}
                        filters={filter.values}
                        updateFilters={filter.update}
                        perPageKey={paginatorKey}
                    />
                </div>
            )}

            {!loading && extraPayments.meta.total === 0 && (
                <div className="card-section">
                    <div className="block block-empty text-center">
                        <div className="empty-title">Geen extra payments gevonden</div>
                    </div>
                </div>
            )}
        </div>
    );
}
