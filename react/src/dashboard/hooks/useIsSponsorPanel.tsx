import useEnvData from './useEnvData';

export default function useIsSponsorPanel() {
    return useEnvData().client_type == 'sponsor';
}
