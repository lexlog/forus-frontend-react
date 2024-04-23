import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import useAppConfigs from '../../../hooks/useAppConfigs';
import useAssetUrl from '../../../hooks/useAssetUrl';
import { GoogleMap } from '../../../../dashboard/components/elements/google-map/GoogleMap';
import Office from '../../../../dashboard/props/models/Office';
import MapMarkerProviderOfficeView from '../../elements/map-markers/MapMarkerProviderOfficeView';
import { useProviderService } from '../../../services/ProviderService';
import Markdown from '../../elements/markdown/Markdown';
import Provider from '../../../props/models/Provider';
import BlockProducts from '../../elements/block-products/BlockProducts';
import { PaginationData } from '../../../../dashboard/props/ApiResponses';
import Product from '../../../props/models/Product';
import { useProductService } from '../../../services/ProductService';
import { useStateParams } from '../../../modules/state_router/Router';
import useSetTitle from '../../../hooks/useSetTitle';
import useTranslate from '../../../../dashboard/hooks/useTranslate';
import BlockShowcase from '../../elements/block-showcase/BlockShowcase';
import BlockLoader from '../../../../dashboard/components/elements/block-loader/BlockLoader';

export default function ProvidersShow() {
    const { id } = useParams();

    const assetUrl = useAssetUrl();
    const setTitle = useSetTitle();
    const translate = useTranslate();

    const appConfigs = useAppConfigs();
    const productService = useProductService();
    const providerService = useProviderService();

    const [provider, setProvider] = useState<Provider>(null);
    const [products, setProducts] = useState<PaginationData<Product>>(null);
    const [subsidies, setSubsidies] = useState<PaginationData<Product>>(null);

    const { searchParams } = useStateParams();

    const [mapOptions] = useState({
        zoom: 11,
        centerType: 'avg',
        fullscreenControlOptions: { position: window.google.maps.ControlPosition.TOP_RIGHT },
    });

    const fetchProvider = useCallback(() => {
        providerService.read(parseInt(id)).then((res) => setProvider(res.data.data));
    }, [id, providerService]);

    const fetchProducts = useCallback(() => {
        if (!provider) {
            return;
        }

        productService
            .list({ fund_type: 'budget', per_page: 3, organization_id: provider?.id })
            .then((res) => setProducts(res.data));

        productService
            .list({ fund_type: 'subsidies', per_page: 3, organization_id: provider?.id })
            .then((res) => setSubsidies(res.data));
    }, [provider, productService]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        fetchProvider();
    }, [fetchProvider]);

    useEffect(() => {
        setTitle(translate('page_state_titles.provider', { provider_name: provider?.name || '' }));
    }, [provider?.name, setTitle, translate]);

    return (
        <BlockShowcase wrapper={false} loaderElement={<BlockLoader type={'full'} />}>
            {provider && (
                <main id="main-content">
                    <div className="block block-provider">
                        <div className="provider-breadcrumbs">
                            <div className="wrapper">
                                <div className="block block-breadcrumbs">
                                    {searchParams && (
                                        <StateNavLink
                                            className="breadcrumb-item breadcrumb-item-back"
                                            name={'search-result'}
                                            state={searchParams}>
                                            <em className="mdi mdi-chevron-left" />
                                            Terug
                                        </StateNavLink>
                                    )}
                                    <StateNavLink name={'providers'} className="breadcrumb-item" activeExact={true}>
                                        Aanbieders
                                    </StateNavLink>
                                    <div className="breadcrumb-item active" aria-current="location">
                                        {provider.name}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {appConfigs.show_provider_map && (
                            <div className="provider-map">
                                <div className="block block-google-map">
                                    <GoogleMap
                                        appConfigs={appConfigs}
                                        mapPointers={provider.offices}
                                        mapGestureHandling={'greedy'}
                                        mapGestureHandlingMobile={'none'}
                                        mapOptions={mapOptions}
                                        markerTemplate={(office: Office) => (
                                            <MapMarkerProviderOfficeView office={office} />
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        <div
                            className={`provider-content ${
                                appConfigs.show_provider_map ? '' : 'provider-content-top'
                            }`}>
                            <div className="block block-pane">
                                <div className="pane-head">
                                    <h1 className="sr-only">{provider.name}</h1>
                                    <h2 className="pane-head-title">Aanbieder informatie</h2>
                                </div>
                                <div className="pane-section">
                                    <div className="provider-details">
                                        <div className="provider-description">
                                            <img
                                                className="provider-logo"
                                                src={
                                                    provider.logo?.sizes?.thumbnail ||
                                                    assetUrl('/assets/img/placeholders/organization-thumbnail.png')
                                                }
                                                alt=""
                                            />
                                            <div className="provider-title">{provider.name}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pane-section pane-section-compact-vertical">
                                    <div className="block block-data-list">
                                        {provider.email && (
                                            <div className="data-list-row">
                                                <div className="data-list-key">E-mailadres:</div>
                                                <div className="data-list-value">{provider.email}</div>
                                            </div>
                                        )}
                                        {provider.phone && (
                                            <div className="data-list-row">
                                                <div className="data-list-key">Telefoonnummer:</div>
                                                <div className="data-list-value">{provider.phone}</div>
                                            </div>
                                        )}
                                        {provider && (
                                            <div className="data-list-row">
                                                <div className="data-list-key">Type aanbieder:</div>
                                                <div className="data-list-value">
                                                    <div className="label label-default label-sm">
                                                        {provider.business_type?.name || 'Geen aanbieder type'}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {provider.description_html && (
                                <div className="block block-pane">
                                    <div className="pane-head">
                                        <h2 className="pane-head-title">Omschrijving</h2>
                                    </div>
                                    <div className="pane-section">
                                        <div className="block block-markdown">
                                            <Markdown content={provider.description_html} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="block block-pane last-child">
                                <h2 className="pane-head">
                                    <div className="flex-grow">Vestigingen</div>
                                    <div className="pane-head-count">{provider.offices.length}</div>
                                </h2>
                            </div>
                            <div className="block block-organizations">
                                <div className="organization-item">
                                    <div className="organization-offices">
                                        <div className="block block-offices">
                                            {provider.offices?.map((office) => (
                                                <StateNavLink
                                                    key={office.id}
                                                    name={'provider-office'}
                                                    params={{ organization_id: office.organization_id, id: office.id }}
                                                    className="office-item">
                                                    <div className="office-item-map-icon">
                                                        <em className="mdi mdi-map-marker" role="img" aria-label="" />
                                                    </div>
                                                    <div className="office-pane">
                                                        <div className="office-pane-block">
                                                            <div className="office-logo">
                                                                <img
                                                                    className="office-logo-img"
                                                                    src={
                                                                        office.photo?.sizes?.thumbnail ||
                                                                        assetUrl(
                                                                            '/assets/img/placeholders/office-thumbnail.png',
                                                                        )
                                                                    }
                                                                    alt=""
                                                                />
                                                            </div>
                                                            <div className="office-details">
                                                                <div className="office-title">{office.address}</div>
                                                                <div className="office-labels">
                                                                    <div className="label label-default">
                                                                        {provider?.business_type?.name ||
                                                                            'Geen aanbieder type'}
                                                                    </div>
                                                                </div>
                                                                {(office.phone || provider.phone || provider.email) && (
                                                                    <div>
                                                                        {(office.phone || provider.phone) && (
                                                                            <div className="office-info office-info-inline">
                                                                                <em className="mdi mdi-phone-outline" />
                                                                                {office.phone
                                                                                    ? office.phone
                                                                                    : provider.phone}
                                                                            </div>
                                                                        )}
                                                                        {provider.email && (
                                                                            <div className="office-info office-info-inline">
                                                                                <em className="mdi mdi-email-outline" />
                                                                                {provider.email}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </StateNavLink>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {products?.data?.length > 0 && (
                                <BlockProducts
                                    type={'budget'}
                                    display={'grid'}
                                    large={false}
                                    products={products.data}
                                    filters={{ organization_id: provider.id }}
                                />
                            )}

                            {subsidies?.data?.length > 0 && (
                                <BlockProducts
                                    type={'subsidies'}
                                    display={'grid'}
                                    large={false}
                                    products={subsidies.data}
                                    filters={{ organization_id: provider.id }}
                                />
                            )}
                        </div>
                    </div>
                </main>
            )}
        </BlockShowcase>
    );
}
