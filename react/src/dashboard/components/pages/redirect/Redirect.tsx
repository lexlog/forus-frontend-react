import React from 'react';
import { useSearchParams } from 'react-router-dom';
import useAssetUrl from '../../../hooks/useAssetUrl';
import StateNavLink from '../../../modules/state_router/StateNavLink';

// todo: investigate
export default function Redirect() {
    const [params] = useSearchParams();
    const assetUrl = useAssetUrl();

    if (params.get('target')) {
        return <></>;
    }

    if (params.get('email_confirmed')) {
        return (
            <>
                <div className="block block-email-confirmed">
                    <div className="block-email-confirmed-content">
                        <div className="block-email-confirmed-icon">
                            <img src={assetUrl('/assets/img/confirm-success.svg')} alt="" />
                        </div>
                        <div className="block-email-confirmed-title">Gelukt!</div>
                        <div className="block-email-confirmed-subtitle">Uw e-mailadres is bevestigd</div>
                    </div>

                    <div className="block-email-confirmed-footer">
                        <StateNavLink
                            name={'organizations'}
                            dataDusk="identityEmailConfirmedButton"
                            className="button button-primary button-lg">
                            Bekijken
                        </StateNavLink>
                    </div>
                </div>
            </>
        );
    }

    return <></>;
}
