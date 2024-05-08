import React, { useCallback, useMemo } from 'react';
import Product from '../../../../props/models/Product';
import useBookmarkProductToggle from '../../../../services/helpers/useBookmarkProductToggle';
import StateNavLink from '../../../../modules/state_router/StateNavLink';
import ProductsListItemGrid from './templates/ProductsListItemGrid';
import ProductsListItemList from './templates/ProductsListItemList';
import ProductsListItemSearch from './templates/ProductsListItemSearch';

export default function ProductsListItem({
    display,
    product,
    productType,
    searchParams = null,
    onToggleBookmark = null,
}: {
    display: 'grid' | 'list' | 'search';
    product: Product;
    productType?: 'budget' | 'subsidies';
    searchParams?: object;
    onToggleBookmark?: (product: Product) => void;
}) {
    const bookmarkProductToggle = useBookmarkProductToggle();

    const price = useMemo(() => {
        if (productType == 'subsidies') {
            if (product.price_type === 'regular' && product.price_min == '0.00') {
                return 'Gratis';
            }

            if (product.price_type === 'regular' && product.price_min != '0.00') {
                return product.price_min_locale;
            }

            if (product.price_type !== 'regular') {
                return product.price_locale;
            }
        }

        return product.price_locale;
    }, [product, productType]);

    const toggleBookmark = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            product.bookmarked = await bookmarkProductToggle(product);
            onToggleBookmark?.(product);
        },
        [onToggleBookmark, product, bookmarkProductToggle],
    );

    return (
        <StateNavLink
            name={'product'}
            params={{ id: product.id }}
            state={{ searchParams: searchParams || null }}
            className={display === 'search' ? 'search-item search-item-product' : 'product-item'}
            dataDusk="productItem">
            {display === 'grid' && (
                <ProductsListItemGrid price={price} toggleBookmark={toggleBookmark} product={product} />
            )}

            {display === 'list' && (
                <ProductsListItemList price={price} toggleBookmark={toggleBookmark} product={product} />
            )}

            {display === 'search' && <ProductsListItemSearch product={product} />}
        </StateNavLink>
    );
}
