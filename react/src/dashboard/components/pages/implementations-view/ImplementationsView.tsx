import React, { Fragment, useCallback, useEffect, useState } from 'react';
import useImplementationService from '../../../services/ImplementationService';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import { PaginationData, ResponseError } from '../../../props/ApiResponses';
import usePushDanger from '../../../hooks/usePushDanger';
import { useNavigate, useParams } from 'react-router-dom';
import useAssetUrl from '../../../hooks/useAssetUrl';
import { hasPermission } from '../../../helpers/utils';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import LoadingCard from '../../elements/loading-card/LoadingCard';
import useFilter from '../../../hooks/useFilter';
import { useFundService } from '../../../services/FundService';
import Fund from '../../../props/models/Fund';
import ThSortable from '../../elements/tables/ThSortable';
import { getStateRouteUrl } from '../../../modules/state_router/Router';
import useTranslate from '../../../hooks/useTranslate';
import EmptyCard from '../../elements/empty-card/EmptyCard';
import useSetProgress from '../../../hooks/useSetProgress';

export default function ImplementationsView() {
    const { id } = useParams();

    const navigate = useNavigate();
    const assetUrl = useAssetUrl();
    const translate = useTranslate();
    const pushDanger = usePushDanger();
    const setProgress = useSetProgress();
    const activeOrganization = useActiveOrganization();

    const fundService = useFundService();
    const implementationService = useImplementationService();

    const [implementation, setImplementation] = useState(null);
    const [funds, setFunds] = useState<PaginationData<Fund>>(null);

    const filter = useFilter({ q: '' });

    const fetchImplementation = useCallback(() => {
        implementationService
            .read(activeOrganization.id, parseInt(id))
            .then((res) => setImplementation(res.data.data))
            .catch((res: ResponseError) => {
                if (res.status === 403) {
                    navigate(getStateRouteUrl('implementations', { organizationId: activeOrganization.id }));
                }

                pushDanger('Mislukt!', res.data.message);
            });
    }, [activeOrganization.id, id, implementationService, navigate, pushDanger]);

    const fetchFunds = useCallback(() => {
        setProgress(0);

        fundService
            .list(activeOrganization.id, { implementation_id: parseInt(id), ...filter.activeValues })
            .then((res) => setFunds(res.data))
            .catch((res: ResponseError) => pushDanger('Mislukt!', res.data.message))
            .finally(() => setProgress(100));
    }, [setProgress, fundService, activeOrganization.id, id, filter.activeValues, pushDanger]);

    useEffect(() => {
        fetchImplementation();
    }, [fetchImplementation]);

    useEffect(() => {
        fetchFunds();
    }, [fetchFunds]);

    if (!implementation || !funds) {
        return <LoadingCard />;
    }

    return (
        <Fragment>
            <div className="block block-breadcrumbs">
                <StateNavLink
                    name={'implementations'}
                    params={{ organizationId: activeOrganization.id }}
                    activeExact={true}
                    className="breadcrumb-item">
                    Webshops
                </StateNavLink>
                <div className="breadcrumb-item active">{implementation.name}</div>
            </div>

            <div className="card card-collapsed">
                <div className="card-section">
                    <div className="card-block card-block-implementation card-block-implementation-collapsed">
                        <div className="card-block-implementation-logo">
                            <img
                                src={
                                    implementation.logo ||
                                    assetUrl('/assets/img/placeholders/organization-thumbnail.png')
                                }
                                alt={implementation.name}
                            />
                        </div>
                        <div className="card-block-implementation-details">
                            <div className="card-block-implementation-name">{implementation.name}</div>
                            <div className="card-block-implementation-desc">Website</div>
                            <div className="card-block-implementation-website">
                                <a href={implementation.url_webshop} target="_blank" rel="noreferrer">
                                    {implementation.url_webshop}
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="card-section-actions">
                        {hasPermission(activeOrganization, 'manage_implementation') && (
                            <StateNavLink
                                name={'implementations-email'}
                                params={{ id: implementation.id, organizationId: implementation.organization_id }}
                                className={`button button-default`}>
                                <em className="mdi mdi-cog icon-start" />
                                Email
                            </StateNavLink>
                        )}

                        {hasPermission(activeOrganization, 'manage_implementation') && (
                            <StateNavLink
                                name={'implementations-digid'}
                                params={{ id: implementation.id, organizationId: implementation.organization_id }}
                                className={`button button-default`}>
                                <em className="mdi mdi-cog icon-start" />
                                DigiD
                            </StateNavLink>
                        )}

                        {hasPermission(activeOrganization, ['manage_implementation_cms']) && (
                            <StateNavLink
                                name={'implementations-cms'}
                                params={{ id: implementation.id, organizationId: implementation.organization_id }}
                                className={`button button-primary`}>
                                <em className="mdi mdi-text-box icon-start" />
                                CMS
                            </StateNavLink>
                        )}
                    </div>
                </div>
            </div>

            <div className="card card-collapsed">
                <div className="card-header">
                    <div className="flex-row">
                        <div className="flex-col">
                            <div className="card-title">Fonds gekoppeld aan webshop</div>
                        </div>
                        <div className="flex-col">
                            <div className="card-header-drown">
                                <div className="block block-inline-filters">
                                    <div className="form">
                                        <div className="form-group">
                                            <input
                                                type="text"
                                                value={filter.values.q}
                                                placeholder="Zoeken"
                                                className="form-control"
                                                onChange={(e) => filter.update({ q: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {funds.meta.total > 0 ? (
                    <div className="card-section">
                        <div className="card-block card-block-table">
                            <div className="table-wrapper">
                                <table className="table">
                                    <tbody>
                                        <tr>
                                            <ThSortable className="th-narrow" label="Afbeelding" />
                                            <ThSortable label="Naam" />
                                            <ThSortable label="Status" />
                                            {activeOrganization.backoffice_available && (
                                                <ThSortable className="th-narrow" label="Acties" />
                                            )}
                                        </tr>

                                        {funds.data.map((fund) => (
                                            <tr key={fund.id}>
                                                <td>
                                                    <img
                                                        className="td-media"
                                                        src={
                                                            fund?.logo?.sizes?.thumbnail ||
                                                            assetUrl('/assets/img/placeholders/product-thumbnail.png')
                                                        }
                                                        alt={fund.name}
                                                    />
                                                </td>
                                                <td>{fund.name}</td>
                                                <td>
                                                    {fund.state == 'active' && (
                                                        <div className="tag tag-success">
                                                            {translate('fund_card_sponsor.status.active')}
                                                        </div>
                                                    )}
                                                    {fund.state == 'paused' && (
                                                        <div className="tag tag-warning">
                                                            {translate('fund_card_sponsor.status.paused')}
                                                        </div>
                                                    )}
                                                    {fund.state == 'closed' && (
                                                        <div className="tag tag-default">
                                                            {translate('fund_card_sponsor.status.closed')}
                                                        </div>
                                                    )}
                                                </td>

                                                {activeOrganization.backoffice_available && (
                                                    <td>
                                                        <div className="button-group">
                                                            {hasPermission(activeOrganization, 'manage_funds') &&
                                                                fund.key && (
                                                                    <StateNavLink
                                                                        name={'fund-backoffice-edit'}
                                                                        params={{
                                                                            fundId: fund.id,
                                                                            organizationId: activeOrganization.id,
                                                                        }}
                                                                        className={`button button-default`}>
                                                                        <em className="mdi mdi-cog icon-start" />
                                                                        Backoffice
                                                                    </StateNavLink>
                                                                )}

                                                            <StateNavLink
                                                                name={'funds-show'}
                                                                params={{
                                                                    fundId: fund.id,
                                                                    organizationId: activeOrganization.id,
                                                                }}
                                                                className={`button button-primary`}>
                                                                <em className="mdi mdi-eye-outline icon-start" />
                                                                Bekijken
                                                            </StateNavLink>
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
                ) : (
                    <EmptyCard type={'card-section'} title={'Geen fondsen gekoppeld aan deze implementatie.'} />
                )}

                <div className="card-section">
                    <div className="table-pagination">
                        <div className="table-pagination-counter">{funds.meta.total} resultaten</div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
