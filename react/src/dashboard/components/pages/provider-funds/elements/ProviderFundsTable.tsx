import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useFilter from '../../../../hooks/useFilter';
import { PaginationData } from '../../../../props/ApiResponses';
import FundProvider from '../../../../props/models/FundProvider';
import Organization from '../../../../props/models/Organization';
import useProviderFundService from '../../../../services/ProviderFundService';
import useSetProgress from '../../../../hooks/useSetProgress';
import usePushDanger from '../../../../hooks/usePushDanger';
import usePushSuccess from '../../../../hooks/usePushSuccess';
import Paginator from '../../../../modules/paginator/components/Paginator';
import useAssetUrl from '../../../../hooks/useAssetUrl';
import { strLimit } from '../../../../helpers/string';
import TableCheckboxControl from '../../../elements/tables/elements/TableCheckboxControl';
import useOpenModal from '../../../../hooks/useOpenModal';
import ModalDangerZone from '../../../modals/ModalDangerZone';
import ModalFundOffers from '../../../modals/ModalFundOffers';
import ModalFundUnsubscribe from '../../../modals/ModalFundUnsubscribe';
import useTableToggles from '../../../../hooks/useTableToggles';
import usePaginatorService from '../../../../modules/paginator/services/usePaginatorService';
import EmptyCard from '../../../elements/empty-card/EmptyCard';
import useTranslate from '../../../../hooks/useTranslate';

export default function ProviderFundsTable({
    type,
    organization,
    onChange,
}: {
    type: 'active' | 'pending_rejected' | 'archived';
    organization: Organization;
    onChange: () => void;
}) {
    const [loading, setLoading] = useState(true);

    const assetUrl = useAssetUrl();
    const translate = useTranslate();
    const openModal = useOpenModal();
    const pushDanger = usePushDanger();
    const pushSuccess = usePushSuccess();
    const setProgress = useSetProgress();

    const paginatorService = usePaginatorService();
    const providerFundService = useProviderFundService();

    const [paginatorKey] = useState(`provider_funds_${type}`);
    const [providerFunds, setProviderFunds] = useState<PaginationData<FundProvider>>(null);

    const filter = useFilter({
        q: '',
        per_page: paginatorService.getPerPage(paginatorKey),
    });

    const { selected, setSelected, toggleAll, toggle } = useTableToggles();

    const selectedMeta = useMemo(() => {
        const list = providerFunds?.data?.filter((item) => selected?.includes(item.id));

        return {
            selected: list,
            selected_cancel: list?.filter((item) => item.can_cancel),
            selected_unsubscribe: list?.filter((item) => item.can_unsubscribe),
        };
    }, [providerFunds?.data, selected]);

    const viewOffers = useCallback(
        (providerFund: FundProvider) => {
            openModal((modal) => (
                <ModalFundOffers modal={modal} providerFund={providerFund} organization={organization} />
            ));
        },
        [openModal, organization],
    );

    const cancelApplications = useCallback(
        (providerFunds: Array<FundProvider>) => {
            const sponsor_organization_name =
                providerFunds.length == 1 ? providerFunds[0]?.fund?.organization?.name || '' : '';

            openModal((modal) => {
                return (
                    <ModalDangerZone
                        modal={modal}
                        title={translate('modals.danger_zone.remove_provider_application.title')}
                        description={translate('modals.danger_zone.remove_provider_application.description', {
                            sponsor_organization_name,
                        })}
                        buttonCancel={{
                            text: translate('modals.danger_zone.remove_provider_application.buttons.cancel'),
                            onClick: () => modal.close(),
                        }}
                        buttonSubmit={{
                            text: translate('modals.danger_zone.remove_provider_application.buttons.confirm'),
                            onClick: () => {
                                modal.close();
                                setProgress(0);

                                const promises = providerFunds.map((provider) =>
                                    providerFundService.cancelApplication(organization.id, provider.id),
                                );

                                Promise.all(promises)
                                    .then(() => pushSuccess('Opgeslagen!'))
                                    .catch((err) => pushDanger('Mislukt!', err.data?.message))
                                    .finally(() => {
                                        setProgress(100);
                                        filter.touch();
                                        onChange?.();
                                    });
                            },
                        }}
                    />
                );
            });
        },
        [
            filter,
            onChange,
            openModal,
            organization.id,
            providerFundService,
            pushDanger,
            pushSuccess,
            setProgress,
            translate,
        ],
    );

    const unsubscribe = useCallback(
        (providerFund: FundProvider) => {
            openModal((modal) => (
                <ModalFundUnsubscribe
                    modal={modal}
                    providerFund={providerFund}
                    organization={organization}
                    onUnsubscribe={() => {
                        filter.touch();
                        onChange?.();
                    }}
                />
            ));
        },
        [filter, onChange, openModal, organization],
    );

    const fetchFunds = useCallback(
        async (filters: object) => {
            setLoading(true);
            setProgress(0);

            try {
                return await providerFundService.listFunds(organization.id, {
                    active: type == 'active' ? 1 : 0,
                    pending: type == 'pending_rejected' ? 1 : 0,
                    archived: type == 'archived' ? 1 : 0,
                    ...filters,
                });
            } finally {
                setLoading(false);
                setProgress(100);
            }
        },
        [organization.id, providerFundService, setProgress, type],
    );

    useEffect(() => {
        setSelected([]);

        fetchFunds(filter.activeValues)
            .then((res) => setProviderFunds(res.data))
            .catch((err) => pushDanger('Mislukt!', err.data?.message));
    }, [fetchFunds, filter.activeValues, pushDanger, setSelected]);

    return (
        <div className="card">
            <div className="card-header">
                <div className="flex">
                    <div className="flex flex-grow">
                        <div className="card-title">
                            {translate(`provider_funds.title.${type}`)}

                            {!loading && selected.length > 0 && ` (${selected.length}/${providerFunds.data.length})`}
                            {!loading && selected.length == 0 && ` (${providerFunds.meta.total})`}
                        </div>
                    </div>
                    <div className="flex block block-inline-filters">
                        {selectedMeta?.selected_cancel?.length > 0 && (
                            <button
                                type={'button'}
                                className="button button-danger button-sm"
                                disabled={selectedMeta?.selected_cancel?.length !== selected.length}
                                onClick={() => cancelApplications(selectedMeta?.selected_cancel)}>
                                <em className="mdi mdi-close-circle-outline icon-start" />
                                {translate('provider_funds.labels.cancel_application')}
                            </button>
                        )}
                        <div className="form">
                            <div className="form-group">
                                <input
                                    className="form-control"
                                    value={filter.values.q}
                                    onChange={(e) => filter.update({ q: e.target.value })}
                                    placeholder="Zoeken"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {!loading && providerFunds.data.length > 0 && (
                <div className="card-section">
                    <div className="card-block card-block-table form">
                        <div className="table-wrapper">
                            <table className="table">
                                <tbody>
                                    <tr>
                                        {type !== 'archived' && (
                                            <th className="th-narrow">
                                                <TableCheckboxControl
                                                    checked={selected.length == providerFunds.data.length}
                                                    onClick={(e) => toggleAll(e, providerFunds.data)}
                                                />
                                            </th>
                                        )}

                                        <th>{translate('provider_funds.labels.fund')}</th>
                                        <th>{translate('provider_funds.labels.organization')}</th>
                                        <th>{translate('provider_funds.labels.start_date')}</th>
                                        <th>{translate('provider_funds.labels.end_date')}</th>

                                        {type === 'active' && <th>{translate('provider_funds.labels.max_amount')}</th>}

                                        <th>{translate('provider_funds.labels.allow_budget')}</th>
                                        <th>{translate('provider_funds.labels.allow_products')}</th>
                                        <th>{translate('provider_funds.labels.status')}</th>

                                        {type !== 'archived' && (
                                            <th className="nowrap text-right">
                                                {translate('provider_funds.labels.actions')}
                                            </th>
                                        )}
                                    </tr>
                                    {providerFunds.data?.map((providerFund) => (
                                        <tr
                                            key={providerFund.id}
                                            className={selected.includes(providerFund.id) ? 'selected' : ''}>
                                            {type !== 'archived' && (
                                                <td className="td-narrow">
                                                    <TableCheckboxControl
                                                        checked={selected.includes(providerFund.id)}
                                                        onClick={(e) => toggle(e, providerFund)}
                                                    />
                                                </td>
                                            )}
                                            <td>
                                                <div className="td-collapsable">
                                                    <div className="collapsable-media">
                                                        <img
                                                            className="td-media td-media-sm"
                                                            src={
                                                                providerFund.fund.logo?.sizes?.thumbnail ||
                                                                assetUrl('/assets/img/placeholders/fund-thumbnail.png')
                                                            }
                                                            alt=""
                                                        />
                                                    </div>
                                                    <div className="collapsable-content">
                                                        <div
                                                            className="text-primary text-medium"
                                                            title={providerFund.fund.name}>
                                                            {strLimit(providerFund.fund.name, 32)}
                                                        </div>
                                                        <a
                                                            href={providerFund.fund.implementation.url_webshop}
                                                            target="_blank"
                                                            className="text-strong text-md text-muted-dark text-inherit"
                                                            rel="noreferrer">
                                                            {strLimit(providerFund.fund.implementation?.name, 32)}
                                                        </a>
                                                    </div>
                                                </div>
                                            </td>
                                            <td title={providerFund.fund?.organization?.name}>
                                                {strLimit(providerFund.fund?.organization?.name, 25)}
                                            </td>
                                            <td className="nowrap">
                                                <strong className="text-strong text-md text-muted-dark">
                                                    {providerFund.fund?.start_date_locale}
                                                </strong>
                                            </td>
                                            <td className="nowrap">
                                                <strong className="text-strong text-md text-muted-dark">
                                                    {providerFund.fund?.end_date_locale}
                                                </strong>
                                            </td>
                                            {type === 'active' && (
                                                <td className="nowrap">
                                                    {providerFund.fund?.fund_amount_locale || '-'}
                                                </td>
                                            )}
                                            <td>{providerFund.allow_budget ? 'Ja' : 'Nee'}</td>
                                            <td>
                                                {providerFund.allow_some_products || providerFund.allow_products
                                                    ? 'Ja'
                                                    : 'Nee'}
                                            </td>
                                            {!providerFund.fund.archived && !providerFund.fund.expired && (
                                                <td className="nowrap">
                                                    {providerFund.state == 'accepted' && (
                                                        <div className="tag tag-sm tag-success">
                                                            {providerFund.state_locale}
                                                        </div>
                                                    )}

                                                    {providerFund.state == 'pending' && (
                                                        <div className="tag tag-sm tag-warning">
                                                            {providerFund.state_locale}
                                                        </div>
                                                    )}

                                                    {providerFund.state == 'rejected' && (
                                                        <div className="tag tag-sm tag-danger">
                                                            {providerFund.state_locale}
                                                        </div>
                                                    )}
                                                </td>
                                            )}

                                            {(providerFund.fund.archived || providerFund.fund.expired) && (
                                                <td className="nowrap">
                                                    <div className="tag tag-sm tag-default">Archived</div>
                                                </td>
                                            )}

                                            {type !== 'archived' && (
                                                <td>
                                                    <div className="button-group flex-end">
                                                        {(providerFund.fund.type == 'subsidies' ||
                                                            (providerFund.fund.state != 'closed' &&
                                                                providerFund.allow_some_products)) && (
                                                            <button
                                                                className="button button-primary button-sm button-icon"
                                                                title="Bekijk"
                                                                onClick={() => viewOffers(providerFund)}>
                                                                <em className="mdi mdi-eye-outline icon-start" />
                                                            </button>
                                                        )}

                                                        {type == 'active' && (
                                                            <button
                                                                className="button button-danger button-sm button-icon"
                                                                title="Unsubscribe"
                                                                onClick={() => unsubscribe(providerFund)}
                                                                disabled={!providerFund.can_unsubscribe}>
                                                                <em className="mdi mdi-progress-close icon-start" />
                                                            </button>
                                                        )}

                                                        {providerFund.can_cancel && (
                                                            <button
                                                                className="button button-danger button-sm button-icon"
                                                                title="Cancel"
                                                                onClick={() => cancelApplications([providerFund])}>
                                                                <em className="mdi mdi-close-circle-outline icon-start" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="card-section">
                    <div className="card-loading">
                        <div className="mdi mdi-loading mdi-spin" />
                    </div>
                </div>
            )}

            {!loading && providerFunds?.meta?.total == 0 && (
                <EmptyCard type={'card-section'} title={translate(`provider_funds.empty_block.${type}`)} />
            )}

            {providerFunds?.meta && (
                <div className="card-section">
                    <Paginator
                        meta={providerFunds.meta}
                        filters={filter.activeValues}
                        updateFilters={filter.update}
                        perPageKey={paginatorKey}
                    />
                </div>
            )}
        </div>
    );
}
