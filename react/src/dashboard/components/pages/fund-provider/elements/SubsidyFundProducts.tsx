import React, { useCallback, useEffect, useState } from 'react';
import { PaginationData, ResponseError } from '../../../../props/ApiResponses';
import usePushDanger from '../../../../hooks/usePushDanger';
import FundProvider from '../../../../props/models/FundProvider';
import Organization from '../../../../props/models/Organization';
import useFilter from '../../../../hooks/useFilter';
import Paginator from '../../../../modules/paginator/components/Paginator';
import Product, { DealHistory } from '../../../../props/models/Product';
import useSetProgress from '../../../../hooks/useSetProgress';
import LoadingCard from '../../../elements/loading-card/LoadingCard';
import { useFundService } from '../../../../services/FundService';
import useUpdateProduct from '../hooks/useUpdateProduct';
import TableRowActions from '../../../elements/tables/TableRowActions';
import StateNavLink from '../../../../modules/state_router/StateNavLink';
import EmptyCard from '../../../elements/empty-card/EmptyCard';

type ProductLocal = Product & {
    allowed: boolean;
    active_deal: DealHistory;
};

export default function SubsidyFundProducts({
    fundProvider,
    organization,
    onChange,
}: {
    fundProvider: FundProvider;
    organization: Organization;
    onChange: (data: FundProvider) => void;
}) {
    const pushDanger = usePushDanger();
    const setProgress = useSetProgress();
    const { disableProduct } = useUpdateProduct();

    const fundService = useFundService();

    const [products, setProducts] = useState<PaginationData<ProductLocal>>(null);
    const [shownProductMenuId, setShownProductMenuId] = useState<number>(null);

    const filter = useFilter({ q: '', per_page: 15 });

    const disableProviderProduct = useCallback(
        (product: ProductLocal) => {
            disableProduct(fundProvider, product).then((res) => onChange(res));
        },
        [disableProduct, fundProvider, onChange],
    );

    const mapProduct = useCallback(
        (product: Product) => {
            const activeDeals = product.deals_history ? product.deals_history.filter((deal) => deal.active) : [];

            return {
                ...product,
                allowed: fundProvider.products.indexOf(product.id) !== -1,
                active_deal: activeDeals.length > 0 ? activeDeals[0] : null,
            };
        },
        [fundProvider.products],
    );

    const fetchProducts = useCallback(() => {
        setProgress(0);

        fundService
            .listProviderProducts(
                fundProvider.fund.organization_id,
                fundProvider.fund.id,
                fundProvider.id,
                filter.activeValues,
            )
            .then((res) =>
                setProducts({
                    ...res.data,
                    data: res.data.data.map((product) => mapProduct(product)),
                }),
            )
            .catch((err: ResponseError) => pushDanger('Mislukt!', err.data.message))
            .finally(() => setProgress(100));
    }, [setProgress, fundService, fundProvider, filter.activeValues, mapProduct, pushDanger]);

    useEffect(() => fetchProducts(), [fetchProducts]);

    if (!products) {
        return <LoadingCard />;
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="flex-row">
                    <div className="flex-col">
                        <div className="card-title">Aanbod in beheer van {fundProvider.organization.name}</div>
                    </div>
                    <div className="flex-col">
                        <div className="card-header-drown">
                            <div className="block block-inline-filters">
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
                </div>
            </div>

            {products.meta.total > 0 ? (
                <div className="card-section card-section-padless">
                    <div className="table-wrapper">
                        <table className="table">
                            <tbody>
                                <tr>
                                    <th className="td-narrow">Afbeelding</th>
                                    <th>Naam</th>
                                    <th>Aantal</th>
                                    <th>Bijdrage</th>
                                    <th>Prijs</th>
                                    <th />
                                </tr>
                                {products.data.map((product) => (
                                    <tr key={product.id}>
                                        <td className="td-narrow">
                                            <img
                                                className="td-media"
                                                src={
                                                    product.photo
                                                        ? product.photo.sizes.small
                                                        : './assets/img/placeholders/product-small.png'
                                                }
                                                alt={product.name}
                                            />
                                        </td>
                                        <td>{product.name}</td>
                                        {product.unlimited_stock ? (
                                            <td>Ongelimiteerd</td>
                                        ) : (
                                            <td>{product.stock_amount}</td>
                                        )}
                                        <td>{product.active_deal ? product.active_deal.amount_locale : '-'}</td>
                                        <td className="nowrap">{product.price_locale}</td>

                                        <td className="td-narrow text-right">
                                            <div className="button-group flex-end">
                                                {product.is_available && product.allowed && (
                                                    <div className="flex flex-center">
                                                        <div className="flex-self-center">
                                                            <div className="tag tag-success nowrap flex">
                                                                Subsidie actief
                                                                <em
                                                                    className="mdi mdi-close icon-end clickable"
                                                                    onClick={() => disableProviderProduct(product)}
                                                                />
                                                            </div>
                                                            <div className="hidden" />
                                                        </div>
                                                    </div>
                                                )}

                                                {!product.is_available && (
                                                    <div className="flex flex-center">
                                                        <div className="flex-self-center">
                                                            <div className="tag tag-text nowrap">Niet beschikbaar</div>
                                                            <div className="hidden" />
                                                        </div>
                                                    </div>
                                                )}

                                                {product.is_available && !product.allowed && (
                                                    <StateNavLink
                                                        name={'fund-provider-product-subsidy-edit'}
                                                        params={{
                                                            id: product.id,
                                                            fundId: fundProvider.fund_id,
                                                            fundProviderId: fundProvider.id,
                                                            organizationId: organization.id,
                                                        }}
                                                        className="button button-primary button-sm nowrap">
                                                        <em className="mdi mdi-play icon-start" />
                                                        Start subsidie
                                                    </StateNavLink>
                                                )}

                                                <TableRowActions
                                                    activeId={shownProductMenuId}
                                                    setActiveId={setShownProductMenuId}
                                                    id={product.id}>
                                                    <div className="dropdown dropdown-actions">
                                                        <StateNavLink
                                                            name={'fund-provider-product'}
                                                            params={{
                                                                id: product.id,
                                                                fundId: fundProvider.fund_id,
                                                                fundProviderId: fundProvider.id,
                                                                organizationId: organization.id,
                                                            }}
                                                            className="dropdown-item">
                                                            Bekijken
                                                        </StateNavLink>

                                                        {organization.manage_provider_products && (
                                                            <StateNavLink
                                                                name={'fund-provider-product-create'}
                                                                params={{
                                                                    fundId: fundProvider.fund_id,
                                                                    source: product.id,
                                                                    fundProviderId: fundProvider.id,
                                                                    organizationId: organization.id,
                                                                }}
                                                                query={{ source_id: product.id }}
                                                                className="dropdown-item">
                                                                Kopieren
                                                            </StateNavLink>
                                                        )}
                                                    </div>
                                                </TableRowActions>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <EmptyCard title={'Geen aanbiedingen'} type={'card-section'} />
            )}

            {products.meta && (
                <div className="card-section card-section-narrow">
                    <Paginator meta={products.meta} filters={filter.values} updateFilters={filter.update} />
                </div>
            )}
        </div>
    );
}
