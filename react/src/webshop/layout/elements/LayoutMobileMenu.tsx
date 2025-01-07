import React, { Fragment, useCallback, useContext, useEffect, useRef, useState } from 'react';
import useAppConfigs from '../../hooks/useAppConfigs';
import { mainContext } from '../../contexts/MainContext';
import StateNavLink from '../../modules/state_router/StateNavLink';
import useTranslate from '../../../dashboard/hooks/useTranslate';
import useEnvData from '../../hooks/useEnvData';
import { useFundService } from '../../services/FundService';
import Fund from '../../../dashboard/props/models/Fund';
import useAuthIdentity from '../../hooks/useAuthIdentity';
import { useVoucherService } from '../../services/VoucherService';
import Voucher from '../../../dashboard/props/models/Voucher';
import { useNavigateState, useStateRoutes } from '../../modules/state_router/Router';
import { authContext } from '../../contexts/AuthContext';
import useOpenModal from '../../../dashboard/hooks/useOpenModal';
import useTopMenuItems from '../../components/elements/top-navbar/helpers/useTopMenuItems';
import useAuthIdentity2FAState from '../../hooks/useAuthIdentity2FAState';
import ModalAuthPincode from '../../components/modals/ModalAuthPincode';
import { clickOnKeyEnter } from '../../../dashboard/helpers/wcag';
import useSelectControlKeyEventHandlers from '../../../dashboard/components/elements/select-control/hooks/useSelectControlKeyEventHandlers';

export default function LayoutMobileMenu() {
    const translate = useTranslate();

    const { signOut } = useContext(authContext);
    const menuItems = useTopMenuItems();
    const { route } = useStateRoutes();

    const envData = useEnvData();
    const appConfigs = useAppConfigs();
    const navigateState = useNavigateState();
    const openModal = useOpenModal();

    const authIdentity = useAuthIdentity();
    const authIdentity2FAState = useAuthIdentity2FAState();

    const fundService = useFundService();
    const voucherService = useVoucherService();

    const [funds, setFunds] = useState<Array<Fund>>([]);
    const [vouchers, setVouchers] = useState<Array<Voucher>>([]);

    const { mobileMenuOpened, setMobileMenuOpened } = useContext(mainContext);

    const selectorRef = useRef<HTMLDivElement>(null);
    const placeholderRef = useRef<HTMLLabelElement>(null);

    const { onKeyDown, onBlur } = useSelectControlKeyEventHandlers(
        selectorRef,
        placeholderRef,
        mobileMenuOpened,
        setMobileMenuOpened,
    );

    const hideMobileMenu = useCallback(() => {
        setMobileMenuOpened(false);
    }, [setMobileMenuOpened]);

    const fetchFunds = useCallback(() => {
        fundService.list({ check_criteria: 1 }).then((res) => setFunds(res.data.data));
    }, [fundService]);

    const startFundRequest = useCallback(
        (data: object) => {
            hideMobileMenu();

            if (funds.length > 0) {
                navigateState('start', {}, data);
            }
        },
        [funds.length, hideMobileMenu, navigateState],
    );

    const onSignOut = useCallback(() => {
        signOut();
        hideMobileMenu();
    }, [hideMobileMenu, signOut]);

    const openPinCodePopup = useCallback(() => {
        openModal((modal) => <ModalAuthPincode modal={modal} />);
    }, [openModal]);

    useEffect(() => {
        if (!authIdentity) {
            return;
        }

        fetchFunds();
        voucherService.list().then((res) => setVouchers(res.data.data));
    }, [authIdentity, fetchFunds, voucherService]);

    useEffect(() => {
        fetchFunds();
    }, [fetchFunds]);

    if (!mobileMenuOpened) {
        return null;
    }

    return (
        <div className="block block-mobile-menu show-sm" ref={selectorRef} onKeyDown={onKeyDown} onBlur={onBlur}>
            <div className="mobile-menu-group mobile-menu-group-main">
                <div className="mobile-menu-group-header">Hoofdmenu</div>
                <div className="mobile-menu-items">
                    {menuItems.map((menuItem) => (
                        <Fragment key={menuItem.id}>
                            {['social_media_items', 'logout_item'].indexOf(menuItem.id) == -1 && !menuItem.href && (
                                <StateNavLink
                                    className="mobile-menu-item"
                                    name={menuItem.state}
                                    params={menuItem.stateParams}
                                    target={menuItem.target || '_blank'}
                                    activeExact={true}
                                    onKeyDown={clickOnKeyEnter}
                                    tabIndex={0}
                                    onClick={hideMobileMenu}>
                                    <em className="mobile-menu-item-icon mdi mdi-arrow-right" aria-hidden="true" />
                                    {translate(
                                        menuItem.nameTranslate,
                                        {},
                                        menuItem.nameTranslateDefault || menuItem.nameTranslate,
                                    )}
                                </StateNavLink>
                            )}

                            {['social_media_items', 'logout_item'].indexOf(menuItem.id) == -1 && menuItem.href && (
                                <a
                                    className="mobile-menu-item"
                                    href={menuItem.href}
                                    target={menuItem.target || '_blank'}
                                    onKeyDown={clickOnKeyEnter}
                                    tabIndex={0}
                                    onClick={hideMobileMenu}>
                                    <em className="mobile-menu-item-icon mdi mdi-arrow-right" aria-hidden="true" />
                                    {translate(
                                        menuItem.nameTranslate,
                                        {},
                                        menuItem.nameTranslateDefault || menuItem.nameTranslate,
                                    )}
                                </a>
                            )}
                        </Fragment>
                    ))}
                </div>
            </div>
            <div className="mobile-menu-group">
                <div className="mobile-menu-group-header">Persoonlijk</div>
                <div className="mobile-menu-items">
                    {authIdentity && vouchers?.length > 0 && (
                        <StateNavLink
                            className="mobile-menu-item"
                            name="vouchers"
                            onClick={hideMobileMenu}
                            aria-current={route.state?.name == 'vouchers' ? 'true' : undefined}
                            onKeyDown={clickOnKeyEnter}
                            tabIndex={0}
                            role="link">
                            <em className="mobile-menu-item-icon mdi mdi-ticket-percent-outline" />
                            {translate(
                                `topnavbar.buttons.mobile.dropdown.${envData.client_key}.vouchers`,
                                {},
                                'topnavbar.buttons.mobile.dropdown.vouchers',
                            )}
                        </StateNavLink>
                    )}

                    {authIdentity && (
                        <div
                            className="mobile-menu-item"
                            onClick={() => {
                                hideMobileMenu();
                                openPinCodePopup();
                            }}
                            onKeyDown={clickOnKeyEnter}
                            tabIndex={0}
                            role="button">
                            <em className="mobile-menu-item-icon mdi mdi-cellphone" />
                            {translate(
                                `topnavbar.buttons.mobile.dropdown.${envData.client_key}.authorize`,
                                {},
                                'topnavbar.buttons.mobile.dropdown.authorize',
                            )}
                        </div>
                    )}

                    {authIdentity && (
                        <StateNavLink
                            className="mobile-menu-item"
                            name="bookmarked-products"
                            onClick={hideMobileMenu}
                            aria-current={route.state?.name == 'bookmarked-products' ? 'true' : undefined}
                            onKeyDown={clickOnKeyEnter}
                            tabIndex={0}
                            role="link">
                            <em className="mobile-menu-item-icon mdi mdi-cards-heart-outline" />
                            {translate(
                                `topnavbar.buttons.mobile.dropdown.${envData.client_key}.bookmarked_products`,
                                {},
                                'topnavbar.buttons.mobile.dropdown.bookmarked_products',
                            )}
                        </StateNavLink>
                    )}

                    {authIdentity && (
                        <StateNavLink
                            className="mobile-menu-item"
                            name="reservations"
                            onClick={hideMobileMenu}
                            aria-current={route.state?.name == 'reservations' ? 'true' : undefined}
                            onKeyDown={clickOnKeyEnter}
                            tabIndex={0}
                            role="link">
                            <em className="mobile-menu-item-icon mdi mdi-calendar-outline" />
                            {translate('topnavbar.buttons.mobile.dropdown.reservations')}
                        </StateNavLink>
                    )}

                    {authIdentity && appConfigs.has_reimbursements && (
                        <StateNavLink
                            className="mobile-menu-item"
                            name="reimbursements"
                            onClick={hideMobileMenu}
                            aria-current={route.state?.name == 'reimbursements' ? 'true' : undefined}
                            onKeyDown={clickOnKeyEnter}
                            tabIndex={0}
                            role="link">
                            <em className="mobile-menu-item-icon mdi mdi-receipt-outline" />
                            {translate('topnavbar.buttons.mobile.dropdown.reimbursements')}
                        </StateNavLink>
                    )}

                    {authIdentity && (
                        <StateNavLink
                            className="mobile-menu-item"
                            name="fund-requests"
                            onClick={hideMobileMenu}
                            aria-current={route.state?.name == 'fund-requests' ? 'true' : undefined}
                            onKeyDown={clickOnKeyEnter}
                            tabIndex={0}
                            role="link">
                            <em className="mobile-menu-item-icon mdi mdi-card-account-details-outline" />
                            {translate('topnavbar.buttons.mobile.dropdown.fund_requests')}
                        </StateNavLink>
                    )}

                    {authIdentity && appConfigs.has_payouts && (
                        <StateNavLink
                            className="mobile-menu-item"
                            name="payouts"
                            onClick={hideMobileMenu}
                            aria-current={route.state?.name == 'payouts' ? 'true' : undefined}
                            onKeyDown={clickOnKeyEnter}
                            tabIndex={0}
                            role="link">
                            <em className="mobile-menu-item-icon mdi mdi-wallet-plus-outline" />
                            {translate('topnavbar.buttons.mobile.dropdown.payouts')}
                        </StateNavLink>
                    )}

                    {authIdentity && (
                        <StateNavLink
                            className="mobile-menu-item"
                            name="notifications"
                            onClick={hideMobileMenu}
                            aria-current={route.state?.name == 'notifications' ? 'true' : undefined}
                            onKeyDown={clickOnKeyEnter}
                            tabIndex={0}
                            role="link">
                            <em className="mobile-menu-item-icon mdi mdi-bell-ring-outline" />
                            {translate('topnavbar.buttons.mobile.dropdown.notifications')}
                        </StateNavLink>
                    )}

                    {authIdentity && (
                        <StateNavLink
                            className="mobile-menu-item"
                            name="preferences-notifications"
                            onClick={hideMobileMenu}
                            aria-current={route.state?.name == 'preferences-notifications' ? 'true' : undefined}
                            onKeyDown={clickOnKeyEnter}
                            tabIndex={0}
                            role="link">
                            <em className="mobile-menu-item-icon mdi mdi-cog-outline" />
                            {translate('topnavbar.buttons.mobile.dropdown.preferences_notifications')}
                        </StateNavLink>
                    )}

                    {authIdentity && envData.config.sessions && (
                        <StateNavLink
                            className="mobile-menu-item"
                            name="security-sessions"
                            onClick={hideMobileMenu}
                            aria-current={route.state?.name == 'security-sessions' ? 'true' : undefined}
                            onKeyDown={clickOnKeyEnter}
                            tabIndex={0}
                            role="link">
                            <em className="mobile-menu-item-icon mdi mdi-shield-account-outline" />
                            {translate('topnavbar.buttons.mobile.dropdown.sessions')}
                        </StateNavLink>
                    )}

                    {authIdentity && (
                        <StateNavLink
                            className="mobile-menu-item"
                            name="identity-emails"
                            onClick={hideMobileMenu}
                            aria-current={route.state?.name == 'identity-emails' ? 'true' : undefined}
                            onKeyDown={clickOnKeyEnter}
                            tabIndex={0}
                            role="link">
                            <em className="mobile-menu-item-icon mdi mdi-email-outline" />
                            {translate('topnavbar.buttons.mobile.dropdown.preferences_emails')}
                        </StateNavLink>
                    )}

                    {authIdentity && (envData.config.flags.show2FAMenu || authIdentity2FAState?.required) && (
                        <StateNavLink
                            className="mobile-menu-item"
                            name="security-2fa"
                            onClick={hideMobileMenu}
                            aria-current={route.state?.name == 'security-2fa' ? 'true' : undefined}
                            onKeyDown={clickOnKeyEnter}
                            tabIndex={0}
                            role="link">
                            <em className="mobile-menu-item-icon mdi mdi-security" />
                            {translate('topnavbar.buttons.mobile.dropdown.security')}
                        </StateNavLink>
                    )}

                    {authIdentity && appConfigs.records.list && (
                        <StateNavLink
                            className="mobile-menu-item"
                            name="records"
                            onClick={hideMobileMenu}
                            aria-current={route.state?.name == 'records' ? 'true' : undefined}
                            onKeyDown={clickOnKeyEnter}
                            tabIndex={0}
                            role="link">
                            <em className="mobile-menu-item-icon mdi mdi-format-list-bulleted" />
                            {translate('topnavbar.buttons.mobile.dropdown.records')}
                        </StateNavLink>
                    )}

                    {authIdentity && (
                        <a
                            role="button"
                            tabIndex={0}
                            className="mobile-menu-item"
                            onClick={onSignOut}
                            onKeyDown={clickOnKeyEnter}
                            aria-label={translate('topnavbar.buttons.logout')}>
                            <em className="mobile-menu-item-icon mdi mdi-logout" />
                            {translate('topnavbar.buttons.logout')}
                        </a>
                    )}

                    {!authIdentity && (
                        <a className="mobile-menu-item">
                            {envData.config.flags.showStartButton && (
                                <button
                                    className="button button-primary-outline button-start button-sm"
                                    role="button"
                                    aria-label={envData.config.flags.showStartButtonText || 'Start'}
                                    onKeyDown={clickOnKeyEnter}
                                    onClick={() => startFundRequest({ restore_with_email: 1 })}>
                                    <em className="mdi mdi-plus-circle icon-start" />
                                    {envData.config.flags.showStartButtonText || 'Start'}
                                </button>
                            )}

                            <button
                                className="button button-primary button-sm"
                                role="button"
                                onClick={() => startFundRequest({ reset: 1 })}
                                onKeyDown={clickOnKeyEnter}
                                aria-label={translate('topnavbar.buttons.login')}
                                id="login_mobile">
                                <em className="mdi mdi-account icon-start" />
                                {translate('topnavbar.buttons.login')}
                            </button>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
