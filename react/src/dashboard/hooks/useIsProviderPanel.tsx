import useEnvData from './useEnvData';

export default function useIsProviderPanel() {
    return useEnvData().client_type == 'provider';
}
