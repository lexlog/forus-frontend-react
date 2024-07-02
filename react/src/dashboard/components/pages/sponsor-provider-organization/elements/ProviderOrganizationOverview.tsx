import React, { Fragment, useCallback, useMemo, useState } from 'react';
import FundProvider from '../../../../props/models/FundProvider';
import Organization, { SponsorProviderOrganization } from '../../../../props/models/Organization';
import useAssetUrl from '../../../../hooks/useAssetUrl';
import { ResponseError } from '../../../../props/ApiResponses';
import useConfirmFundProviderUpdate from '../hooks/useConfirmFundProviderUpdate';
import { useFundService } from '../../../../services/FundService';
import usePushDanger from '../../../../hooks/usePushDanger';
import usePushSuccess from '../../../../hooks/usePushSuccess';
import useSetProgress from '../../../../hooks/useSetProgress';

export default function ProviderOrganizationOverview({
    organization,
    fundProvider,
    setFundProvider,
}: {
    organization: SponsorProviderOrganization | Organization;
    fundProvider?: FundProvider;
    setFundProvider?: React.Dispatch<React.SetStateAction<FundProvider>>;
}) {
    const assetUrl = useAssetUrl();
    const pushDanger = usePushDanger();
    const pushSuccess = usePushSuccess();
    const setProgress = useSetProgress();
    const confirmFundProviderUpdate = useConfirmFundProviderUpdate();

    const fundService = useFundService();

    const [submittingState, setSubmittingState] = useState(null);
    const [submittingAllow, setSubmittingAllow] = useState(null);
    const [submittingExcluded, setSubmittingExcluded] = useState(false);

    const properties = useMemo(() => {
        const propsArray: Array<{ label: string; value?: string; primary?: boolean }> = [];
        const makeProp = (label: string, value?: string, primary = false) => ({ label, value, primary });

        organization.email && propsArray.push(makeProp('E-mail', organization.email, true));
        organization.website && propsArray.push(makeProp('Website', organization.website, true));
        organization.phone && propsArray.push(makeProp('Telefoonnummer', organization.phone, true));
        organization.kvk && propsArray.push(makeProp('KVK', organization.kvk));
        organization.iban && propsArray.push(makeProp('IBAN', organization.iban));
        organization.btw && propsArray.push(makeProp('BTW', organization.btw));

        return [
            propsArray.splice(0, propsArray.length === 4 ? 4 : 3),
            propsArray.splice(0, propsArray.length === 4 ? 4 : 3),
        ].filter((list) => list.length > 0);
    }, [organization]);

    const updateProvider = useCallback(
        (data: { allow_budget?: boolean; allow_products?: boolean; excluded?: boolean }) => {
            setProgress(0);

            return fundService
                .updateProvider(fundProvider.fund.organization_id, fundProvider.fund.id, fundProvider.id, data)
                .then((res) => {
                    pushSuccess('Opgeslagen!');
                    setFundProvider(res.data.data);
                })
                .catch((err: ResponseError) => pushDanger('Mislukt!', err.data.message))
                .finally(() => setProgress(100));
        },
        [fundProvider, fundService, setFundProvider, pushDanger, pushSuccess, setProgress],
    );

    const updateFundProviderAllow = useCallback(
        (data: { allow_budget?: boolean; allow_products?: boolean }) => {
            setSubmittingAllow(true);
            updateProvider(data).finally(() => setSubmittingAllow(false));
        },
        [updateProvider],
    );

    const updateFundProviderExcluded = useCallback(
        (data: { excluded?: boolean }) => {
            setSubmittingExcluded(true);
            updateProvider(data).finally(() => setSubmittingExcluded(false));
        },
        [updateProvider],
    );

    const updateFundProviderState = useCallback(
        (accepted: boolean) => {
            const state = accepted ? 'accepted' : 'rejected';
            setSubmittingState(state);

            confirmFundProviderUpdate(fundProvider, state)
                .then((data) => data && updateProvider(data))
                .catch((r) => r)
                .finally(() => setSubmittingState(null));
        },
        [confirmFundProviderUpdate, fundProvider, updateProvider],
    );

    return (
        <div className="card">
            <div className="card-section">
                <div className="block block-entity-overview flex">
                    <div className="flex flex-grow">
                        <div className="entity-photo">
                            <img
                                className="entity-photo-img"
                                src={
                                    organization.logo?.sizes?.thumbnail ||
                                    assetUrl('/assets/img/placeholders/organization-thumbnail.png')
                                }
                                alt={organization.name}
                            />
                        </div>
                        <div className="entity-details">
                            <div className="entity-title">
                                {organization.name}
                                <div className="entity-title-icon-suffix">
                                    {fundProvider?.excluded && <em className="mdi mdi-eye-off-outline" />}
                                </div>
                            </div>
                        </div>
                    </div>

                    {fundProvider && (
                        <div className="flex flex-vertical">
                            <div className="button-group">
                                {fundProvider.state != 'rejected' && (
                                    <button
                                        className="button button-default"
                                        disabled={submittingState}
                                        onClick={() => updateFundProviderState(false)}>
                                        <em className="mdi mdi-close icon-start" />
                                        Weigeren
                                    </button>
                                )}

                                {fundProvider.state != 'accepted' && (
                                    <button
                                        className="button button-primary"
                                        disabled={submittingState}
                                        onClick={() => updateFundProviderState(true)}>
                                        <em className="mdi mdi-check icon-start" />
                                        Accepteren
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {properties?.map((list, index: number) => (
                <div key={index} className="card-section card-section-primary card-section-narrow">
                    <div className="flex-row flex-grow">
                        {list.map((property, index) => (
                            <div key={index} className="flex-col">
                                <div className="card-block card-block-listing card-block-listing-inline card-block-listing-variant">
                                    <div className="card-block-listing-label">{property.label}</div>
                                    <div
                                        className={`card-block-listing-value ${
                                            property.primary ? 'text-primary-light' : ''
                                        }`}>
                                        {property.value}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {fundProvider && (
                <div className="card-section card-section-primary card-section-narrow form">
                    <div className="row">
                        <div className="col">
                            <div className="flex-row">
                                {fundProvider.fund.type == 'budget' && (
                                    <Fragment>
                                        <div className="flex-col">
                                            <div className="card-block card-block-listing card-block-listing-inline card-block-listing-variant">
                                                <div className="card-block-listing-label">Accepteer budget</div>
                                                <label
                                                    className={`form-toggle ${
                                                        fundProvider.state != 'accepted'
                                                            ? 'form-toggle-disabled form-toggle-off'
                                                            : ''
                                                    } ${submittingAllow ? 'form-toggle-disabled' : ''}`}
                                                    htmlFor="provider_allow_budget">
                                                    <input
                                                        type="checkbox"
                                                        id="provider_allow_budget"
                                                        disabled={fundProvider.state != 'accepted' || submittingAllow}
                                                        onChange={(e) => {
                                                            updateFundProviderAllow({ allow_budget: e.target.checked });
                                                        }}
                                                        checked={fundProvider.allow_budget}
                                                    />
                                                    <div className="form-toggle-inner flex-end">
                                                        <div className="toggle-input">
                                                            <div className="toggle-input-dot"></div>
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex-col">
                                            <div className="card-block card-block-listing card-block-listing-inline card-block-listing-variant">
                                                <div className="card-block-listing-label">Accepteer aanbiedingen</div>
                                                <label
                                                    className={`form-toggle ${
                                                        fundProvider.state != 'accepted'
                                                            ? 'form-toggle-disabled form-toggle-off'
                                                            : ''
                                                    } ${submittingAllow ? 'form-toggle-disabled' : ''}`}
                                                    htmlFor="provider_allow_products">
                                                    <input
                                                        type="checkbox"
                                                        id="provider_allow_products"
                                                        disabled={fundProvider.state != 'accepted' || submittingAllow}
                                                        onChange={(e) =>
                                                            updateFundProviderAllow({
                                                                allow_products: e.target.checked,
                                                            })
                                                        }
                                                        checked={fundProvider.allow_products}
                                                    />
                                                    <div className="form-toggle-inner flex-end">
                                                        <div className="toggle-input">
                                                            <div className="toggle-input-dot"></div>
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </Fragment>
                                )}

                                <div className="flex-col">
                                    <div className="card-block card-block-listing card-block-listing-inline card-block-listing-variant">
                                        <div className="card-block-listing-label">Verborgen op webshop</div>
                                        <label
                                            className={`form-toggle ${
                                                fundProvider.state != 'accepted'
                                                    ? 'form-toggle-disabled form-toggle-off'
                                                    : ''
                                            } ${submittingExcluded ? 'form-toggle-disabled' : ''}`}
                                            htmlFor="provider_excluded">
                                            <input
                                                type="checkbox"
                                                id="provider_excluded"
                                                disabled={fundProvider.state != 'accepted' || submittingExcluded}
                                                onChange={(e) => {
                                                    updateFundProviderExcluded({ excluded: e.target.checked });
                                                }}
                                                checked={fundProvider.excluded}
                                            />
                                            <div className="form-toggle-inner flex-end">
                                                <div className="toggle-input">
                                                    <div className="toggle-input-dot" />
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
