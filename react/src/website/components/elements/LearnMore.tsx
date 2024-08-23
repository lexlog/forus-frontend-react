import React from 'react';
import StateNavLink from '../../modules/state_router/StateNavLink';

export default function LearnMore({
    title,
    description,
    buttons,
    backgroundColor = '#E9F1FD',
    hideAboutUsButton = false,
}: {
    title: string;
    description?: string;
    buttons?: { title: string; type?: string }[];
    backgroundColor?: string;
    hideAboutUsButton?: boolean;
}) {
    return (
        <div className="block block-learn-more" style={{ backgroundColor: backgroundColor }}>
            <div className="block-learn-more-info">
                <div className="block-learn-more-title">{title}</div>
                <div className="block-learn-more-subtitle">{description}</div>
            </div>

            {!buttons ? (
                <div className="block-learn-more-actions">
                    <div className="button-group flex flex-vertical">
                        <StateNavLink name={'book-demo'} className="button button-primary text-center">
                            Gratis demo aanvragen
                        </StateNavLink>
                        {!hideAboutUsButton && (
                            <div className="button button-gray text-center hide-sm">
                                Leer meer over ons platform
                                <em className="mdi mdi-arrow-right icon-right" />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="block-learn-more-actions">
                    {buttons.map((button, index) => (
                        <div key={index} className="button-group flex flex-vertical">
                            <div className={`button button-${button.type} text-center`}>{button.title}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
