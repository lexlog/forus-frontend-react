import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FilterModel from '../../../types/FilterModel';
import FilterSetter from '../../../types/FilterSetter';
import { ApiPaginationMetaProp } from '../../../props/ApiResponses';
import usePaginatorService from '../services/usePaginatorService';
import SelectControl from '../../../components/elements/select-control/SelectControl';
import SelectControlOptions from '../../../components/elements/select-control/templates/SelectControlOptions';
import { clickOnKeyEnter } from '../../../helpers/wcag';
import useTranslate from '../../../hooks/useTranslate';
import classNames from 'classnames';
import useProgress from '../../../hooks/useProgress';

export default function Paginator({
    meta,
    filters,
    countButtons = 5,
    updateFilters,
    perPageKey,
    className = '',
    loadingProvider = 'progress',
}: {
    meta: ApiPaginationMetaProp;
    filters: FilterModel;
    updateFilters: FilterSetter;
    countButtons?: number;
    perPageKey?: string;
    className?: string;
    loadingProvider?: 'progress';
}) {
    const translate = useTranslate();
    const progress = useProgress();

    const [pages, setPages] = useState([]);
    const [loadingPage, setLoadingPage] = useState(null);
    const { perPageOptions, setPerPage } = usePaginatorService();

    const loading = useMemo(() => {
        if (loadingProvider === 'progress') {
            return progress < 100;
        }

        return false;
    }, [loadingProvider, progress]);

    const getPages = useCallback((meta: ApiPaginationMetaProp, countButtons = 5) => {
        let fromPage = Math.max(1, meta.current_page - Math.round(countButtons / 2 - 1));
        const pages = [];

        if (countButtons > meta.last_page - fromPage) {
            fromPage = Math.max(1, meta.last_page - countButtons + 1);
        }

        while (pages.length < countButtons && fromPage <= meta.last_page) {
            pages.push(fromPage++);
        }

        return pages;
    }, []);

    const setPage = useCallback(
        (page: number) => {
            updateFilters({ page });
            setLoadingPage(page);
        },
        [updateFilters],
    );

    const onChangePerPage = useCallback(
        (per_page: number) => {
            setPerPage(perPageKey, per_page);
            updateFilters({ page: 1, per_page });
        },
        [perPageKey, setPerPage, updateFilters],
    );

    useEffect(() => {
        setPages(getPages(meta, countButtons));

        if (meta.last_page < meta.current_page) {
            updateFilters({ page: 1, per_page: meta.per_page });
        }
    }, [meta, countButtons, getPages, updateFilters]);

    useEffect(() => {
        if (perPageKey && !perPageOptions.map((option) => option.key).includes(filters.per_page)) {
            onChangePerPage(perPageOptions[0].key);
        }
    }, [filters.per_page, onChangePerPage, perPageKey, perPageOptions]);

    useEffect(() => {
        if (meta && meta.current_page > meta.last_page) {
            setPage(meta.last_page);
        }
    }, [meta, setPage]);

    useEffect(() => {
        if (loadingPage && meta?.current_page && meta?.current_page === loadingPage) {
            setLoadingPage(null);
        }
    }, [meta?.current_page, loadingPage]);

    return (
        <div className={`table-pagination form ${className}`}>
            {meta.from && meta.to && (
                <div className={perPageKey && 'form'}>
                    <div className="table-pagination-counter">
                        {perPageKey && (
                            <SelectControl
                                className={'form-control'}
                                options={perPageOptions}
                                optionsComponent={SelectControlOptions}
                                propKey={'key'}
                                allowSearch={false}
                                value={meta.per_page}
                                onChange={onChangePerPage}
                            />
                        )}

                        <div className="table-pagination-counter-info">
                            <span className="text-strong">{`${meta.from}-${meta.to} `}</span>
                            {translate('paginator.labels.from')}
                            <span className="text-strong">{meta.total}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="table-pagination-navigation">
                <button
                    onClick={() => setPage(1)}
                    onKeyDown={clickOnKeyEnter}
                    tabIndex={meta.current_page === 1 ? undefined : 0}
                    disabled={loading || meta.current_page === 1}
                    className={`table-pagination-button`}>
                    {translate('paginator.buttons.first')}
                </button>
                {pages.map((page) => (
                    <button
                        key={page}
                        tabIndex={0}
                        onClick={() => setPage(page)}
                        disabled={loading && meta.current_page !== page && loadingPage !== page}
                        onKeyDown={clickOnKeyEnter}
                        className={classNames(
                            'table-pagination-button',
                            page === meta.current_page && 'table-pagination-button-active',
                            page === loadingPage && 'table-pagination-button-loading',
                        )}>
                        <span className="wcag-hidden">{translate('paginator.buttons.wcag_page')} </span>
                        {page}
                    </button>
                ))}
                <button
                    onClick={() => setPage(meta.last_page)}
                    onKeyDown={clickOnKeyEnter}
                    disabled={loading || meta.current_page === meta.last_page}
                    tabIndex={meta.current_page === meta.last_page ? undefined : 0}
                    className={`table-pagination-button`}>
                    {translate('paginator.buttons.last')}
                </button>
            </div>
        </div>
    );
}
