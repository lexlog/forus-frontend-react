import React, { useCallback, useEffect, useState } from 'react';
import { createContext } from 'react';
import Organization from '../props/models/Organization';
import EnvDataProp from '../../props/EnvData';
import { AppConfigProp, useConfigService } from '../services/ConfigService';
import { useOrganizationService } from '../services/OrganizationService';
import useAuthIdentity from '../hooks/useAuthIdentity';
import { useNavigateState } from '../modules/state_router/Router';

interface AuthMemoProps {
    envData?: EnvDataProp;
    setEnvData: (envData: EnvDataProp) => void;
    appConfigs?: AppConfigProp;
    setAppConfigs?: (appConfigs: AppConfigProp) => void;
    activeOrganization?: Organization;
    setActiveOrganization: React.Dispatch<React.SetStateAction<Organization>>;
    organizations?: Array<Organization>;
    setOrganizations: React.Dispatch<React.SetStateAction<Array<Organization>>>;
    clearAll: () => void;
    fetchOrganizations: () => Promise<Array<Organization> | null>;
    setOrganizationData: (id: number, data: Partial<Organization>) => void;
}

const mainContext = createContext<AuthMemoProps>(null);
const { Provider } = mainContext;

const MainProvider = ({ children }: { children: React.ReactElement }) => {
    const [envData, setEnvData] = useState<EnvDataProp>(null);
    const [appConfigs, setAppConfigs] = useState(null);
    const authIdentity = useAuthIdentity();
    const navigateState = useNavigateState();

    const [organizations, setOrganizations] = useState<Array<Organization>>(null);
    const [activeOrganization, setActiveOrganization] = useState<Organization>(null);

    const configService = useConfigService();
    const organizationService = useOrganizationService();

    const clearAll = useCallback(() => {
        setOrganizations([]);
        setActiveOrganization(null);
    }, []);

    const fetchOrganizations = useCallback(async () => {
        if (envData && authIdentity) {
            return organizationService
                .list({
                    dependency: 'permissions,logo',
                    order_by: `is_${envData.client_type}`,
                    order_dir: 'desc',
                    per_page: 500,
                })
                .then((res) => {
                    setOrganizations(res.data.data);
                    return res.data.data;
                });
        }

        setOrganizations(null);
        return null;
    }, [authIdentity, envData, organizationService]);

    const setOrganizationData = useCallback((id: number, data: Partial<Organization>) => {
        setOrganizations((organizations) => {
            const organization = organizations.find((item) => item.id === id);

            if (organization) {
                Object.assign(organization, data);
            }

            return [...organizations];
        });
    }, []);

    useEffect(() => {
        if (!envData?.type) {
            return;
        }

        configService.get(envData.type).then((res) => {
            setAppConfigs(res.data);
        });
    }, [configService, envData?.type]);

    useEffect(() => {
        if (organizations) {
            const organization = organizations.find(
                (organization: Organization) => organization.id == organizationService.active(),
            );

            setActiveOrganization(organization);

            if (organizations.length > 0 && !organization) {
                return navigateState('organizations');
            }
        }
    }, [organizationService, organizations, navigateState]);

    useEffect(() => {
        fetchOrganizations().then();
    }, [fetchOrganizations]);

    return (
        <Provider
            value={{
                clearAll,
                envData,
                setEnvData,
                appConfigs,
                setAppConfigs,
                activeOrganization,
                setActiveOrganization,
                organizations,
                setOrganizations,
                fetchOrganizations,
                setOrganizationData,
            }}>
            {children}
        </Provider>
    );
};

export { MainProvider, mainContext };
