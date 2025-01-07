import { useContext } from 'react';
import { loadingBarContext } from '../modules/loading_bar/context/LoadingBarContext';

export default function useProgress() {
    return useContext(loadingBarContext).progress;
}
