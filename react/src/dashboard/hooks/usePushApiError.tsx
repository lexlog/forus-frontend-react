import usePushDanger from './usePushDanger';
import { useCallback } from 'react';
import { ResponseError } from '../props/ApiResponses';
import { useNavigateState } from '../modules/state_router/Router';
import useActiveOrganization from './useActiveOrganization';

export default function usePushApiError(redirectStateName?: string) {
    const pushDanger = usePushDanger();
    const navigateSate = useNavigateState();
    const activeOrganization = useActiveOrganization();

    return useCallback(
        (err: ResponseError) => {
            pushDanger('Mislukt!', err.data.message);

            if (redirectStateName) {
                return navigateSate(redirectStateName, { organizationId: activeOrganization?.id });
            }
        },
        [activeOrganization?.id, navigateSate, pushDanger, redirectStateName],
    );
}
