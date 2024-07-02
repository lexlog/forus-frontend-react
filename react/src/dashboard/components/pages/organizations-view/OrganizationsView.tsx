import React, { useContext, useEffect } from 'react';
import { useOrganizationService } from '../../../services/OrganizationService';
import { useParams } from 'react-router-dom';
import { useNavigateState } from '../../../modules/state_router/Router';
import { mainContext } from '../../../contexts/MainContext';

export default function OrganizationsView() {
    const { id } = useParams();
    const { fetchOrganizations, setOrganizations, setActiveOrganization } = useContext(mainContext);
    const organizationService = useOrganizationService();
    const navigateState = useNavigateState();

    useEffect(() => {
        fetchOrganizations().then((organizations) => {
            const organization = organizations.find((organization) => organization.id == parseInt(id));

            if (organization) {
                organizationService.use(organization?.id);
                setActiveOrganization(organization);
            }

            setOrganizations(organizations);
            navigateState('organizations');
        });
    }, [fetchOrganizations, navigateState, organizationService, setActiveOrganization, setOrganizations, id]);

    return <></>;
}
