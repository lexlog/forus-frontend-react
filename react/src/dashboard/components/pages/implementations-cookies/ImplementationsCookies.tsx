import React, { Fragment, useCallback, useEffect, useState } from 'react';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import LoadingCard from '../../elements/loading-card/LoadingCard';
import usePushDanger from '../../../hooks/usePushDanger';
import StateNavLink from '../../../modules/state_router/StateNavLink';
import { ResponseError } from '../../../props/ApiResponses';
import useImplementationService from '../../../services/ImplementationService';
import { useParams } from 'react-router-dom';
import Implementation from '../../../props/models/Implementation';
import { getStateRouteUrl, useNavigateState } from '../../../modules/state_router/Router';

export default function ImplementationsCookies() {
    const { id } = useParams();

    const pushDanger = usePushDanger();
    const navigateState = useNavigateState();
    const activeOrganization = useActiveOrganization();

    const implementationService = useImplementationService();

    const [implementation, setImplementation] = useState<Implementation>(null);

    const fetchImplementation = useCallback(() => {
        implementationService
            .read(activeOrganization.id, parseInt(id))
            .then((res) => setImplementation(res.data.data))
            .catch((res: ResponseError) => {
                if (res.status === 403) {
                    return navigateState(
                        getStateRouteUrl('implementations', { organizationId: activeOrganization.id }),
                    );
                }

                pushDanger('Mislukt!', res.data.message);
            });
    }, [activeOrganization.id, id, implementationService, navigateState, pushDanger]);

    useEffect(() => {
        fetchImplementation();
    }, [fetchImplementation]);

    if (!implementation) {
        return <LoadingCard />;
    }

    return (
        <Fragment>
            <div className="block block-breadcrumbs">
                <StateNavLink
                    name={'implementations'}
                    params={{ organizationId: activeOrganization.id }}
                    activeExact={true}
                    className="breadcrumb-item">
                    Webshops
                </StateNavLink>
                <StateNavLink
                    name={'implementations-view'}
                    params={{ organizationId: activeOrganization.id, id: implementation.id }}
                    activeExact={true}
                    className="breadcrumb-item">
                    {implementation.name}
                </StateNavLink>
                <div className="breadcrumb-item active">Cookiemelding</div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="card-title flex flex-horizontal flex-align-items-center">
                        <div className="flex flex-grow">Cookiemelding</div>
                        <div className="flex">
                            <div className="label label-success">Actief</div>
                        </div>
                    </div>
                </div>

                <div className="card-section">
                    <div className="card-block card-block-keyvalue">
                        <div className="keyvalue-item">
                            <div className="keyvalue-key">Local storage</div>
                            <div className="keyvalue-value">
                                <div className={`block block-info-box block-info-box-primary`}>
                                    <div className="info-box-icon mdi mdi-information" />
                                    <div className="info-box-content">
                                        Deze website gebruikt local storage om ervoor te zorgen dat de website goed
                                        functioneert en dat gebruikers ingelogd blijven. Aangezien local storage
                                        essentieel is voor de werking van de website, staat deze standaard ingeschakeld.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-section">
                    <div className="card-block card-block-keyvalue">
                        <div className="keyvalue-item">
                            <div className="keyvalue-key">Analytische cookies</div>
                            <div className="keyvalue-value">
                                <div className={`block block-info-box block-info-box-primary`}>
                                    <div className="info-box-icon mdi mdi-information" />
                                    <div className="info-box-content">
                                        Wanneer een website tools inzet om statistieken te verzamelen, is het
                                        noodzakelijk om toestemming te vragen voor het gebruik van analytische cookies.
                                        Het gebruik van deze cookies is optioneel voor de gebruikers.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-footer">
                    <div className="button-group flex-center">
                        <StateNavLink
                            name={'implementations-view'}
                            params={{ id: implementation.id, organizationId: activeOrganization.id }}
                            className="button button-default">
                            Ga terug
                        </StateNavLink>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
