import React, { useMemo } from 'react';
import useAssetUrl from '../../../hooks/useAssetUrl';
import { get } from 'lodash';
import Fund from '../../../props/models/Fund';
import StateNavLink from '../../../modules/state_router/StateNavLink';

export default function Auth2FARestriction({
    type,
    items,
    itemName,
    itemThumbnail,
    defaultThumbnail,
}: {
    type: 'sessions' | 'emails' | 'bi_connections';
    items: Array<Partial<Fund>>;
    itemName: string;
    itemThumbnail: string;
    defaultThumbnail: string;
}) {
    const assetUrl = useAssetUrl();

    const itemsList = useMemo(() => {
        return items.map((item) => ({
            id: item.id,
            name: get(item, itemName),
            thumbnail: get(item, itemThumbnail),
        }));
    }, [itemName, itemThumbnail, items]);

    return (
        <div className="block block-2fa-restriction">
            <div className="restriction-hero">
                <div className="restriction-hero-media">
                    <img src={assetUrl('/assets/img/icon-2fa-restriction.svg')} alt="" />
                </div>
                {type == 'emails' && (
                    <div className="restriction-hero-details">
                        <div className="restriction-hero-title">
                            Tweefactorauthenticatie is vereist voor het wijzigingen van een e-mailadres
                        </div>
                        <div className="restriction-hero-description">
                            Om de veiligheid en bescherming van persoonlijke gegevens te waarborgen, is het verplicht om
                            accounts te authenticeren. Gebruikers moeten een identificatiemethode verstrekken voordat ze
                            toegang krijgen tot functies waarin persoonlijke gegevens worden ingevoerd of
                            accountaanpassingen kunnen worden gemaakt.
                        </div>
                        <div className="button-group">
                            <StateNavLink className="button button-primary button-sm" name={'security-2fa'}>
                                <div className="icon-start mdi mdi-lock-outline" />
                                Tweefactorauthenticatie instellen
                            </StateNavLink>
                        </div>
                    </div>
                )}

                {type == 'sessions' && (
                    <div className="restriction-hero-details">
                        <div className="restriction-hero-title">
                            Tweefactorauthenticatie is vereist voor het beheren van sessies
                        </div>
                        <div className="restriction-hero-description">
                            Om de veiligheid en bescherming van persoonlijke gegevens te waarborgen, is het verplicht om
                            accounts te authenticeren. Gebruikers moeten een identificatiemethode verstrekken voordat ze
                            toegang krijgen tot functies waarin persoonlijke gegevens worden ingevoerd of
                            accountaanpassingen kunnen worden gemaakt.
                        </div>
                        <div className="button-group">
                            <StateNavLink className="button button-primary button-sm" name={'security-2fa'}>
                                <div className="icon-start mdi mdi-lock-outline" />
                                Tweefactorauthenticatie instellen
                            </StateNavLink>
                        </div>
                    </div>
                )}

                {type == 'bi_connections' && (
                    <div className="restriction-hero-details">
                        <div className="restriction-hero-title">
                            Tweefactorauthenticatie is vereist voor het beheren van bi connections
                        </div>
                        <div className="restriction-hero-description">
                            Om de veiligheid en bescherming van persoonlijke gegevens te waarborgen, is het verplicht om
                            accounts te authenticeren. Gebruikers moeten een identificatiemethode verstrekken voordat ze
                            toegang krijgen tot functies waarin persoonlijke gegevens worden ingevoerd of
                            accountaanpassingen kunnen worden gemaakt.
                        </div>
                        <div className="button-group">
                            <StateNavLink className="button button-primary button-sm" name={'security-2fa'}>
                                <div className="icon-start mdi mdi-lock-outline" />
                                Tweefactorauthenticatie instellen
                            </StateNavLink>
                        </div>
                    </div>
                )}
            </div>

            {type != 'bi_connections' && (
                <div className="restriction-reasons">
                    {type == 'emails' && (
                        <div className="restriction-details">
                            <div className="restriction-title">
                                Voor de volgende tegoeden is tweefactorauthenticatie vereist.
                            </div>
                            <div className="restriction-description">
                                Om bepaalde opties en functionaliteit te gebruiken, dienen gebruikers een tweede
                                verificatiemethode te gebruiken. Dit versterkt de beveiliging en zorgt ervoor dat alleen
                                geautoriseerde gebruikers toegang hebben tot de functies, waardoor de accounts beter
                                beschermd zijn.
                            </div>
                        </div>
                    )}

                    {type == 'sessions' && (
                        <div className="restriction-details">
                            <div className="restriction-title">
                                Voor de volgende tegoeden is tweefactorauthenticatie vereist.
                            </div>
                            <div className="restriction-description">
                                Om bepaalde opties en functionaliteit te gebruiken, dienen gebruikers een tweede
                                verificatiemethode te gebruiken. Dit versterkt de beveiliging en zorgt ervoor dat alleen
                                geautoriseerde gebruikers toegang hebben tot de functies, waardoor de accounts beter
                                beschermd zijn.
                            </div>
                        </div>
                    )}

                    {itemsList?.map((item) => (
                        <div key={item.id} className="restriction-item">
                            <div className="restriction-item-media">
                                <img
                                    src={item.thumbnail || assetUrl(`/assets/img/placeholders/${defaultThumbnail}.png`)}
                                    alt={''}
                                />
                            </div>
                            <div className="restriction-item-name">{item.name}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
