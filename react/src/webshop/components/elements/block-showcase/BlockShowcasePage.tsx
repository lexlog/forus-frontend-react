import React, { CSSProperties, useCallback, useState } from 'react';
import BlockShowcase from './BlockShowcase';
import BlockLoader from '../block-loader/BlockLoader';
import ErrorBoundaryHandler from '../../../../dashboard/components/elements/error-boundary-handler/ErrorBoundaryHandler';
import classNames from 'classnames';
import BlockBreadcrumbs, { Breadcrumb } from '../block-breadcrumbs/BlockBreadcrumbs';
import ReadSpeakerButton from '../../../modules/read_speaker/ReadSpeakerButton';
import useIsMobile from '../../../hooks/useIsMobile';
import { clickOnKeyEnter } from '../../../../dashboard/helpers/wcag';

export default function BlockShowcasePage({
    aside = null,
    children = null,
    contentStyles = null,
    breadcrumbItems = null,
    showCaseClassName = null,
    countFiltersApplied = null,
}: {
    aside?: React.ReactElement | Array<React.ReactElement>;
    children?: React.ReactElement | Array<React.ReactElement>;
    contentStyles?: CSSProperties;
    breadcrumbItems?: Array<Breadcrumb>;
    showCaseClassName?: string;
    countFiltersApplied?: number;
}) {
    const isMobile = useIsMobile(1000);
    const [showModalFilters, setShowModalFilters] = useState(false);

    const showMobileMenu = useCallback(() => {
        setShowModalFilters(true);
    }, []);

    const hideMobileMenu = () => {
        setShowModalFilters(false);
    };

    const toggleMobileMenu = useCallback(() => {
        return showModalFilters ? hideMobileMenu() : showMobileMenu();
    }, [showMobileMenu, showModalFilters]);

    return (
        <BlockShowcase className={showCaseClassName}>
            <div className="showcase-wrapper">
                <div className={classNames('showcase-mobile-filters', 'rs_skip', countFiltersApplied && 'active')}>
                    <div className="mobile-filters-count">
                        <div className="mobile-filters-count-value">{countFiltersApplied}</div>
                    </div>
                    <div className="mobile-filters-title">Filteren</div>
                    <div
                        className="mobile-filters-icon"
                        onClick={toggleMobileMenu}
                        role="button"
                        tabIndex={0}
                        onKeyDown={clickOnKeyEnter}
                        aria-label="Filteren"
                        aria-expanded={showModalFilters}
                        aria-controls={'aside-mobile'}>
                        <em className="mdi mdi-filter-outline" />
                    </div>
                </div>

                <div className="hide-sm">
                    {breadcrumbItems?.length > 0 && (
                        <BlockBreadcrumbs
                            items={breadcrumbItems}
                            after={
                                <ReadSpeakerButton className={'breadcrumb-read-speaker'} targetId={'main-content'} />
                            }
                        />
                    )}
                </div>

                <ErrorBoundaryHandler>
                    <div className="showcase-layout">
                        <div
                            className={classNames(
                                'showcase-aside form form-compact',
                                showModalFilters && 'show-mobile',
                                isMobile && 'rs_skip',
                            )}
                            id={'aside-mobile'}>
                            {aside || <BlockLoader />}
                        </div>

                        <div className="showcase-content" style={contentStyles}>
                            <div className="show-sm">
                                {breadcrumbItems?.length > 0 && (
                                    <BlockBreadcrumbs
                                        items={breadcrumbItems}
                                        after={
                                            <ReadSpeakerButton
                                                className={'breadcrumb-read-speaker'}
                                                targetId={'main-content'}
                                            />
                                        }
                                    />
                                )}
                            </div>
                            <ErrorBoundaryHandler>{children || <BlockLoader />}</ErrorBoundaryHandler>
                        </div>
                    </div>
                </ErrorBoundaryHandler>
            </div>
        </BlockShowcase>
    );
}
