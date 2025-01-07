import React, { Fragment, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import useEnvData from '../../../hooks/useEnvData';
import useTranslate from '../../../../dashboard/hooks/useTranslate';
import { mainContext } from '../../../contexts/MainContext';
import useOpenModal from '../../../../dashboard/hooks/useOpenModal';
import useAuthIdentity from '../../../hooks/useAuthIdentity';
import useTopMenuItems from './helpers/useTopMenuItems';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import useAssetUrl from '../../../hooks/useAssetUrl';
import useAppConfigs from '../../../hooks/useAppConfigs';
import { strLimit } from '../../../../dashboard/helpers/string';
import { authContext } from '../../../contexts/AuthContext';
import ClickOutside from '../../../../dashboard/components/elements/click-outside/ClickOutside';
import useAuthIdentity2FAState from '../../../hooks/useAuthIdentity2FAState';
import { useNavigateState, useStateRoutes } from '../../../modules/state_router/Router';
import TopNavbarSearch from './TopNavbarSearch';
import Announcements from '../announcements/Announcements';
import ModalAuthPincode from '../../modals/ModalAuthPincode';
import { clickOnKeyEnter } from '../../../../dashboard/helpers/wcag';
import LayoutMobileMenu from '../../../layout/elements/LayoutMobileMenu';

export const TopNavbar = ({ hideOnScroll = false, className = '' }: { hideOnScroll?: boolean; className?: string }) => {
    const {
        showSearchBox,
        setShowSearchBox,
        mobileMenuOpened,
        setMobileMenuOpened,
        userMenuOpened,
        setUserMenuOpened,
    } = useContext(mainContext);

    const { signOut } = useContext(authContext);

    const assetUrl = useAssetUrl();
    const openModal = useOpenModal();
    const { route } = useStateRoutes();
    const navigateState = useNavigateState();
    const menuRef = useRef<HTMLDivElement>(null);

    const envData = useEnvData();
    const appConfigs = useAppConfigs();
    const auth2faState = useAuthIdentity2FAState();
    const translate = useTranslate();
    const authIdentity = useAuthIdentity();

    const mobileNavBarRef = useRef<HTMLDivElement>(null);
    // const { onKeyDown, onFocus, onBlur } = useReverseFocusKeyEventHandlers(mobileNavBarRef);

    const [visible, setVisible] = React.useState(false);
    const [prevWidth, setPrevWidth] = React.useState(null);
    const [prevOffsetY, setPrevOffsetY] = React.useState(0);

    const menuItems = useTopMenuItems();

    const logoExtension = useMemo(
        () => envData.config.flags?.logoExtension || '.svg',
        [envData.config.flags?.logoExtension],
    );

    const updateScrolled = useCallback(() => {
        const currentOffsetY = window.pageYOffset;

        setVisible(prevOffsetY > currentOffsetY || currentOffsetY <= 0);
        setPrevOffsetY(currentOffsetY);
    }, [prevOffsetY]);

    const onResize = useCallback(() => {
        if (prevWidth !== window.innerWidth) {
            setPrevWidth(window.innerWidth);
            setShowSearchBox(window.innerWidth >= 1000);
        }
    }, [prevWidth, setShowSearchBox]);

    const startFundRequest = useCallback(
        (data = {}) => {
            navigateState('start', null, data);
        },
        [navigateState],
    );

    const hideUserMenu = useCallback(() => {
        setUserMenuOpened(false);
    }, [setUserMenuOpened]);

    const openPinCodePopup = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            hideUserMenu();

            openModal((modal) => <ModalAuthPincode modal={modal} />);
        },
        [openModal, hideUserMenu],
    );

    const toggleSearchBox = useCallback(
        (e) => {
            e.stopPropagation();
            e.preventDefault();

            setShowSearchBox((showSearchBox) => !showSearchBox);
        },
        [setShowSearchBox],
    );

    const openMobileMenu = useCallback(
        ($e) => {
            if ($e?.target?.tagName != 'A') {
                $e.stopPropagation();
                $e.preventDefault();
            }

            setMobileMenuOpened((mobileMenuOpened) => !mobileMenuOpened);
        },
        [setMobileMenuOpened],
    );

    useEffect(() => {
        window.addEventListener('scroll', updateScrolled);

        if (envData.config.flags.genericSearchUseToggle) {
            setShowSearchBox(false);
        } else {
            window.addEventListener('resize', onResize);
            onResize();
        }

        return () => {
            window.removeEventListener('resize', onResize);
        };
    }, [envData, onResize, setShowSearchBox, updateScrolled]);

    const primaryMenu = (
        <ul id="primary-menu" className={`navbar-list hide-sm ${authIdentity ? 'navbar-list-auth-in' : ''}`}>
            {menuItems.map((menuItem, index) => (
                <li
                    key={menuItem.id}
                    className={`navbar-item-wrapper ${menuItem.className || ''} ${
                        index >= menuItems.length - 2 ? 'navbar-item-wrapper_first-to-last' : ''
                    }`}>
                    {['social_media_items', 'logout_item'].indexOf(menuItem.id) == -1 && !menuItem.href && (
                        <StateNavLink
                            name={menuItem.state}
                            params={menuItem.stateParams}
                            activeExact={true}
                            className="navbar-item"
                            target={menuItem.target || '_blank'}>
                            {translate(
                                menuItem.nameTranslate,
                                {},
                                menuItem.nameTranslateDefault || menuItem.nameTranslate,
                            )}
                        </StateNavLink>
                    )}

                    {['social_media_items', 'logout_item'].indexOf(menuItem.id) == -1 && menuItem.href && (
                        <a className="navbar-item" href={menuItem.href} target={menuItem.target || '_blank'}>
                            {translate(
                                menuItem.nameTranslate,
                                {},
                                menuItem.nameTranslateDefault || menuItem.nameTranslate,
                            )}
                        </a>
                    )}

                    {menuItem.id == 'social_media_items' &&
                        appConfigs.social_medias.map((social_media) => (
                            <a
                                key={social_media.type}
                                className="navbar-social-media-icon"
                                href={social_media.url}
                                title={social_media.title}
                                target="_blank"
                                rel="noreferrer">
                                <em className={`mdi mdi-${social_media.type}`} />
                            </a>
                        ))}

                    {menuItem.id == 'logout_item' && (
                        <div className="flex">
                            {envData.config.flags.genericSearchUseToggle && envData.config.flags.genericSearch && (
                                <div
                                    className={`button subnav-search-button hide-sm ${showSearchBox ? 'active' : ''}`}
                                    onClick={(e) => toggleSearchBox(e)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={clickOnKeyEnter}
                                    aria-label="Zoeken">
                                    <em className="mdi mdi-magnify" />
                                </div>
                            )}

                            {authIdentity?.email && (
                                <span className="navbar-user" data-dusk="identityEmail">
                                    {strLimit(authIdentity?.email, 27)}
                                </span>
                            )}

                            <a
                                role="button"
                                className={'state-nav-link'}
                                tabIndex={0}
                                onClick={(e) => signOut(e, true)}>
                                <span className="navbar-item">{translate('topnavbar.buttons.logout')}</span>
                                <em className="mdi mdi-logout" />
                            </a>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );

    const authMenu = authIdentity ? (
        <div
            className="auth-in hide-sm"
            onBlur={(e) => {
                if (userMenuOpened && !e.currentTarget.contains(e.relatedTarget)) {
                    menuRef?.current?.focus();
                }
            }}>
            <div
                id="user_menu"
                className="auth-user"
                data-dusk="userProfile"
                onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpened((userMenuOpened) => !userMenuOpened);
                }}
                aria-haspopup="true"
                tabIndex={0}
                aria-expanded={userMenuOpened ? 'true' : 'false'}
                onKeyDown={clickOnKeyEnter}
                role="button"
                ref={menuRef}
                aria-label="Gebruikersmenu">
                <div className="auth-user-avatar" />
                <div className="auth-user-caret">
                    <em className={`mdi ${userMenuOpened ? 'mdi-chevron-up' : 'mdi-chevron-down'}`} />
                </div>
                {userMenuOpened && (
                    <ClickOutside
                        onClickOutside={hideUserMenu}
                        className={`auth-user-menu hide-sm ${userMenuOpened ? 'active' : ''}`}
                        aria-labelledby="user_menu">
                        <div className="triangle" />
                        <div
                            className="inner"
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setUserMenuOpened(false);
                                    menuRef?.current?.focus();
                                }

                                e.stopPropagation();
                            }}>
                            {authIdentity?.email && (
                                <div className="auth-user-menu-user">
                                    <span className="text-strong-half">
                                        Ingelogd als: <br />
                                    </span>
                                    {strLimit(authIdentity?.email, 27)}
                                </div>
                            )}

                            {authIdentity?.email && <div className="auth-user-menu-separator" />}

                            <StateNavLink id="vouchers" name={'vouchers'} className="auth-user-menu-item" tabIndex={0}>
                                <em className="mdi mdi-ticket-percent-outline" />
                                Mijn tegoeden
                            </StateNavLink>
                            <div
                                id="open_pincode_popup"
                                tabIndex={0}
                                className="auth-user-menu-item"
                                onClick={(e) => openPinCodePopup(e)}
                                onKeyDown={clickOnKeyEnter}
                                role="button">
                                <em className="mdi mdi-cellphone" />
                                {translate('topnavbar.buttons.authorize')}
                            </div>
                            <StateNavLink
                                id="bookmarked_products"
                                name={'bookmarked-products'}
                                className="auth-user-menu-item"
                                tabIndex={0}>
                                <em className="mdi mdi-cards-heart-outline" />
                                Mijn verlanglijstje
                            </StateNavLink>
                            <StateNavLink
                                id="reservations"
                                name={'reservations'}
                                className="auth-user-menu-item"
                                tabIndex={0}>
                                <em className="mdi mdi-calendar-outline" />
                                Reserveringen
                            </StateNavLink>
                            {appConfigs.has_reimbursements && (
                                <StateNavLink
                                    id="reimbursements"
                                    name={'reimbursements'}
                                    className="auth-user-menu-item"
                                    tabIndex={0}>
                                    <em className="mdi mdi-receipt-outline" />
                                    Kosten terugvragen
                                </StateNavLink>
                            )}
                            <StateNavLink
                                id="fund-requests"
                                name={'fund-requests'}
                                className="auth-user-menu-item"
                                dataDusk="btnFundRequests"
                                tabIndex={0}>
                                <em className="mdi mdi-card-account-details-outline" />
                                Aanvragen
                            </StateNavLink>
                            {appConfigs.has_payouts && (
                                <StateNavLink
                                    id="payouts"
                                    name={'payouts'}
                                    className="auth-user-menu-item"
                                    tabIndex={0}>
                                    <em className="mdi mdi-wallet-plus-outline" />
                                    Uitbetalingen
                                </StateNavLink>
                            )}
                            <StateNavLink name={'notifications'} className="auth-user-menu-item" tabIndex={0}>
                                <em className="mdi mdi-bell-outline" />
                                Notificaties
                            </StateNavLink>
                            <StateNavLink
                                id="notification_preferences"
                                name="preferences-notifications"
                                className="auth-user-menu-item"
                                tabIndex={0}>
                                <em className="mdi mdi-cog-outline" />
                                {translate('notification_preferences.title_preferences')}
                            </StateNavLink>
                            {envData.config.sessions && (
                                <StateNavLink name={'security-sessions'} className="auth-user-menu-item" tabIndex={0}>
                                    <em className="mdi mdi-shield-account" />
                                    Sessies
                                </StateNavLink>
                            )}
                            <StateNavLink
                                id="identity_emails"
                                name="identity-emails"
                                className="auth-user-menu-item"
                                dataDusk="btnUserEmails"
                                tabIndex={0}>
                                <em className="mdi mdi-at" />
                                {translate('email_preferences.title_preferences')}
                            </StateNavLink>

                            {(envData.config.flags.show2FAMenu || auth2faState?.required) && (
                                <StateNavLink name="security-2fa" className="auth-user-menu-item" tabIndex={0}>
                                    <em className="mdi mdi-security" />
                                    Beveiliging
                                </StateNavLink>
                            )}

                            <div className="auth-user-menu-separator show-sm" />

                            {authIdentity && (
                                <StateNavLink name="funds" className="auth-user-menu-item show-sm" tabIndex={0}>
                                    <em className="mdi mdi-star-outline" />
                                    {translate('topnavbar.buttons.logout')}
                                </StateNavLink>
                            )}
                            {appConfigs.products.list && (
                                <StateNavLink name="products" className="auth-user-menu-item show-sm" tabIndex={0}>
                                    <em className="mdi mdi-store" />
                                    {translate('topnavbar.buttons.products')}
                                </StateNavLink>
                            )}
                            {envData.config.flags.providersMenu && (
                                <StateNavLink name="providers" className="auth-user-menu-item show-sm" tabIndex={0}>
                                    <em className="mdi mdi-store" />
                                    {translate('topnavbar.items.providers')}
                                </StateNavLink>
                            )}
                            <div className="auth-user-menu-separator show-sm" />
                            <StateNavLink name="vouchers" className="auth-user-menu-item show-sm" tabIndex={0}>
                                <em className="mdi mdi-ticket-confirmation" />
                                {translate('topnavbar.buttons.voucher')}
                            </StateNavLink>
                            <div className="auth-user-menu-separator" />
                            <div
                                id="sign_out"
                                className="auth-user-menu-item"
                                onClick={() => signOut()}
                                onKeyDown={clickOnKeyEnter}
                                role="button"
                                data-dusk="btnUserLogout"
                                tabIndex={0}>
                                <em className="mdi mdi-logout" />
                                {translate('topnavbar.buttons.logout')}
                            </div>
                        </div>
                    </ClickOutside>
                )}
            </div>
        </div>
    ) : null;

    const subNavSearchButton =
        envData.config.flags.genericSearchUseToggle && envData.config?.flags.genericSearch ? (
            <button
                className={`button subnav-search-button hide-sm ${showSearchBox ? 'active' : ''}`}
                onClick={(e) => toggleSearchBox(e)}
                aria-label="Zoekvak openen"
                aria-controls="search-box">
                <em className="mdi mdi-magnify" />
            </button>
        ) : null;

    return (
        <nav
            id="navigation-menu"
            className={`block block-navbar ${className} ${hideOnScroll && !visible ? 'scrolled' : ''}`}>
            {appConfigs.announcements && <Announcements announcements={appConfigs.announcements} />}

            {!showSearchBox && (
                <div className="navbar-inner wrapper" ref={mobileNavBarRef}>
                    <div
                        className={`button navbar-menu-button show-sm ${mobileMenuOpened ? 'active' : ''}`}
                        aria-expanded={mobileMenuOpened}
                        onClick={openMobileMenu}
                        role={'button'}
                        onKeyDown={clickOnKeyEnter}
                        tabIndex={0}>
                        <em className={`mdi ${mobileMenuOpened ? 'mdi-close' : 'mdi-menu'}`} />
                        {mobileMenuOpened
                            ? translate('topnavbar.items.menu.close')
                            : translate('topnavbar.items.menu.show')}
                    </div>

                    <StateNavLink
                        name={'home'}
                        className="navbar-logo show-sm"
                        title={`Terug naar hoofdpagina`}
                        disabled={route?.state?.name === 'home'}
                        tabIndex={0}>
                        <img
                            src={assetUrl(`/assets/img/logo-normal${logoExtension}`)}
                            alt={translate(`logo_alt_text.${envData.client_key}`, {}, envData.client_key)}
                        />
                        <img
                            className="hover"
                            src={assetUrl(`/assets/img/logo-hover${logoExtension}`)}
                            alt={translate(`logo_alt_text.${envData.client_key}`, {}, envData.client_key)}
                        />
                    </StateNavLink>

                    {envData.config?.flags?.genericSearch ? (
                        <div
                            className="button navbar-search-button show-sm"
                            onClick={(e) => toggleSearchBox(e)}
                            aria-expanded={showSearchBox}
                            aria-controls={'navbar-search'}
                            role="button"
                            onKeyDown={clickOnKeyEnter}
                            tabIndex={0}>
                            <em className="mdi mdi-magnify" />
                            {translate('topnavbar.items.search')}
                        </div>
                    ) : (
                        <div className="button navbar-search-button show-sm" aria-hidden="true" />
                    )}
                </div>
            )}

            <div
                className={`navbar-inner wrapper ${showSearchBox ? 'search-shown' : ''}`}
                id={envData.config?.flags?.genericSearchUseToggle ? 'search-box' : null}>
                {!authIdentity && !showSearchBox && !mobileMenuOpened && (
                    <div className="block block-auth show-sm">
                        {envData.config.flags.showStartButton && (
                            <button
                                className="button button-primary-outline button-start button-xs show-sm"
                                onClick={() => startFundRequest({ restore_with_email: 1 })}
                                aria-label={envData.config.flags.showStartButtonText || 'Start'}
                                role="button">
                                <em className="mdi mdi-plus-circle icon-start" />
                                {envData.config.flags.showStartButtonText || 'Start'}
                            </button>
                        )}
                        <button
                            className="button button-primary button-xs show-sm"
                            onClick={() => startFundRequest({ reset: 1 })}
                            role="button"
                            aria-label={translate('topnavbar.buttons.login')}
                            id="login_mobile">
                            <em className="mdi mdi-account icon-start" />
                            {translate(`topnavbar.buttons.${envData.client_key}.login`, {}, 'topnavbar.buttons.login')}
                        </button>
                    </div>
                )}

                {!envData.config.flags.genericSearchUseToggle ? (
                    primaryMenu
                ) : (
                    <Fragment>{envData.config.flags.genericSearch && showSearchBox && <TopNavbarSearch />}</Fragment>
                )}
            </div>

            {(showSearchBox || envData.config.flags.genericSearchUseToggle) && (
                <div id="navbar-search" className={`block block-subnav ${showSearchBox ? 'search-shown' : ''}`}>
                    <div className="subnav-inner wrapper">
                        <StateNavLink
                            name={'home'}
                            className="navbar-logo hide-sm"
                            disabled={route?.state?.name === 'home'}>
                            <img
                                src={assetUrl(`/assets/img/logo-normal${logoExtension}`)}
                                alt={translate(`logo_alt_text.${envData.client_key}`, {}, envData.client_key)}
                                title={`Naar de homepage van ${window.location.host}`}
                            />
                        </StateNavLink>

                        {!envData.config.flags.genericSearchUseToggle ? (
                            <Fragment>
                                {envData.config.flags.genericSearch && showSearchBox && <TopNavbarSearch />}
                            </Fragment>
                        ) : (
                            <Fragment>
                                {primaryMenu}
                                {authMenu}
                            </Fragment>
                        )}

                        {(!envData.config.flags.genericSearchUseToggle || !authIdentity) && (
                            <div className="block flex hide-sm">
                                {subNavSearchButton}

                                <div className="block block-auth">
                                    {!authIdentity && envData.config.flags.showStartButton && (
                                        <button
                                            className="button button-primary-outline"
                                            onClick={() => startFundRequest({ restore_with_email: 1 })}
                                            aria-label={envData.config.flags.showStartButtonText || 'Start'}
                                            role="button">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width={25}
                                                height={23}
                                                fill="none"
                                                viewBox="0 0 25 23">
                                                <path
                                                    fill="#fff"
                                                    fillRule="evenodd"
                                                    d="M18.2133 1.30493C16.4951 0.512543 14.7769 0.0371094 12.8868 0.0371094H12.5432C10.6532 0.0371094 8.93494 0.512543 7.21673 1.30493C5.49851 2.09732 3.95211 3.20667 2.92118 4.79145C1.54661 6.53471 0.6875 8.7534 0.6875 10.9721V11.289C0.6875 12.2399 0.859322 13.3493 1.20297 14.1416C2.06207 16.8358 3.78029 19.0545 6.35762 20.4808C8.07584 21.5901 10.3095 22.224 12.5432 22.224H12.8868C19.4161 22.0655 24.5707 17.3112 24.7425 11.289V10.9721C24.7425 9.54579 24.3989 8.27796 23.8834 7.16862L23.6909 6.72615C22.6082 4.39333 20.639 2.49818 18.2133 1.30493ZM11.6841 5.58391C11.8559 5.10848 12.3714 4.95 12.8869 4.79152C13.4023 4.79152 13.9178 5.26695 13.9178 5.90087V10.1798L18.5061 10.181C18.6876 10.1861 18.935 10.2115 19.0725 10.3382C19.4161 10.6552 19.5879 10.9722 19.4161 11.4476C19.4161 11.674 19.2408 11.8195 19.0154 11.942L18.7288 12.0815H13.9178V16.2019C13.9178 16.6774 13.746 16.9943 13.4023 17.1528C12.8869 17.4698 12.3714 17.3113 12.0278 16.9943C11.9817 16.9094 11.9357 16.8358 11.893 16.7676C11.7762 16.5811 11.6841 16.434 11.6841 16.2019V12.0815H7.21676C6.87311 12.0815 6.52947 12.0815 6.35765 11.923C6.014 11.6061 5.84218 11.1306 6.014 10.6552C6.18583 10.3382 6.70129 10.1798 7.04494 10.1798H11.5123V6.21782C11.5123 6.03215 11.5713 5.90086 11.6201 5.7921C11.6546 5.7152 11.6841 5.64955 11.6841 5.58391Z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span>{envData.config.flags.showStartButtonText || 'Start'}</span>
                                        </button>
                                    )}

                                    {authIdentity ? (
                                        <StateNavLink
                                            name={'vouchers'}
                                            className="button button-primary"
                                            id="vouchers"
                                            dataDusk="userVouchers">
                                            <em className="mdi mdi-ticket-confirmation" />
                                            {translate(
                                                `topnavbar.buttons.${envData.client_key}.voucher`,
                                                {},
                                                'topnavbar.buttons.voucher',
                                            )}
                                        </StateNavLink>
                                    ) : (
                                        <button
                                            className="button button-primary"
                                            onClick={() => startFundRequest({ reset: 1 })}
                                            role="button"
                                            aria-label={translate(
                                                `home.header.${envData.client_key}.button`,
                                                {},
                                                'home.header.button',
                                            )}
                                            id="start_modal"
                                            data-dusk="btnStart">
                                            <em className="mdi mdi-account icon-start" />
                                            {translate(
                                                `home.header.${envData.client_key}.button`,
                                                {},
                                                'home.header.button',
                                            )}
                                        </button>
                                    )}

                                    {authMenu}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <LayoutMobileMenu />
        </nav>
    );
};
