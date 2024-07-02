import { MouseEventHandler } from 'react';
import React from 'react';
import StateNavLink from '../../../modules/state_router/StateNavLink';

interface IdentityMenuItemProps {
    id?: string;
    name: string;
    icon: string;
    route: string;
    show: boolean;
    target?: string;
    routeParams: object;
    dusk?: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export default function LayoutAsideNavItem({
    id,
    name,
    show,
    icon,
    dusk,
    route,
    routeParams,
    onClick,
    target,
}: IdentityMenuItemProps) {
    return (
        show && (
            <StateNavLink
                id={id}
                onClick={onClick}
                name={route}
                params={routeParams}
                dataDusk={dusk}
                target={target}
                className="sidebar-nav-item">
                <div className="sidebar-nav-item-arrow">
                    <div className="mdi mdi-menu-right"></div>
                </div>

                <div className="sidebar-nav-item-icon">
                    <img src={`./assets/img/menu/icon-${icon}.svg`} alt="Item" />
                    <img src={`./assets/img/menu/icon-${icon}-hover.svg`} alt="Item" className={'hover'} />
                    <img src={`./assets/img/menu/icon-${icon}-active.svg`} alt="Item" className={'active'} />
                </div>
                {name}
            </StateNavLink>
        )
    );
}
