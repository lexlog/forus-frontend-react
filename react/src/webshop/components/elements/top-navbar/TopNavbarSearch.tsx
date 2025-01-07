import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigateState, useStateRoutes } from '../../../modules/state_router/Router';
import useAppConfigs from '../../../hooks/useAppConfigs';
import useEnvData from '../../../hooks/useEnvData';
import { mainContext } from '../../../contexts/MainContext';
import ClickOutside from '../../../../dashboard/components/elements/click-outside/ClickOutside';
import {
    SearchResult,
    SearchResultGroup,
    SearchResultGroupItem,
    useSearchService,
} from '../../../services/SearchService';
import useTranslate from '../../../../dashboard/hooks/useTranslate';
import useFilter from '../../../../dashboard/hooks/useFilter';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import IconSearchAll from '../../../../../assets/forus-webshop/resources/_webshop-common/assets/img/icon-search/all.svg';
import IconSearchFunds from '../../../../../assets/forus-webshop/resources/_webshop-common/assets/img/icon-search/funds.svg';
import IconSearchProducts from '../../../../../assets/forus-webshop/resources/_webshop-common/assets/img/icon-search/products.svg';
import IconSearchProviders from '../../../../../assets/forus-webshop/resources/_webshop-common/assets/img/icon-search/providers.svg';
import IconSearchEmptyResult from '../../../../../assets/forus-webshop/resources/_webshop-common/assets/img/icon-search/empty-search.svg';
import TopNavbarSearchResultItem from './TopNavbarSearchResultItem';
import useSetProgress from '../../../../dashboard/hooks/useSetProgress';
import { clickOnKeyEnter } from '../../../../dashboard/helpers/wcag';
import classNames from 'classnames';

export type SearchResultGroupLocal = SearchResultGroup & {
    shown?: boolean;
};

export type SearchResultLocal = {
    funds: SearchResultGroupLocal;
    products: SearchResultGroupLocal;
    providers: SearchResultGroupLocal;
};

export default function TopNavbarSearch() {
    const envData = useEnvData();
    const appConfigs = useAppConfigs();
    const { route } = useStateRoutes();
    const { setShowSearchBox, searchFilter } = useContext(mainContext);

    const translate = useTranslate();
    const navigateState = useNavigateState();
    const searchService = useSearchService();

    const setProgress = useSetProgress();

    const [dropdown, setDropdown] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);

    const [results, setResults] = useState<SearchResultLocal>(null);
    const [resultsAll, setResultsAll] = useState<Array<SearchResultGroupItem>>(null);

    const [groupKey, setGroupKey] = useState('all');
    const [groupKeyList] = useState(['all', 'products', 'funds', 'providers']);

    const [lastQuery, setLastQuery] = useState('');

    const filters = useFilter({
        q: '',
    });

    const { resetFilters, update: filterUpdate } = filters;
    const { update: updateSearchFilters } = searchFilter;

    const globalQuery = useMemo(() => searchFilter?.values?.q, [searchFilter?.values?.q]);

    const isSearchResultPage = useMemo(() => {
        return route.state.name === 'search-result';
    }, [route?.state?.name]);

    const hideDropDown = useCallback(() => {
        setDropdown(false);
    }, []);

    const showDropDown = useCallback(() => {
        setDropdown(true);
    }, []);

    const clearSearch = useCallback(() => {
        resetFilters();
        setResults(null);
        setResultsAll(null);
        setGroupKey('all');
        hideDropDown();
    }, [hideDropDown, resetFilters]);

    const cancelSearch = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
                clearSearch();
            }
        },
        [clearSearch],
    );

    const toggleGroup = useCallback((e: React.MouseEvent, groupKey: string) => {
        e.preventDefault();
        e.stopPropagation();

        setResults((results) => {
            results[groupKey].shown = !results[groupKey].shown;
            return { ...results };
        });
    }, []);

    const updateResults = useCallback(
        (results: SearchResult) => {
            const listKeys = Object.keys(results);
            const listItems = listKeys.reduce((arr, key) => [...arr, ...results[key].items], []);

            setResults(results);
            setResultsAll(listItems);
            showDropDown();
        },
        [showDropDown],
    );

    const hideSearchBox = useCallback(() => {
        if (!envData.config?.flags?.genericSearchUseToggle && window.innerWidth >= 1000) {
            return;
        }

        setShowSearchBox(false);
        hideDropDown();
    }, [envData?.config?.flags?.genericSearchUseToggle, setShowSearchBox, hideDropDown]);

    useEffect(() => {
        setLastQuery(filters.activeValues.q);

        if (isSearchResultPage) {
            return;
        }

        if (!filters.activeValues.q || filters.activeValues.q?.length == 0) {
            return clearSearch();
        }
        setProgress(0);

        searchService
            .searchWithOverview({ q: filters.activeValues.q, with_external: 1, take: 9 })
            .then((res) => updateResults(res.data.data))
            .finally(() => setProgress(100));
    }, [filters.activeValues.q, isSearchResultPage, searchService, clearSearch, updateResults, setProgress]);

    useEffect(() => {
        let timer: number;

        if (isSearchResultPage) {
            timer = window.setTimeout(() => updateSearchFilters({ q: filters.values.q }));
        }

        return () => window.clearTimeout(timer);
    }, [filters.values.q, isSearchResultPage, updateSearchFilters]);

    useEffect(() => {
        filterUpdate({ q: globalQuery });
    }, [filterUpdate, globalQuery]);

    return (
        <div className={`block block-navbar-search ${dropdown ? 'block-navbar-search-results' : ''}`}>
            <form
                onSubmit={(e) => {
                    e?.preventDefault();
                    e?.stopPropagation();

                    if (!isSearchResultPage) {
                        navigateState('search-result', {}, { q: filters.values.q });
                    }
                }}
                className={`search-form form ${resultsAll?.length > 0 ? 'search-form-found' : ''}`}>
                <ClickOutside onClickOutside={hideSearchBox}>
                    <div className="search-area">
                        <label id="search-label" htmlFor="genericSearch" className="navbar-search-label">
                            {translate(`top_navbar_search.placeholders.search_${appConfigs.communication_type}`)}
                        </label>
                        <div className={classNames('navbar-search-icon', (searchFocused || dropdown) && 'focused')}>
                            <div className="mdi mdi-magnify" />
                        </div>
                        <input
                            id="genericSearch"
                            type="text"
                            className={classNames('form-control', (searchFocused || dropdown) && 'focused')}
                            autoComplete={'off'}
                            value={filters.values.q}
                            onChange={(e) => filters.update({ q: e.target.value })}
                            onKeyDown={cancelSearch}
                            aria-labelledby="search-label"
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            aria-haspopup={true}
                        />
                        {filters.values.q && (
                            <div
                                className="search-reset"
                                onClick={() => filters.update({ q: '' })}
                                onKeyDown={clickOnKeyEnter}
                                tabIndex={0}
                                aria-label="Sluit zoeken"
                                role="button">
                                <em className="mdi mdi-close" />
                            </div>
                        )}
                    </div>
                    {dropdown && (
                        <div className="search-result" role={'menu'}>
                            <div className="search-result-sidebar">
                                {groupKeyList.map((itemGroupKey) => (
                                    <h2
                                        key={itemGroupKey}
                                        className={`search-result-sidebar-item state-nav-link ${
                                            groupKey == itemGroupKey ? 'active' : ''
                                        }`}
                                        aria-selected={groupKey === itemGroupKey}
                                        aria-expanded={groupKey === itemGroupKey}
                                        role={'button'}
                                        tabIndex={0}
                                        onKeyDown={clickOnKeyEnter}
                                        onClick={() => setGroupKey(itemGroupKey)}>
                                        {itemGroupKey === 'all' && (
                                            <div className="search-result-sidebar-item-icon hide-sm" aria-hidden="true">
                                                <IconSearchAll />
                                            </div>
                                        )}

                                        {itemGroupKey === 'funds' && (
                                            <div className="search-result-sidebar-item-icon hide-sm" aria-hidden="true">
                                                <IconSearchFunds />
                                            </div>
                                        )}

                                        {itemGroupKey === 'products' && (
                                            <div className="search-result-sidebar-item-icon hide-sm" aria-hidden="true">
                                                <IconSearchProducts />
                                            </div>
                                        )}

                                        {itemGroupKey === 'providers' && (
                                            <div className="search-result-sidebar-item-icon hide-sm" aria-hidden="true">
                                                <IconSearchProviders />
                                            </div>
                                        )}

                                        <div className="search-result-sidebar-item-name">
                                            {translate(`top_navbar_search.result.${itemGroupKey}_label`)}
                                        </div>

                                        {itemGroupKey == groupKey && (
                                            <div className="search-result-sidebar-item-arrow hide-sm">
                                                <div className="mdi mdi-chevron-right" />
                                            </div>
                                        )}
                                    </h2>
                                ))}
                            </div>
                            <div className="search-result-content">
                                {groupKeyList
                                    .filter((itemKey) => {
                                        return (
                                            (groupKey == 'all' || groupKey == itemKey) &&
                                            itemKey != 'all' &&
                                            results[itemKey].items.length > 0
                                        );
                                    })
                                    .map((itemKey) => (
                                        <div key={itemKey} className="search-result-section">
                                            <div className="search-result-group-header">
                                                {itemKey === 'funds' && (
                                                    <div
                                                        className="search-result-group-icon hide-sm"
                                                        aria-hidden="true">
                                                        <IconSearchFunds />
                                                    </div>
                                                )}
                                                {itemKey === 'products' && (
                                                    <div
                                                        className="search-result-group-icon hide-sm"
                                                        aria-hidden="true">
                                                        <IconSearchProducts />
                                                    </div>
                                                )}
                                                {itemKey === 'providers' && (
                                                    <div
                                                        className="search-result-group-icon hide-sm"
                                                        aria-hidden="true">
                                                        <IconSearchProviders />
                                                    </div>
                                                )}
                                                <div className="search-result-group-title flex">
                                                    {results[itemKey].shown ? (
                                                        <em
                                                            className="mdi mdi-menu-up show-sm"
                                                            onClick={(e) => toggleGroup(e, itemKey)}
                                                        />
                                                    ) : (
                                                        <em
                                                            className="mdi mdi-menu-down show-sm"
                                                            onClick={(e) => toggleGroup(e, itemKey)}
                                                        />
                                                    )}
                                                    {translate(`top_navbar_search.result.${itemKey}_label`)}
                                                </div>
                                                {results[itemKey].count > 3 && (
                                                    <StateNavLink
                                                        name={'search-result'}
                                                        query={{ q: lastQuery, [itemKey]: 1 }}
                                                        className="search-result-group-link hide-sm">
                                                        {`${results?.[itemKey]?.count} resultaten gevonden...`}
                                                    </StateNavLink>
                                                )}
                                            </div>

                                            {results?.[itemKey] && !results?.[itemKey]?.shown && (
                                                <div className="search-result-items">
                                                    {results[itemKey].items?.map(
                                                        (value: SearchResultGroupItem, index: number) => (
                                                            <StateNavLink
                                                                key={index}
                                                                name={value.item_type}
                                                                params={{ id: value.id }}
                                                                className="search-result-item">
                                                                <TopNavbarSearchResultItem
                                                                    q={filters.activeValues.q}
                                                                    name={value.name}
                                                                />
                                                                <em className="mdi mdi-chevron-right show-sm" />
                                                            </StateNavLink>
                                                        ),
                                                    )}

                                                    {results[itemKey]?.count > 3 && (
                                                        <StateNavLink
                                                            name="search-result"
                                                            query={{ q: lastQuery, [itemKey]: 1 }}
                                                            className="search-result-group-link show-sm">
                                                            {`${results?.[itemKey]?.count} resultaten gevonden...`}
                                                        </StateNavLink>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                <div className="search-result-footer">
                                    {groupKey == 'all' && resultsAll.length > 0 && (
                                        <div className="search-result-actions">
                                            <button
                                                type={'submit'}
                                                name={'search-result'}
                                                className="button button-primary">
                                                {translate('top_navbar_search.result.btn')}
                                                <em className="mdi mdi-arrow-right icon-right" aria-hidden="true" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {((groupKey == 'all' && !resultsAll.length) ||
                                    (groupKey != 'all' && !results[groupKey].items.length)) && (
                                    <div className="search-no-result">
                                        <div className="search-no-result-icon" aria-hidden="true">
                                            <IconSearchEmptyResult />
                                        </div>
                                        <div className="search-no-result-description">
                                            {translate('top_navbar_search.noresult.subtitle', { query: lastQuery })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </ClickOutside>
            </form>
        </div>
    );
}
