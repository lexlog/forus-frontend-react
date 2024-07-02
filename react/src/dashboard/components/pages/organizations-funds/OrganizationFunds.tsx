import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { PaginationData, ResponseError } from '../../../props/ApiResponses';
import Fund from '../../../props/models/Fund';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import { hasPermission } from '../../../helpers/utils';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import { useFundService } from '../../../services/FundService';
import usePaginatorService from '../../../modules/paginator/services/usePaginatorService';
import useFilter from '../../../hooks/useFilter';
import LoadingCard from '../../elements/loading-card/LoadingCard';
import useSetProgress from '../../../hooks/useSetProgress';
import ClickOutside from '../../elements/click-outside/ClickOutside';
import FilterItemToggle from '../../elements/tables/elements/FilterItemToggle';
import SelectControl from '../../elements/select-control/SelectControl';
import SelectControlOptions from '../../elements/select-control/templates/SelectControlOptions';
import useImplementationService from '../../../services/ImplementationService';
import Implementation from '../../../props/models/Implementation';
import { currencyFormat, strLimit } from '../../../helpers/string';
import TableRowActions from '../../elements/tables/TableRowActions';
import usePushSuccess from '../../../hooks/usePushSuccess';
import usePushDanger from '../../../hooks/usePushDanger';
import ModalDangerZone from '../../modals/ModalDangerZone';
import useOpenModal from '../../../hooks/useOpenModal';
import { StringParam, useQueryParams, withDefault } from 'use-query-params';
import Paginator from '../../../modules/paginator/components/Paginator';
import EmptyCard from '../../elements/empty-card/EmptyCard';
import ModalFundTopUp from '../../modals/ModalFundTopUp';
import useTranslate from '../../../hooks/useTranslate';
import useAssetUrl from '../../../hooks/useAssetUrl';
import TableEmptyValue from '../../elements/table-empty-value/TableEmptyValue';

export default function OrganizationFunds() {
    const translate = useTranslate();
    const pushDanger = usePushDanger();
    const setProgress = useSetProgress();
    const pushSuccess = usePushSuccess();
    const assetUrl = useAssetUrl();
    const openModal = useOpenModal();
    const activeOrganization = useActiveOrganization();

    const fundService = useFundService();
    const paginatorService = usePaginatorService();
    const implementationService = useImplementationService();

    const [loading, setLoading] = useState(false);
    const [paginatorKey] = useState<string>('organization_funds');
    const [shownFundMenuId, setShownFundMenuId] = useState<number>(null);
    const [funds, setFunds] = useState<PaginationData<Fund>>(null);
    const [implementations, setImplementations] = useState<Array<Partial<Implementation>>>(null);

    const [topUpInProgress, setTopUpInProgress] = useState(false);

    const [statesOptions] = useState([
        { key: null, name: 'Alle' },
        { key: 'active', name: translate(`components.organization_funds.states.active`) },
        { key: 'paused', name: translate(`components.organization_funds.states.paused`) },
        { key: 'closed', name: translate(`components.organization_funds.states.closed`) },
    ]);

    const [stateLabels] = useState({
        active: 'label-success',
        paused: 'label-warning',
        closed: 'label-default',
    });

    const [{ funds_type }, setQueryParams] = useQueryParams(
        { funds_type: withDefault(StringParam, 'active') },
        { removeDefaultsFromUrl: true },
    );

    const filter = useFilter({
        q: '',
        state: null,
        funds_type: null,
        implementation_id: null,
        per_page: paginatorService.getPerPage(paginatorKey),
    });

    const fetchFunds = useCallback(() => {
        setProgress(0);
        setLoading(true);

        fundService
            .list(activeOrganization.id, {
                ...filter.activeValues,
                with_archived: 1,
                with_external: 1,
                stats: 'min',
                archived: funds_type == 'archived' ? 1 : 0,
                per_page: filter.activeValues.per_page,
            })
            .then((res) => setFunds(res.data))
            .finally(() => {
                setProgress(100);
                setLoading(false);
            });
    }, [activeOrganization.id, filter.activeValues, fundService, funds_type, setProgress]);

    const fetchImplementations = useCallback(() => {
        setProgress(0);

        implementationService
            .list(activeOrganization.id, { per_page: 100 })
            .then((res) => setImplementations([{ id: null, name: 'Alle implementaties' }, ...res.data.data]))
            .finally(() => setProgress(100));
    }, [activeOrganization.id, implementationService, setProgress]);

    const askConfirmation = useCallback(
        (type: string, onConfirm: () => void) => {
            openModal((modal) => (
                <ModalDangerZone
                    modal={modal}
                    title={translate(`modals.danger_zone.${type}.title`)}
                    description={translate(`modals.danger_zone.${type}.description`)}
                    buttonCancel={{
                        text: translate(`modals.danger_zone.${type}.buttons.cancel`),
                        onClick: modal.close,
                    }}
                    buttonSubmit={{
                        text: translate(`modals.danger_zone.${type}.buttons.confirm`),
                        onClick: () => {
                            onConfirm();
                            modal.close();
                        },
                    }}
                />
            ));
        },
        [openModal, translate],
    );

    const archiveFund = useCallback(
        (fund: Fund) => {
            askConfirmation('archive_fund', () => {
                setProgress(0);

                fundService
                    .archive(fund.organization_id, fund.id)
                    .then(() => {
                        setQueryParams({ funds_type: 'archived' });
                        pushSuccess('Opgeslagen!');
                    })
                    .catch((err: ResponseError) => pushDanger(err.data.message || 'Error!'))
                    .finally(() => setProgress(100));
            });
        },
        [askConfirmation, fundService, pushDanger, pushSuccess, setProgress, setQueryParams],
    );

    const restoreFund = useCallback(
        (e, fund: Fund) => {
            e?.stopPropagation();
            e?.preventDefault();

            askConfirmation('restore_fund', () => {
                setProgress(0);

                fundService
                    .unarchive(fund.organization_id, fund.id)
                    .then(() => {
                        setQueryParams({ funds_type: 'active' });
                        pushSuccess('Opgeslagen!');
                    })
                    .catch((err: ResponseError) => pushDanger(err.data.message || 'Error!'))
                    .finally(() => setProgress(100));
            });
        },
        [askConfirmation, fundService, pushDanger, pushSuccess, setProgress, setQueryParams],
    );

    const topUpModal = useCallback(
        (fund: Fund) => {
            if (topUpInProgress) {
                return;
            }

            setTopUpInProgress(true);

            openModal((modal) => (
                <ModalFundTopUp modal={modal} fund={fund} onClose={() => setTopUpInProgress(false)} />
            ));
        },
        [openModal, topUpInProgress],
    );

    useEffect(() => {
        fetchFunds();
    }, [fetchFunds]);

    useEffect(() => {
        fetchImplementations();
    }, [fetchImplementations]);

    if (!funds) {
        return <LoadingCard />;
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="flex-row">
                    <div className="flex-col flex-grow">
                        <div className="card-title" data-dusk="fundsTitle">
                            {translate('components.organization_funds.title')} ({funds.meta.total})
                        </div>
                    </div>

                    <div className="flex">
                        <div className="block block-inline-filters">
                            {hasPermission(activeOrganization, 'manage_funds') && (
                                <StateNavLink
                                    name={'funds-create'}
                                    params={{ organizationId: activeOrganization.id }}
                                    className="button button-primary button-sm">
                                    <em className="mdi mdi-plus-circle icon-start" />
                                    {translate('components.organization_funds.buttons.add')}
                                </StateNavLink>
                            )}

                            {activeOrganization.allow_2fa_restrictions &&
                                hasPermission(activeOrganization, 'manage_organization') && (
                                    <StateNavLink
                                        name={'organization-security'}
                                        query={{ view_type: 'funds' }}
                                        params={{ organizationId: activeOrganization.id }}
                                        className="button button-default button-sm">
                                        <em className="mdi mdi-security icon-start" />
                                        {translate('components.organization_funds.buttons.security')}
                                    </StateNavLink>
                                )}

                            <div className="form">
                                <div className="flex">
                                    <div>
                                        <div className="block block-label-tabs">
                                            <div className="label-tab-set">
                                                <div
                                                    onClick={() => setQueryParams({ funds_type: 'active' })}
                                                    className={`label-tab label-tab-sm ${
                                                        funds_type == 'active' ? 'active' : ''
                                                    }`}>
                                                    Lopend ({funds.meta.unarchived_funds_total})
                                                </div>

                                                <div
                                                    onClick={() => setQueryParams({ funds_type: 'archived' })}
                                                    className={`label-tab label-tab-sm ${
                                                        funds_type == 'archived' ? 'active' : ''
                                                    }`}>
                                                    Archief ({funds.meta.archived_funds_total})
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex">
                                {filter.show && (
                                    <div className="button button-text" onClick={filter.resetFilters}>
                                        <em className="mdi mdi-close icon-start" />
                                        Wis filters
                                    </div>
                                )}

                                {!filter.show && (
                                    <div className="form">
                                        <div className="form-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Zoeken"
                                                value={filter.values.q}
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
                                                        label={translate(
                                                            'components.organization_funds.filters.search',
                                                        )}>
                                                        <input
                                                            className="form-control"
                                                            value={filter.values.q}
                                                            onChange={(e) => filter.update({ q: e.target.value })}
                                                            placeholder={translate(
                                                                'components.organization_funds.filters.search',
                                                            )}
                                                        />
                                                    </FilterItemToggle>

                                                    <FilterItemToggle
                                                        label={translate(
                                                            'components.organization_funds.filters.state',
                                                        )}>
                                                        <SelectControl
                                                            className="form-control"
                                                            propKey={'key'}
                                                            allowSearch={false}
                                                            value={filter.values.state}
                                                            options={statesOptions}
                                                            optionsComponent={SelectControlOptions}
                                                            onChange={(state: string) => filter.update({ state })}
                                                        />
                                                    </FilterItemToggle>

                                                    <FilterItemToggle
                                                        label={translate(
                                                            'components.organization_funds.filters.implementation',
                                                        )}>
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
                                                </div>
                                            </div>
                                        )}

                                        <div
                                            className="button button-default button-icon"
                                            onClick={() => filter.setShow(!filter.show)}>
                                            <em className="mdi mdi-filter-outline" />
                                        </div>
                                    </div>
                                </ClickOutside>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!loading && funds.meta.total > 0 && (
                <div className="card-section">
                    <div className="card-block card-block-table">
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{translate('components.organization_funds.labels.name')}</th>
                                        <th>{translate('components.organization_funds.labels.implementation')}</th>
                                        {funds_type == 'active' && (
                                            <Fragment>
                                                {hasPermission(activeOrganization, 'view_finances') && (
                                                    <th>
                                                        {translate('components.organization_funds.labels.remaining')}
                                                    </th>
                                                )}
                                                <th>
                                                    {translate('components.organization_funds.labels.requester_count')}
                                                </th>
                                            </Fragment>
                                        )}

                                        <th>{translate('components.organization_funds.labels.status')}</th>
                                        <th className="th-narrow text-right">
                                            {translate('components.organization_funds.labels.actions')}
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {funds.data.map((fund) => (
                                        <StateNavLink
                                            key={fund.id}
                                            name={'funds-show'}
                                            params={{ organizationId: activeOrganization.id, fundId: fund.id }}
                                            customElement={'tr'}
                                            className={'cursor-pointer'}>
                                            <td>
                                                <div className="td-entity-main">
                                                    <div className="td-entity-main-media">
                                                        <img
                                                            className="td-media td-media-sm td-media-round"
                                                            src={
                                                                fund.logo?.sizes.thumbnail ||
                                                                assetUrl('/assets/img/placeholders/fund-thumbnail.png')
                                                            }
                                                            alt={''}
                                                        />
                                                    </div>

                                                    <div className="td-entity-main-content">
                                                        <div
                                                            className="text-strong text-primary"
                                                            title={fund.name || '-'}>
                                                            {strLimit(fund.name, 50)}
                                                        </div>
                                                        <div className="text-muted-dark">{fund.type_locale}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="text-strong text-muted-dark">
                                                {fund?.implementation?.name || <TableEmptyValue />}
                                            </td>

                                            {funds_type == 'active' && (
                                                <Fragment>
                                                    {hasPermission(activeOrganization, 'view_finances') && (
                                                        <td>
                                                            {currencyFormat(
                                                                (parseFloat(fund.budget?.total) || 0) -
                                                                    (parseFloat(fund.budget?.used) || 0),
                                                            )}
                                                        </td>
                                                    )}

                                                    <td className="text-strong text-muted-dark">
                                                        {fund.requester_count}
                                                    </td>
                                                </Fragment>
                                            )}

                                            <td>
                                                {!fund.archived && stateLabels[fund.state] ? (
                                                    <span className={`label ${stateLabels[fund.state] || ''}`}>
                                                        {translate(
                                                            `components.organization_funds.states.${fund.state}`,
                                                        )}
                                                    </span>
                                                ) : (
                                                    <TableEmptyValue />
                                                )}

                                                {fund.archived && (
                                                    <span className="label label-default">
                                                        {translate('components.organization_funds.states.archived')}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="td-narrow text-right">
                                                {!fund.archived ? (
                                                    <TableRowActions
                                                        activeId={shownFundMenuId}
                                                        setActiveId={setShownFundMenuId}
                                                        id={fund.id}>
                                                        <div className="dropdown dropdown-actions">
                                                            <StateNavLink
                                                                name={'funds-show'}
                                                                params={{
                                                                    organizationId: activeOrganization.id,
                                                                    fundId: fund.id,
                                                                }}
                                                                className="dropdown-item">
                                                                <em className="mdi mdi-eye icon-start" /> Bekijken
                                                            </StateNavLink>

                                                            {hasPermission(
                                                                activeOrganization,
                                                                ['manage_funds', 'manage_fund_texts'],
                                                                false,
                                                            ) && (
                                                                <StateNavLink
                                                                    name={'funds-edit'}
                                                                    className="dropdown-item"
                                                                    params={{
                                                                        organizationId: activeOrganization.id,
                                                                        fundId: fund.id,
                                                                    }}>
                                                                    <em className="mdi mdi-pencil icon-start" />
                                                                    Bewerken
                                                                </StateNavLink>
                                                            )}

                                                            {activeOrganization.allow_2fa_restrictions &&
                                                                hasPermission(activeOrganization, 'manage_funds') && (
                                                                    <StateNavLink
                                                                        className="dropdown-item"
                                                                        name={'funds-security'}
                                                                        params={{
                                                                            fundId: fund.id,
                                                                            organizationId: activeOrganization.id,
                                                                        }}>
                                                                        <em className="mdi mdi-security icon-start" />
                                                                        Beveiliging
                                                                    </StateNavLink>
                                                                )}

                                                            {hasPermission(activeOrganization, 'view_finances') &&
                                                                fund.balance_provider == 'top_ups' &&
                                                                fund.key &&
                                                                fund.state != 'closed' && (
                                                                    <a
                                                                        className={`dropdown-item ${
                                                                            !fund.organization.has_bank_connection
                                                                                ? 'disabled'
                                                                                : ''
                                                                        }`}
                                                                        onClick={() => {
                                                                            topUpModal(fund);
                                                                            setShownFundMenuId(null);
                                                                        }}>
                                                                        <em className="mdi mdi-plus-circle icon-start" />
                                                                        Budget toevoegen
                                                                    </a>
                                                                )}

                                                            {hasPermission(activeOrganization, 'manage_funds') && (
                                                                <a
                                                                    className={`dropdown-item ${
                                                                        fund.state != 'closed' ? 'disabled' : ''
                                                                    }`}
                                                                    onClick={() => {
                                                                        archiveFund(fund);
                                                                        setShownFundMenuId(null);
                                                                    }}>
                                                                    <em className="mdi mdi-download-box-outline icon-start" />
                                                                    {translate(
                                                                        'components.organization_funds.buttons.archive',
                                                                    )}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </TableRowActions>
                                                ) : (
                                                    hasPermission(activeOrganization, 'manage_funds') && (
                                                        <button
                                                            className="button button-primary"
                                                            onClick={(e) => restoreFund(e, fund)}>
                                                            <em className="mdi mdi-lock-reset icon-start" />
                                                            {translate('components.organization_funds.buttons.restore')}
                                                        </button>
                                                    )
                                                )}
                                            </td>
                                        </StateNavLink>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {!loading && funds.meta.total == 0 && <EmptyCard type={'card-section'} title={'Geen fondsen gevonden'} />}

            {loading && <LoadingCard type={'card-section'} />}

            {!loading && funds.meta.total > 0 && (
                <div className="card-section">
                    <Paginator
                        meta={funds.meta}
                        filters={filter.values}
                        updateFilters={filter.update}
                        perPageKey={paginatorKey}
                    />
                </div>
            )}
        </div>
    );
}
