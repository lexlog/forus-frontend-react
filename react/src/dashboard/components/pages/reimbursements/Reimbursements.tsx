import React, { Fragment, useCallback, useEffect, useState } from 'react';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import { PaginationData } from '../../../props/ApiResponses';
import FundSelector from '../../elements/fund-selector/FundSelector';
import Fund from '../../../props/models/Fund';
import Reimbursement from '../../../props/models/Reimbursement';
import { useReimbursementsService } from '../../../services/ReimbursementService';
import useFilter from '../../../hooks/useFilter';
import usePaginatorService from '../../../modules/paginator/services/usePaginatorService';
import { useFundService } from '../../../services/FundService';
import FilterItemToggle from '../../elements/tables/elements/FilterItemToggle';
import SelectControl from '../../elements/select-control/SelectControl';
import SelectControlOptions from '../../elements/select-control/templates/SelectControlOptions';
import { strLimit } from '../../../helpers/string';
import Paginator from '../../../modules/paginator/components/Paginator';
import { hasPermission } from '../../../helpers/utils';
import EmptyCard from '../../elements/empty-card/EmptyCard';
import { getStateRouteUrl } from '../../../modules/state_router/Router';
import ClickOutside from '../../elements/click-outside/ClickOutside';
import useReimbursementExportService from '../../../services/exports/useReimbursementExportService';
import useImplementationService from '../../../services/ImplementationService';
import DatePickerControl from '../../elements/forms/controls/DatePickerControl';
import { dateFormat, dateParse } from '../../../helpers/dates';
import Implementation from '../../../props/models/Implementation';
import useSetProgress from '../../../hooks/useSetProgress';
import LoadingCard from '../../elements/loading-card/LoadingCard';
import useTranslate from '../../../hooks/useTranslate';
import classNames from 'classnames';
import TableEmptyValue from '../../elements/table-empty-value/TableEmptyValue';

export default function Reimbursements() {
    const activeOrganization = useActiveOrganization();

    const translate = useTranslate();
    const setProgress = useSetProgress();

    const fundService = useFundService();
    const paginatorService = usePaginatorService();
    const reimbursementService = useReimbursementsService();
    const implementationService = useImplementationService();
    const reimbursementExportService = useReimbursementExportService();

    const [fund, setFund] = useState<Fund>(null);
    const [funds, setFunds] = useState<PaginationData<Fund>>(null);
    const [paginatorKey] = useState('reimbursements');
    const [implementations, setImplementations] = useState<Array<Partial<Implementation>>>(null);
    const [reimbursements, setReimbursements] = useState<PaginationData<Reimbursement>>(null);

    const [stateLabels] = useState({
        pending: 'label-default',
        approved: 'label-success',
        declined: 'label-danger',
    });

    const [statesOptions] = useState(reimbursementService.getStateOptions());
    const [expiredOptions] = useState(reimbursementService.getExpiredOptions());
    const [archivedOptions] = useState(reimbursementService.getArchivedOptions());
    const [deactivatedOptions] = useState(reimbursementService.getDeactivatedOptions());

    const filter = useFilter({
        q: '',
        implementation_id: null,
        state: null,
        amount_min: null,
        amount_max: null,
        expired: null,
        archived: 0,
        deactivated: null,
        from: null,
        to: null,
        fund_id: null,
        page: 1,
        per_page: paginatorService.getPerPage(paginatorKey, 10),
    });

    const setArchivedOption = useCallback(
        (archived: number) => {
            filter.update({
                expired: null,
                archived: archived,
                deactivated: null,
            });
        },
        [filter],
    );

    const fetchFunds = useCallback(() => {
        fundService.list(activeOrganization.id, { per_page: 100, configured: 1 }).then((res) => {
            setFunds(res.data);
            setFund(fundService.getLastSelectedFund(res.data.data) || res.data.data[0]);
        });
    }, [activeOrganization.id, fundService]);

    const fetchReimbursements = useCallback(() => {
        setProgress(0);

        reimbursementService
            .list(activeOrganization.id, { ...filter.activeValues, fund_id: fund?.id })
            .then((res) => setReimbursements(res.data))
            .finally(() => setProgress(100));
    }, [setProgress, activeOrganization.id, filter.activeValues, fund?.id, reimbursementService]);

    const fetchImplementations = useCallback(() => {
        implementationService
            .list(activeOrganization.id, { per_page: 100 })
            .then((res) => setImplementations([{ id: null, name: 'Alle implementaties...' }, ...res.data.data]));
    }, [activeOrganization.id, implementationService]);

    const exportReimbursements = useCallback(() => {
        reimbursementExportService.exportData(activeOrganization.id, {
            ...filter.activeValues,
            per_page: null,
        });
    }, [activeOrganization.id, filter.activeValues, reimbursementExportService]);

    const onFundSelect = useCallback((fund: Fund) => {
        setFund(fund);
    }, []);

    useEffect(() => {
        fetchFunds();
    }, [fetchFunds]);

    useEffect(() => {
        fetchReimbursements();
    }, [fetchReimbursements]);

    useEffect(() => {
        fetchImplementations();
    }, [fetchImplementations]);

    if (!reimbursements) {
        return <LoadingCard />;
    }

    return (
        <Fragment>
            <FundSelector fund={fund} funds={funds?.data} onSelectFund={onFundSelect} />

            <div className="card">
                <div className="card-header">
                    <div className="flex-row">
                        <div className="flex-col flex-grow">
                            <div className="card-title">
                                {translate('reimbursements.header.title')} ({reimbursements?.meta?.total})
                            </div>
                        </div>

                        <div className="flex">
                            <div className="block block-inline-filters">
                                <StateNavLink
                                    name="reimbursement-categories"
                                    params={{ organizationId: activeOrganization.id }}
                                    className="button button-default button-sm">
                                    <em className="mdi mdi-cog icon-start" />
                                    Categorieën
                                </StateNavLink>

                                <div className="flex form">
                                    <div>
                                        <div className="block block-label-tabs">
                                            <div className="label-tab-set">
                                                {archivedOptions.map((viewType) => (
                                                    <div
                                                        key={viewType.value}
                                                        onClick={() => setArchivedOption(viewType.value)}
                                                        className={`label-tab label-tab-sm ${
                                                            filter.values.archived == viewType.value ? 'active' : ''
                                                        }`}
                                                        data-dusk={`${
                                                            viewType.value
                                                                ? 'reimbursementsFilterArchived'
                                                                : 'reimbursementsFilterActive'
                                                        }`}>
                                                        {viewType.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {filter.show && (
                                    <div className="button button-text" onClick={filter.resetFilters}>
                                        <em className="mdi mdi-close icon-start" />
                                        <span>{translate('reimbursements.buttons.clear_filter')}</span>
                                    </div>
                                )}

                                {!filter.show && (
                                    <div className="form">
                                        <div className="form-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={filter.values.q}
                                                data-dusk="searchReimbursement"
                                                placeholder={translate('reimbursements.labels.search')}
                                                onChange={(e) => filter.update({ q: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                <ClickOutside className="form" onClickOutside={() => filter.setShow(false)}>
                                    <div className="inline-filters-dropdown pull-right">
                                        {filter.show && (
                                            <div className="inline-filters-dropdown-content">
                                                <div className="arrow-box bg-dim">
                                                    <div className="arrow" />
                                                </div>

                                                <div className="form">
                                                    <FilterItemToggle
                                                        show={true}
                                                        label={translate('reimbursements.labels.search')}>
                                                        <input
                                                            className="form-control"
                                                            data-dusk="searchReimbursement"
                                                            value={filter.values.q}
                                                            onChange={(e) => filter.update({ q: e.target.value })}
                                                            placeholder={translate('reimbursements.labels.search')}
                                                        />
                                                    </FilterItemToggle>

                                                    <FilterItemToggle label={translate('reimbursements.labels.state')}>
                                                        <SelectControl
                                                            className="form-control"
                                                            propKey={'value'}
                                                            allowSearch={false}
                                                            value={filter.values.state}
                                                            options={statesOptions}
                                                            optionsComponent={SelectControlOptions}
                                                            onChange={(state: string) => filter.update({ state })}
                                                        />
                                                    </FilterItemToggle>

                                                    {filter.values.archived == 1 && (
                                                        <Fragment>
                                                            <FilterItemToggle
                                                                label={translate('reimbursements.labels.expired')}>
                                                                <SelectControl
                                                                    className="form-control"
                                                                    propKey={'value'}
                                                                    allowSearch={false}
                                                                    value={filter.values.expired}
                                                                    options={expiredOptions}
                                                                    optionsComponent={SelectControlOptions}
                                                                    onChange={(expired: string) =>
                                                                        filter.update({ expired })
                                                                    }
                                                                />
                                                            </FilterItemToggle>

                                                            <FilterItemToggle
                                                                label={translate('reimbursements.labels.deactivated')}>
                                                                <SelectControl
                                                                    className="form-control"
                                                                    propKey={'value'}
                                                                    allowSearch={false}
                                                                    value={filter.values.deactivated}
                                                                    options={deactivatedOptions}
                                                                    optionsComponent={SelectControlOptions}
                                                                    onChange={(deactivated: string) =>
                                                                        filter.update({ deactivated })
                                                                    }
                                                                />
                                                            </FilterItemToggle>
                                                        </Fragment>
                                                    )}

                                                    <FilterItemToggle label={translate('transactions.labels.amount')}>
                                                        <div className="row">
                                                            <div className="col col-lg-6">
                                                                <input
                                                                    className="form-control"
                                                                    min={0}
                                                                    type="number"
                                                                    value={filter.values.amount_min || ''}
                                                                    onChange={(e) =>
                                                                        filter.update({
                                                                            amount_min: e.target.value,
                                                                        })
                                                                    }
                                                                    placeholder={translate(
                                                                        'transactions.labels.amount_min',
                                                                    )}
                                                                />
                                                            </div>

                                                            <div className="col col-lg-6">
                                                                <input
                                                                    className="form-control"
                                                                    min={0}
                                                                    type="number"
                                                                    value={filter.values.amount_max || ''}
                                                                    onChange={(e) =>
                                                                        filter.update({
                                                                            amount_max: e.target.value,
                                                                        })
                                                                    }
                                                                    placeholder={translate(
                                                                        'transactions.labels.amount_max',
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    </FilterItemToggle>

                                                    <FilterItemToggle label={translate('reimbursements.labels.from')}>
                                                        <DatePickerControl
                                                            value={dateParse(filter.values.from)}
                                                            placeholder={translate('yyyy-MM-dd')}
                                                            onChange={(from: Date) => {
                                                                filter.update({ from: dateFormat(from) });
                                                            }}
                                                        />
                                                    </FilterItemToggle>

                                                    <FilterItemToggle label={translate('reimbursements.labels.to')}>
                                                        <DatePickerControl
                                                            value={dateParse(filter.values.to)}
                                                            placeholder={translate('yyyy-MM-dd')}
                                                            onChange={(to: Date) => {
                                                                filter.update({ to: dateFormat(to) });
                                                            }}
                                                        />
                                                    </FilterItemToggle>

                                                    <FilterItemToggle
                                                        label={translate('reimbursements.labels.implementation')}>
                                                        <SelectControl
                                                            className="form-control"
                                                            propKey={'id'}
                                                            allowSearch={false}
                                                            value={filter.values.implementation_id}
                                                            options={implementations}
                                                            optionsComponent={SelectControlOptions}
                                                            onChange={(implementation_id: string) =>
                                                                filter.update({ implementation_id })
                                                            }
                                                        />
                                                    </FilterItemToggle>

                                                    <div className="form-actions">
                                                        <button
                                                            className="button button-primary button-wide"
                                                            onClick={() => exportReimbursements()}
                                                            disabled={reimbursements.meta.total == 0}>
                                                            <em className="mdi mdi-download icon-start"> </em>
                                                            {translate('components.dropdown.export', {
                                                                total: reimbursements.meta.total,
                                                            })}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div
                                            onClick={() => filter.setShow(!filter.show)}
                                            className="button button-default button-icon">
                                            <em className="mdi mdi-filter-outline" />
                                        </div>
                                    </div>
                                </ClickOutside>
                            </div>
                        </div>
                    </div>
                </div>

                {reimbursements.data.length > 0 && (
                    <div className="card-section" data-dusk="reimbursementsList">
                        <div className="card-block card-block-table">
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>{translate('reimbursements.labels.identity')}</th>
                                            <th>{translate('reimbursements.labels.fund')}</th>
                                            <th>{translate('reimbursements.labels.amount')}</th>
                                            <th>{translate('reimbursements.labels.created_at')}</th>
                                            <th>{translate('reimbursements.labels.lead_time')}</th>
                                            <th>{translate('reimbursements.labels.employee')}</th>
                                            <th>{translate('reimbursements.labels.expired')}</th>
                                            <th>{translate('reimbursements.labels.state')}</th>
                                            <th>{translate('reimbursements.labels.transaction')}</th>
                                            <th className="nowrap text-right">
                                                {translate('reimbursements.labels.actions')}
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {reimbursements.data.map((reimbursement) => (
                                            <StateNavLink
                                                customElement={'tr'}
                                                name={'reimbursements-view'}
                                                params={{ id: reimbursement.id, organizationId: activeOrganization.id }}
                                                key={reimbursement.id}
                                                dataDusk={`reimbursement${reimbursement.id}`}
                                                className={classNames(
                                                    'clickable',
                                                    reimbursement.expired && 'tr-warning',
                                                )}>
                                                <td>
                                                    {/* Email */}
                                                    <div
                                                        className="text-primary text-medium"
                                                        data-dusk={`reimbursementIdentityEmail${reimbursement.id}`}>
                                                        {strLimit(reimbursement.identity_email, 25) || 'Geen E-mail'}
                                                    </div>

                                                    {/* BSN */}
                                                    {activeOrganization.bsn_enabled && (
                                                        <div className="text-strong text-md text-muted-dark">
                                                            {reimbursement.identity_bsn
                                                                ? 'BSN: ' + reimbursement.identity_bsn
                                                                : 'Geen BSN'}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="text-primary text-medium">
                                                        {strLimit(reimbursement.fund.name, 25)}
                                                    </div>
                                                    <div className="text-strong text-md text-muted-dark">
                                                        {strLimit(reimbursement.implementation_name, 25)}
                                                    </div>
                                                </td>

                                                {/* Amount */}
                                                <td
                                                    className="nowrap"
                                                    data-dusk={'reimbursementAmount' + reimbursement.id}>
                                                    {reimbursement.amount_locale}
                                                </td>

                                                <td>
                                                    <div className="text-primary text-medium">
                                                        {reimbursement.created_at_locale.split(' - ')[0]}
                                                    </div>
                                                    <div className="text-strong text-md text-muted-dark">
                                                        {reimbursement.created_at_locale.split(' - ')[1]}
                                                    </div>
                                                </td>

                                                <td>{reimbursement.lead_time_locale}</td>

                                                <td
                                                    className={
                                                        reimbursement.employee ? 'text-primary' : 'text-muted-dark'
                                                    }>
                                                    {strLimit(reimbursement.employee?.email || 'Niet toegewezen', 25)}
                                                </td>

                                                <td
                                                    className={
                                                        reimbursement.expired ? 'text-primary' : 'text-muted-dark'
                                                    }>
                                                    {reimbursement.expired ? 'Ja' : 'Nee'}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`label ${stateLabels[reimbursement.state] || ''}`}
                                                        data-dusk={`reimbursementState${reimbursement.id}`}>
                                                        {reimbursement.state_locale}
                                                    </span>
                                                </td>

                                                <td>
                                                    {reimbursement.voucher_transaction?.state == 'pending' && (
                                                        <span className="label label-default">
                                                            {reimbursement.voucher_transaction.state_locale}
                                                        </span>
                                                    )}

                                                    {reimbursement.voucher_transaction?.state == 'success' && (
                                                        <span className="label label-success">
                                                            {reimbursement.voucher_transaction.state_locale}
                                                        </span>
                                                    )}

                                                    {reimbursement.voucher_transaction?.state == 'canceled' && (
                                                        <span className="label label-danger">
                                                            {reimbursement.voucher_transaction.state_locale}
                                                        </span>
                                                    )}

                                                    {!reimbursement.voucher_transaction && <TableEmptyValue />}
                                                </td>

                                                <td>
                                                    <div className="button-group flex-end">
                                                        <StateNavLink
                                                            name={'reimbursements-view'}
                                                            params={{
                                                                id: reimbursement.id,
                                                                organizationId: activeOrganization.id,
                                                            }}
                                                            className="button button-primary button-icon pull-right">
                                                            <em className="mdi mdi-eye-outline icon-start" />
                                                        </StateNavLink>
                                                    </div>
                                                </td>
                                            </StateNavLink>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {reimbursements.meta.total == 0 && (
                    <EmptyCard type={'card-section'} title={'Geen declaraties gevonden'} />
                )}

                {reimbursements.meta && (
                    <div className="card-section">
                        <Paginator
                            meta={reimbursements.meta}
                            filters={filter.values}
                            updateFilters={filter.update}
                            perPageKey={paginatorKey}
                        />
                    </div>
                )}
            </div>

            {funds?.data.length == 0 && (
                <Fragment>
                    {hasPermission(activeOrganization, 'manage_funds') ? (
                        <EmptyCard
                            description={'Je hebt momenteel geen fondsen.'}
                            button={{
                                text: 'Fonds toevoegen',
                                to: getStateRouteUrl('organization-funds', {
                                    organizationId: activeOrganization.id,
                                }),
                            }}
                        />
                    ) : (
                        <EmptyCard description={'Je hebt momenteel geen fondsen.'} />
                    )}
                </Fragment>
            )}
        </Fragment>
    );
}
