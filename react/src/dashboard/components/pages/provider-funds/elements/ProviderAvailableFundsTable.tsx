import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useFilter from '../../../../hooks/useFilter';
import { PaginationData } from '../../../../props/ApiResponses';
import Organization from '../../../../props/models/Organization';
import useProviderFundService from '../../../../services/ProviderFundService';
import useSetProgress from '../../../../hooks/useSetProgress';
import usePushDanger from '../../../../hooks/usePushDanger';
import Paginator from '../../../../modules/paginator/components/Paginator';
import useAssetUrl from '../../../../hooks/useAssetUrl';
import { strLimit } from '../../../../helpers/string';
import TableCheckboxControl from '../../../elements/tables/elements/TableCheckboxControl';
import useOpenModal from '../../../../hooks/useOpenModal';
import Tag from '../../../../props/models/Tag';
import Fund from '../../../../props/models/Fund';
import CardHeaderFilter from '../../../elements/tables/elements/CardHeaderFilter';
import FilterItemToggle from '../../../elements/tables/elements/FilterItemToggle';
import SelectControl from '../../../elements/select-control/SelectControl';
import SelectControlOptions from '../../../elements/select-control/templates/SelectControlOptions';
import ModalNotification from '../../../modals/ModalNotification';
import ThSortable from '../../../elements/tables/ThSortable';
import useTableToggles from '../../../../hooks/useTableToggles';

export default function ProviderAvailableFundsTable({
    organization,
    onChange,
}: {
    organization: Organization;
    onChange: () => void;
}) {
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);

    const assetUrl = useAssetUrl();
    const setProgress = useSetProgress();
    const pushDanger = usePushDanger();
    const openModal = useOpenModal();

    const providerFundService = useProviderFundService();

    const filter = useFilter({
        q: '',
        tag: null,
        page: 1,
        per_page: 10,
        organization_id: null,
        order_by: 'organization_name',
        order_dir: 'asc',
    });

    const [tags, setTags] = useState<Array<Partial<Tag>>>(null);
    const [organizations, setOrganizations] = useState<Array<Partial<Organization>>>(null);
    const [funds, setFunds] = useState<PaginationData<Fund>>(null);

    const { selected, setSelected, toggleAll, toggle } = useTableToggles();
    const selectedMeta = useMemo(() => {
        return { selected: funds?.data?.filter((item) => selected?.includes(item.id)) };
    }, [funds?.data, selected]);

    const successApplying = useCallback(() => {
        openModal((modal) => (
            <ModalNotification
                modal={modal}
                title={t('provider_funds.available.applied_for_fund.title')}
                description={t('provider_funds.available.applied_for_fund.description')}
                icon={'fund_applied'}
                buttonSubmit={{
                    text: t('modal.buttons.confirm'),
                    onClick: modal.close,
                }}
            />
        ));
    }, [openModal, t]);

    const failOfficesCheck = useCallback(() => {
        openModal((modal) => (
            <ModalNotification
                modal={modal}
                title={t('provider_funds.available.error_apply.title')}
                description={t('provider_funds.available.error_apply.description')}
                buttonCancel={{
                    text: t('modal.buttons.cancel'),
                    onClick: modal.close,
                }}
            />
        ));
    }, [openModal, t]);

    const applyFunds = useCallback(
        (funds) => {
            if (organization.offices_count == 0) {
                return failOfficesCheck();
            }

            const promises = funds.map((fund: Fund) => {
                return providerFundService.applyForFund(organization.id, fund.id);
            });

            Promise.all(promises)
                .then(() => {
                    successApplying();
                    setSelected([]);
                })
                .catch((err) => pushDanger('Mislukt!', err.data?.message))
                .finally(() => {
                    filter.touch();
                    onChange?.();
                });
        },
        [
            failOfficesCheck,
            filter,
            onChange,
            organization.id,
            organization.offices_count,
            providerFundService,
            pushDanger,
            setSelected,
            successApplying,
        ],
    );

    const fetchFunds = useCallback(
        async (filters: object) => {
            setLoading(true);
            setProgress(0);

            try {
                return await providerFundService.listAvailableFunds(organization.id, {
                    ...filters,
                });
            } finally {
                setLoading(false);
                setProgress(100);
            }
        },
        [organization.id, providerFundService, setProgress],
    );

    useEffect(() => {
        setSelected([]);

        fetchFunds(filter.activeValues)
            .then((res) => {
                setFunds(res.data);

                setTags((tags) => {
                    if (tags) {
                        return tags;
                    }

                    return [{ key: null, name: t('provider_funds.filters.options.all_labels') }, ...res.data.meta.tags];
                });
                setOrganizations((organization) => {
                    if (organization) {
                        return organization;
                    }

                    return [
                        { id: null, name: t('provider_funds.filters.options.all_organizations') },
                        ...res.data.meta.organizations,
                    ];
                });
            })
            .catch((err) => pushDanger('Mislukt!', err.data?.message));
    }, [fetchFunds, filter.activeValues, organization, pushDanger, setSelected, t]);

    return (
        <div className="card">
            <div className="card-header">
                <div className="flex">
                    <div className="flex flex-grow">
                        <div className="card-title">
                            {t(`provider_funds.title.available`)}

                            {!loading && selected.length > 0 && ` (${selected.length}/${funds.data.length})`}
                            {!loading && selected.length == 0 && ` (${funds.meta.total})`}
                        </div>
                    </div>
                    <div className="flex block block-inline-filters">
                        {selectedMeta?.selected?.length > 0 && (
                            <button
                                type={'button'}
                                className="button button-primary button-sm"
                                onClick={() => applyFunds(selectedMeta?.selected)}>
                                <em className="mdi mdi-send-circle-outline icon-start" />
                                {t('provider_funds.buttons.join')}
                            </button>
                        )}
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
                                        className="form-control"
                                        value={filter.values.q}
                                        onChange={(e) => filter.update({ q: e.target.value })}
                                        placeholder="Zoeken"
                                    />
                                </div>
                            </div>
                        )}

                        <CardHeaderFilter filter={filter}>
                            <FilterItemToggle label={t('provider_funds.filters.labels.search')} show={true}>
                                <input
                                    className="form-control"
                                    value={filter.values.q}
                                    onChange={(e) => filter.update({ q: e.target.value })}
                                    placeholder="Zoeken"
                                />
                            </FilterItemToggle>

                            <FilterItemToggle label={t('provider_funds.filters.labels.organizations')}>
                                <SelectControl
                                    value={filter.values.organization_id}
                                    options={organizations}
                                    propKey={'id'}
                                    propValue={'name'}
                                    onChange={(organization_id?: number) => filter.update({ organization_id })}
                                    optionsComponent={SelectControlOptions}
                                />
                            </FilterItemToggle>

                            <FilterItemToggle label={t('provider_funds.filters.labels.tags')}>
                                <SelectControl
                                    value={filter.values.tag}
                                    options={tags}
                                    propKey={'key'}
                                    propValue={'name'}
                                    onChange={(tag?: string) => filter.update({ tag })}
                                    optionsComponent={SelectControlOptions}
                                />
                            </FilterItemToggle>
                        </CardHeaderFilter>
                    </div>
                </div>
            </div>
            {!loading && funds.data.length > 0 && (
                <div className="card-section">
                    <div className="card-block card-block-table card-block-table-fund form">
                        <div className="table-wrapper">
                            <table className="table">
                                <tbody>
                                    <tr>
                                        <th className="th-narrow">
                                            <TableCheckboxControl
                                                checked={selected.length == funds.data.length}
                                                onClick={(e) => toggleAll(e, funds.data)}
                                            />
                                        </th>

                                        <ThSortable
                                            label={t('provider_funds.labels.fund')}
                                            value={'name'}
                                            filter={filter}
                                        />
                                        <ThSortable
                                            label={t('provider_funds.labels.organization')}
                                            value={'organization_name'}
                                            filter={filter}
                                        />

                                        <ThSortable
                                            label={t('provider_funds.labels.start_date')}
                                            value={'start_date'}
                                            filter={filter}
                                        />

                                        <ThSortable
                                            label={t('provider_funds.labels.end_date')}
                                            value={'end_date'}
                                            filter={filter}
                                        />

                                        <ThSortable
                                            className={'nowrap text-right'}
                                            label={t('provider_funds.labels.actions')}
                                        />
                                    </tr>
                                    {funds.data?.map((fund) => (
                                        <tr key={fund.id} className={selected.includes(fund.id) ? 'selected' : ''}>
                                            <td className="td-narrow">
                                                <TableCheckboxControl
                                                    checked={selected.includes(fund.id)}
                                                    onClick={(e) => toggle(e, fund)}
                                                />
                                            </td>

                                            <td>
                                                <div className="fund-img">
                                                    <img
                                                        src={
                                                            fund.logo?.sizes?.thumbnail ||
                                                            assetUrl(
                                                                '/assets/img/placeholders/organization-thumbnail.png',
                                                            )
                                                        }
                                                        alt=""
                                                    />
                                                </div>
                                                <div className="fund-title" title={fund.name}>
                                                    {strLimit(fund.name, 25)}
                                                </div>
                                            </td>

                                            <td title={fund.organization.name}>
                                                {strLimit(fund.organization?.name, 25)}
                                            </td>

                                            <td className="nowrap">
                                                <strong className="text-strong text-md text-muted-dark">
                                                    {fund.start_date_locale}
                                                </strong>
                                            </td>

                                            <td className="nowrap">
                                                <strong className="text-strong text-md text-muted-dark">
                                                    {fund.end_date_locale}
                                                </strong>
                                            </td>

                                            <td>
                                                <div className="button-group flex-end">
                                                    {fund.state != 'closed' && (
                                                        <button
                                                            className="button button-primary button-sm"
                                                            onClick={() => applyFunds([fund])}>
                                                            <em className="mdi mdi-send-circle-outline icon-start" />
                                                            {t('provider_funds.buttons.join')}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
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

            {!loading && funds?.meta?.last_page > 1 && (
                <div className="card-section">
                    <Paginator meta={funds.meta} filters={filter.activeValues} updateFilters={filter.update} />
                </div>
            )}

            {!loading && funds?.meta?.total == 0 && (
                <div className="card-section">
                    <div className="block block-empty text-center">
                        <div className="empty-title">{t(`provider_funds.empty_block.available`)}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
