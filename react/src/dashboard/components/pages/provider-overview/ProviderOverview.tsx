import React, { useCallback, useEffect, useState } from 'react';
import useProviderFundService from '../../../services/ProviderFundService';
import useActiveOrganization from '../../../hooks/useActiveOrganization';
import FundProvider from '../../../props/models/FundProvider';
import useProductService from '../../../services/ProductService';
import useTransactionService from '../../../services/TransactionService';
import useSetProgress from '../../../hooks/useSetProgress';
import LoadingCard from '../../elements/loading-card/LoadingCard';
import useEnvData from '../../../hooks/useEnvData';
import { useEmployeeService } from '../../../services/EmployeeService';

export default function ProviderOverview() {
    const envData = useEnvData();
    const setProgress = useSetProgress();
    const activeOrganization = useActiveOrganization();

    const productService = useProductService();
    const employeeService = useEmployeeService();
    const transactionService = useTransactionService();
    const providerFundService = useProviderFundService();

    const [loaded, setLoaded] = useState(false);
    const [fundsTotal, setFundsTotal] = useState(null);
    const [productsTotal, setProductsTotal] = useState(null);
    const [employeesTotal, setEmployeesTotal] = useState(null);
    const [transactionsTotal, setTransactionsTotal] = useState(null);

    const isActive = useCallback((fund: FundProvider) => {
        return (
            (fund.allow_budget || fund.allow_products || fund.allow_some_products) &&
            fund.fund.state != 'closed' &&
            !fund.dismissed
        );
    }, []);

    useEffect(() => {
        setProgress(0);

        Promise.all([
            providerFundService.listFunds(activeOrganization.id).then((res) => {
                setFundsTotal(res.data.data.length);
            }),
            productService.list(activeOrganization.id, { per_page: 1 }).then((res) => {
                setProductsTotal(res.data.meta.total);
            }),
            employeeService.list(activeOrganization.id, { per_page: 1 }).then((res) => {
                setEmployeesTotal(res.data.meta.total);
            }),
            transactionService.list(envData.client_type, activeOrganization.id, { per_page: 1 }).then((res) => {
                setTransactionsTotal(res.data.meta.total_amount_locale);
            }),
        ]).finally(() => {
            setProgress(100);
            setLoaded(true);
        });
    }, [
        activeOrganization.id,
        providerFundService,
        transactionService,
        employeeService,
        productService,
        setProgress,
        isActive,
        envData,
    ]);

    if (!loaded) {
        return <LoadingCard />;
    }

    return (
        <div className="provider-overview" data-dusk="providerOverview">
            <div className="block block-charts">
                <div className="chart-row">
                    <div className="card" data-ng-if="$ctrl.organization | hasPerm:['manage_products']">
                        <div className="card-section">
                            <div className="chart-control chart-control-provider_overview">
                                <div className="chart-label">Aanbod</div>
                                <div className="chart-value chart-value">
                                    <div className="chart-value_value">{productsTotal}</div>
                                    <div className="chart-value_label"> Producten of diensten</div>
                                </div>
                                <div className="chart-action">
                                    <a
                                        className="button button-primary"
                                        data-ui-sref="products-create($ctrl.routeData)"
                                        data-ng-if="$ctrl.productsTotal < $ctrl.maxProductCount"
                                        id="add_product">
                                        <em className="mdi mdi-plus-circle icon-start"> </em>Toevoegen
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card" data-ng-if="$ctrl.organization | hasPerm:['manage_provider_funds']">
                        <div className="card-section">
                            <div className="chart-control chart-control-provider_overview">
                                <div className="chart-label">Fondsen</div>
                                <div className="chart-value chart-value">
                                    <div className="chart-value_value">{fundsTotal}</div>
                                    <div className="chart-value_label">Actieve fondsen</div>
                                </div>
                                <div className="chart-action">
                                    <a className="button button-primary" data-ng-click="$ctrl.applyFund()">
                                        <em className="mdi mdi-plus-circle icon-start"> </em>Aanmelden
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card" data-ng-if="$ctrl.organization | hasPerm:['view_finances']">
                        <div className="card-section">
                            <div className="chart-control chart-control-provider_overview">
                                <div className="chart-label">Transacties</div>
                                <div className="chart-value chart-value">
                                    <div className="chart-value_value">{transactionsTotal}</div>
                                    <div className="chart-value_label">Totaal aan inkomsten</div>
                                </div>
                                <div className="chart-action">
                                    <a className="button button-primary" data-ui-sref="transactions($ctrl.routeData)">
                                        <em className="mdi mdi-eye-outline icon-start"> </em>Bekijken
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card" data-ng-if="$ctrl.organization | hasPerm:['manage_employees']">
                        <div className="card-section">
                            <div className="chart-control chart-control-provider_overview">
                                <div className="chart-label">Medewerkers</div>
                                <div className="chart-value chart-value">
                                    <div className="chart-value_value">{employeesTotal}</div>
                                    <div className="chart-value_label">Aangesloten medewerkers</div>
                                </div>
                                <div className="chart-action">
                                    <a className="button button-primary" data-ui-sref="employees($ctrl.routeData)">
                                        <em className="mdi mdi-eye-outline icon-start"> </em>Bekijken
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
