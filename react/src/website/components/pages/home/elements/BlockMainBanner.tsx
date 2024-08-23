import React from 'react';
import StateNavLink from '../../../../modules/state_router/StateNavLink';

export default function BlockMainBanner() {
    return (
        <div className="block block-main-banner">
            <div className="banner-content">
                <div className="banner-info">
                    <div className="banner-title">Het platform voor sociale regelingen</div>
                    <div className="banner-description">
                        Forus biedt een flexibel, modulair platform dat het gehele uitgifteproces van sociale regelingen
                        faciliteert. Ons doel is om de toegang tot hulp laagdrempeliger te maken en zelfredzaamheid te
                        bevorderen.
                    </div>
                </div>
                <div className="banner-actions">
                    <StateNavLink name={'book-demo'} className="button button-primary">
                        Gratis demo
                    </StateNavLink>
                    <div className="button button-dark">Ontdek de functies van ons platform</div>
                </div>
            </div>
        </div>
    );
}
