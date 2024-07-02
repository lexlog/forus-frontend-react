import { useContext, useEffect, useMemo } from 'react';
import { mainContext } from '../contexts/MainContext';
import { useParams } from 'react-router-dom';
import { useOrganizationService } from '../services/OrganizationService';

export default function useActiveOrganization() {
    const { organizationId } = useParams();
    const organizationService = useOrganizationService();

    const { organizations, activeOrganization, setActiveOrganization } = useContext(mainContext);

    const paramOrganization = useMemo(() => {
        return organizations?.find((organization) => organization.id == parseInt(organizationId));
    }, [organizationId, organizations]);

    const organization = useMemo(() => {
        if (paramOrganization && activeOrganization?.id !== paramOrganization.id) {
            return paramOrganization;
        }

        return activeOrganization;
    }, [activeOrganization, paramOrganization]);

    useEffect(() => {
        if (organization && organization?.id != activeOrganization?.id) {
            organizationService.use(organization.id);
            setActiveOrganization(organization);
        }
    }, [organizationService, organization, setActiveOrganization, activeOrganization?.id]);

    return organization;
}
