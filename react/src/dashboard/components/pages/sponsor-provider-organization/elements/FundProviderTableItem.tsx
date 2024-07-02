import React, { Fragment, useCallback, useState } from 'react';
import { ResponseError } from '../../../../props/ApiResponses';
import usePushDanger from '../../../../hooks/usePushDanger';
import { useFundService } from '../../../../services/FundService';
import usePushSuccess from '../../../../hooks/usePushSuccess';
import FundProvider from '../../../../props/models/FundProvider';
import StateNavLink from '../../../../modules/state_router/StateNavLink';
import Organization from '../../../../props/models/Organization';
import useConfirmFundProviderUpdate from '../hooks/useConfirmFundProviderUpdate';
import useAssetUrl from '../../../../hooks/useAssetUrl';

export default function FundProviderTableItem({
    fundProvider,
    organization,
    onChange,
}: {
    fundProvider: FundProvider;
    organization: Organization;
    onChange: (data: FundProvider) => void;
}) {
    const pushSuccess = usePushSuccess();
    const assetUrl = useAssetUrl();
    const pushDanger = usePushDanger();
    const confirmFundProviderUpdate = useConfirmFundProviderUpdate();

    const fundService = useFundService();

    const [submittingState, setSubmittingState] = useState(null);
    const [submittingExcluded, setSubmittingExcluded] = useState(false);

    const updateProvider = useCallback(
        async (
            fundProvider: FundProvider,
            data: { state?: string; allow_budget?: boolean; allow_products?: boolean; excluded?: boolean },
        ) => {
            return await fundService
                .updateProvider(fundProvider.fund.organization_id, fundProvider.fund.id, fundProvider.id, data)
                .then((res) => {
                    pushSuccess('Opgeslagen!');
                    onChange(res.data.data);
                })
                .catch((err: ResponseError) => pushDanger('Mislukt!', err.data.message));
        },
        [fundService, onChange, pushDanger, pushSuccess],
    );

    const updateFundProviderExcluded = useCallback(
        (fundProvider: FundProvider, data: { excluded?: boolean }) => {
            setSubmittingExcluded(true);
            updateProvider(fundProvider, data).finally(() => setSubmittingExcluded(false));
        },
        [updateProvider],
    );

    const updateFundProviderState = useCallback(
        (fundProvider: FundProvider, accepted: boolean) => {
            const state = accepted ? 'accepted' : 'rejected';

            setSubmittingState(state);

            confirmFundProviderUpdate(fundProvider, state)
                .then((data) => data && updateProvider(fundProvider, data))
                .catch((r) => r)
                .finally(() => setSubmittingState(null));
        },
        [confirmFundProviderUpdate, updateProvider],
    );

    return (
        <tr>
            <td className="td-narrow">
                <img
                    className="td-media"
                    src={
                        fundProvider.fund.logo?.sizes?.thumbnail ||
                        assetUrl('/assets/img/placeholders/fund-thumbnail.png')
                    }
                    alt={fundProvider.fund.name}
                />
            </td>
            <td>
                <div className="td-title">
                    {fundProvider.fund.name}
                    <div className="td-title-icon td-title-icon-suffix">
                        {fundProvider.excluded && <em className="mdi mdi-eye-off-outline" />}
                    </div>
                </div>
                <div>{fundProvider.fund.type_locale}</div>
            </td>
            <td>
                <div
                    className={`label label-${
                        { accepted: 'success', pending: 'default', rejected: 'danger' }[fundProvider.state]
                    }`}>
                    {fundProvider.state_locale}
                </div>
            </td>
            <td>
                {fundProvider.state == 'pending' || fundProvider.fund.type == 'subsidies' ? (
                    <div className="text-muted">-</div>
                ) : (
                    <Fragment>
                        {fundProvider.state == 'rejected' && <div className="text-strong">Nee</div>}

                        <div>
                            {fundProvider.state == 'rejected' && <span className="mdi mdi-backup-restore"> </span>}

                            <span
                                className={
                                    fundProvider.state == 'rejected'
                                        ? 'text-line-through text-small text-muted'
                                        : 'text-strong'
                                }>
                                {fundProvider.allow_budget ? 'Ja' : 'Nee'}
                            </span>
                        </div>
                    </Fragment>
                )}
            </td>
            <td>
                {fundProvider.state == 'pending' ? (
                    <div className="text-muted">-</div>
                ) : (
                    <Fragment>
                        {fundProvider.state == 'rejected' && <div className="text-strong">Nee</div>}

                        <div>
                            {fundProvider.state == 'rejected' && <em className="mdi mdi-backup-restore" />}

                            {['accepted', 'rejected'].includes(fundProvider.state) && (
                                <Fragment>
                                    {fundProvider.allow_products ? (
                                        <span
                                            className={
                                                fundProvider.state == 'rejected'
                                                    ? 'text-line-through text-small text-muted'
                                                    : 'text-strong'
                                            }>
                                            Alle
                                        </span>
                                    ) : (
                                        <span
                                            className={
                                                fundProvider.state == 'rejected'
                                                    ? 'text-line-through text-small text-muted'
                                                    : 'text-strong'
                                            }>
                                            {`${fundProvider.products_count_approved} van ${fundProvider.products_count_available}`}
                                        </span>
                                    )}
                                </Fragment>
                            )}
                        </div>
                    </Fragment>
                )}
            </td>
            <td>
                <div className="card-block card-block-listing card-block-listing-inline card-block-listing-variant">
                    <label
                        className={`form-toggle ${
                            fundProvider.state != 'accepted' ? 'form-toggle-disabled form-toggle-off' : ''
                        } ${submittingExcluded ? 'form-toggle-disabled' : ''}`}
                        htmlFor={`provider_excluded_${fundProvider.id}`}>
                        <input
                            type="checkbox"
                            id={`provider_excluded_${fundProvider.id}`}
                            disabled={fundProvider.state != 'accepted' || submittingExcluded}
                            onChange={(e) => updateFundProviderExcluded(fundProvider, { excluded: e.target.checked })}
                            checked={fundProvider.excluded}
                        />
                        <div className="form-toggle-inner flex-end">
                            <div className="toggle-input">
                                <div className="toggle-input-dot" />
                            </div>
                        </div>
                    </label>
                </div>
            </td>
            <td className="text-right">
                {(fundProvider.state == 'pending' || fundProvider.state == 'accepted') &&
                    submittingState !== 'accepted' && (
                        <button
                            type="button"
                            className="button button-sm button-danger button-icon"
                            onClick={() => updateFundProviderState(fundProvider, false)}
                            disabled={submittingState}>
                            <em className={`mdi ${submittingState ? 'mdi-loading mdi-spin' : 'mdi-close'}`} />
                        </button>
                    )}

                {(fundProvider.state == 'pending' || fundProvider.state == 'rejected') &&
                    submittingState != 'reject' && (
                        <button
                            type="button"
                            className="button button-sm button-primary button-icon"
                            onClick={() => updateFundProviderState(fundProvider, true)}
                            disabled={submittingState}>
                            <em className={`mdi ${submittingState ? 'mdi-loading mdi-spin' : 'mdi-check'}`} />
                        </button>
                    )}

                <StateNavLink
                    name={'fund-provider'}
                    params={{
                        id: fundProvider.id,
                        fundId: fundProvider.fund_id,
                        organizationId: organization.id,
                    }}
                    className={`button button-sm button-default ${submittingState ? 'disabled' : ''}`}>
                    <em className="mdi mdi-eye-outline icon-start" />
                    Bekijk aanbod
                </StateNavLink>
            </td>
        </tr>
    );
}
