import React, { Fragment, useEffect, useState } from 'react';
import IconCookies from '../../../../assets/forus-webshop/resources/_webshop-common/assets/img/icon-search/cookies.svg';
import classNames from 'classnames';
import CookieBannerToggle from './CookieBannerToggle';
import StateNavLink from '../state_router/StateNavLink';

export default function CookieBanner({
    setAllowOptionalCookies,
}: {
    setAllowOptionalCookies: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const [showConfigs, setShowConfigs] = useState(false);

    const [functionalAccepted, setFunctionalAccepted] = useState(true);
    const [optionalAccepted, setOptionalAccepted] = useState(true);

    const [cookiesAccepted, setCookiesAccepted] = useState(localStorage.getItem('cookiesAccepted'));

    const onAcceptAll = () => {
        localStorage.setItem('cookiesAccepted', 'all');
        setCookiesAccepted('all');
    };

    const onDisableOptional = () => {
        localStorage.setItem('cookiesAccepted', 'functional');
        setCookiesAccepted('functional');
    };

    useEffect(() => {
        setAllowOptionalCookies(cookiesAccepted === 'all');
    }, [cookiesAccepted, setAllowOptionalCookies]);

    if (cookiesAccepted) {
        return null;
    }

    return (
        <div className={classNames('block', 'block-cookie-banner', showConfigs && 'block-cookie-banner-config')}>
            {!showConfigs ? (
                <Fragment>
                    <div className="cookie-banner-icon">
                        <IconCookies />
                    </div>
                    <div className="cookie-banner-title">Deze website gebruikt cookies</div>
                    <div className="cookie-banner-description">
                        Deze website maakt gebruik van cookies om de algehele gebruikerservaring te verbeteren. Door op
                        {'"Accepteren en doorgaan"'} te klikken, wordt ingestemd met het gebruik van cookies zoals
                        omschreven in de Privacyverklaring.
                        <br />
                        <br />
                        Bekijk de{' '}
                        <StateNavLink name="privacy" target={'_blank'} className={'cookie-banner-description-link'}>
                            <strong>Privacyverklaring</strong>
                        </StateNavLink>
                        .
                    </div>
                    <div className="cookie-banner-actions">
                        <button className="button button-primary button-sm cookie-banner-button" onClick={onAcceptAll}>
                            Accepteren en doorgaan
                        </button>
                        <button
                            className="button button-light button-sm cookie-banner-button"
                            onClick={onDisableOptional}>
                            Alleen nodig voor de website
                        </button>
                    </div>
                    <div role={'button'} onClick={() => setShowConfigs(true)} className="cookie-banner-config">
                        Beheer cookies
                        <em className="mdi mdi-open-in-new" />
                    </div>
                </Fragment>
            ) : (
                <div className={'cookie-configs form'}>
                    <div className="cookie-configs-header">
                        <div className="cookie-configs-wrapper">
                            <div className="cookie-configs-header-title">
                                Cookie-instellingen
                                <div
                                    className="mdi mdi-close cookie-configs-header-close"
                                    onClick={() => setShowConfigs(!showConfigs)}
                                />
                            </div>
                            <div className="cookie-configs-header-description">
                                Deze website gebruikt cookies om de website zo goed mogelijk te laten functioneren, de
                                gebruikservaring te verbeteren en om geanonimiseerde statistieken te verzamelen.
                            </div>
                        </div>
                    </div>
                    <div className="cookie-configs-body">
                        <div className="cookie-configs-wrapper">
                            <div className="cookie-configs-body-title">
                                Deze website gebruikt alleen local storage en analytische cookies:
                            </div>

                            <div className="cookie-configs-toggles">
                                <CookieBannerToggle
                                    disabled={true}
                                    accepted={functionalAccepted}
                                    setAccepted={setFunctionalAccepted}
                                    title={'Local storage'}
                                    description={
                                        <Fragment>
                                            Local storage wordt gebruikt om ervoor te zorgen dat de website goed
                                            functioneert en dat gebruikers ingelogd blijven.
                                        </Fragment>
                                    }
                                />
                                <div className="cookie-configs-toggle-separator" />
                                <CookieBannerToggle
                                    disabled={false}
                                    accepted={optionalAccepted}
                                    setAccepted={setOptionalAccepted}
                                    title={'Analytische cookies'}
                                    description={
                                        <Fragment>
                                            Deze website gebruikt analytische cookies om geanonimiseerde statistieken te
                                            verzamelen over hoe bezoekers onze website gebruiken. Deze informatie helpt
                                            ons om de website te verbeteren en gebruiksvriendelijker te maken.
                                        </Fragment>
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <div className="cookie-configs-footer">
                        <div className="cookie-configs-wrapper">
                            {functionalAccepted && (
                                <button
                                    className="button button-primary button-sm cookie-banner-button"
                                    onClick={onAcceptAll}>
                                    Accepteren en doorgaan
                                </button>
                            )}

                            <button
                                className="button button-light button-sm cookie-banner-button"
                                onClick={onDisableOptional}>
                                Alleen nodig voor de website
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
