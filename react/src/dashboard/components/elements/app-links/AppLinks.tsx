import React from 'react';
import useEnvData from '../../../hooks/useEnvData';
import useAssetUrl from '../../../hooks/useAssetUrl';

export default function AppLinks({
    type = null,
    iosId = 'ios_button',
    androidId = 'android_button',
    showIosButton = true,
    showAndroidButton = true,
}: {
    type?: string;
    iosId?: string;
    androidId?: string;
    showIosButton?: boolean;
    showAndroidButton?: boolean;
}) {
    const envData = useEnvData();
    const assetUrl = useAssetUrl();

    return (
        <div className={`block block-app_links ${type ? `block-app_links-${type}` : ''}`}>
            {showAndroidButton && (
                <a
                    href={envData?.config?.android_link}
                    target="_blank"
                    id={androidId}
                    tabIndex={0}
                    className="download-link"
                    rel="noreferrer">
                    <img src={assetUrl('/assets/img/icon-app/app-store-android.svg')} alt="Ontdek het op Google Play" />
                </a>
            )}

            {showIosButton && (
                <a
                    href={envData?.config?.ios_iphone_link}
                    target="_blank"
                    id={iosId}
                    tabIndex={0}
                    className="download-link"
                    rel="noreferrer">
                    <img src={assetUrl('/assets/img/icon-app/app-store-ios.svg')} alt="Download in de App Store" />
                </a>
            )}
        </div>
    );
}
