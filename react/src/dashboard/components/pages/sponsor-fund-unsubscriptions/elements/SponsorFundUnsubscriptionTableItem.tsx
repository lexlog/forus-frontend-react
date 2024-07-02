import React, { useState } from 'react';
import { strLimit } from '../../../../helpers/string';
import Organization from '../../../../props/models/Organization';
import FundProviderUnsubscribe from '../../../../props/models/FundProviderUnsubscribe';
import useAssetUrl from '../../../../hooks/useAssetUrl';
import StateNavLink from '../../../../modules/state_router/StateNavLink';
import Tooltip from '../../../elements/tooltip/Tooltip';
import TableEmptyValue from '../../../elements/table-empty-value/TableEmptyValue';

export default function SponsorFundUnsubscriptionTableItem({
    organization,
    unsubscription,
}: {
    organization: Organization;
    unsubscription: FundProviderUnsubscribe;
}) {
    const assetUrl = useAssetUrl();

    const [stateClasses] = useState({
        approved: 'success',
        pending: 'warning',
        overdue: 'danger',
        canceled: 'default',
    });

    return (
        <StateNavLink
            customElement={'tr'}
            className={'clickable'}
            name={'sponsor-provider-organization'}
            params={{ organizationId: organization.id, id: unsubscription.fund_provider.organization.id }}>
            <td>
                <div className="td-entity-main">
                    <div className="td-entity-main-media">
                        <img
                            className="td-media td-media-sm td-media-round"
                            src={
                                unsubscription.fund_provider.organization.logo?.sizes.thumbnail ||
                                assetUrl('/assets/img/placeholders/organization-thumbnail.png')
                            }
                            alt={''}
                        />
                    </div>

                    <div className="td-entity-main-content">
                        <div
                            className="text-strong text-primary"
                            title={unsubscription.fund_provider?.organization?.name || '-'}>
                            {strLimit(unsubscription.fund_provider?.organization?.name, 32)}
                        </div>
                    </div>
                </div>
            </td>

            <td title={unsubscription.fund_provider?.fund?.name || '-'}>
                {strLimit(unsubscription.fund_provider?.fund?.name, 25)}
            </td>

            <td className="nowrap">
                <div className="text-strong text-md text-muted-dark">{unsubscription.created_at_locale}</div>
            </td>

            <td title={unsubscription.note}>
                {unsubscription.note ? (
                    <div className="flex">
                        {strLimit(unsubscription.note, 25)}
                        &nbsp;
                        {unsubscription.note?.length >= 25 && (
                            <Tooltip type={'primary'} position={'bottom'} text={unsubscription.note} maxLength={1000} />
                        )}
                    </div>
                ) : (
                    <TableEmptyValue />
                )}
            </td>

            <td className="nowrap">
                <div className={`tag tag-sm tag-${stateClasses[unsubscription.state] || 'default'}`}>
                    {unsubscription.state_locale}
                </div>
            </td>

            <td className="nowrap text-right">
                <div className={unsubscription.is_expired ? 'text-danger' : 'text-muted-dark'}>
                    {unsubscription.is_expired && <em className="mdi mdi-alert" />}
                    &nbsp;
                    <strong className="text-strong text-md">{unsubscription.unsubscribe_at_locale}</strong>
                </div>
            </td>
        </StateNavLink>
    );
}
