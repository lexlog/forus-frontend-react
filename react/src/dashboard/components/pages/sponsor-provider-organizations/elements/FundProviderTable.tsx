import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getStateRouteUrl } from '../../../../modules/state_router/Router';
import { strLimit } from '../../../../helpers/string';
import Paginator from '../../../../modules/paginator/components/Paginator';
import { PaginationData } from '../../../../props/ApiResponses';
import Organization from '../../../../props/models/Organization';
import FilterScope from '../../../../types/FilterScope';
import FilterModel from '../../../../types/FilterModel';
import FundProvider from '../../../../props/models/FundProvider';

export default function FundProviderTable({
    filter,
    organization,
    fundProviders,
}: {
    filter: FilterScope<FilterModel>;
    organization: Organization;
    fundProviders: PaginationData<FundProvider>;
}) {
    const navigate = useNavigate();

    return (
        <tr>
            <td className="td-paddless" colSpan={5}>
                {fundProviders.meta.total > 0 && (
                    <table className="table table-embed">
                        <thead>
                            <tr>
                                <th>Fondsnaam</th>
                                <th>Status</th>
                                <th>Opties</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fundProviders.data.map((fundProvider) => (
                                <tr
                                    key={fundProvider.id}
                                    onClick={() =>
                                        navigate(
                                            getStateRouteUrl('fund-provider', {
                                                id: fundProvider.id,
                                                fundId: fundProvider.fund_id,
                                                organizationId: organization.id,
                                            }),
                                        )
                                    }>
                                    <td>
                                        <div className="td-collapsable">
                                            <div className="collapsable-icon">
                                                <div className="mdi">&nbsp;</div>
                                            </div>
                                            <div className="collapsable-media">
                                                <img
                                                    className="td-media td-media-sm"
                                                    src={
                                                        fundProvider.fund.logo?.sizes?.thumbnail ||
                                                        './assets/img/placeholders/fund-thumbnail.png'
                                                    }
                                                    alt={fundProvider.fund.name}
                                                />
                                            </div>
                                            <div className="collapsable-content">
                                                <div className="text-primary text-medium">
                                                    {strLimit(fundProvider.fund.name, 40)}
                                                </div>
                                                <div className="text-strong text-md text-muted-dark">
                                                    {strLimit(fundProvider.fund.implementation.name, 40)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div
                                            className={`label label-${
                                                {
                                                    accepted: 'success',
                                                    pending: 'default',
                                                    rejected: 'danger',
                                                }[fundProvider.state]
                                            }`}>
                                            {fundProvider.state_locale}
                                        </div>
                                    </td>
                                    <td className="td-narrow text-right">
                                        <NavLink
                                            to={getStateRouteUrl('fund-provider', {
                                                id: fundProvider.id,
                                                fundId: fundProvider.fund_id,
                                                organizationId: organization.id,
                                            })}
                                            className="button button-default button-sm nowrap">
                                            <em className="mdi mdi-eye-outline icon-start" />
                                            Bekijk aanbod
                                        </NavLink>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tbody>
                            <tr>
                                <td colSpan={5}>
                                    <Paginator
                                        meta={fundProviders.meta}
                                        filters={filter.values}
                                        updateFilters={filter.update}
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </td>
        </tr>
    );
}
