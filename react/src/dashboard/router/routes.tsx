import React from 'react';
import RouterBuilder from '../modules/state_router/RouterBuilder';
import SignIn from '../components/pages/auth/SignIn';
import SignUp from '../components/pages/auth/SignUp';
import SignOut from '../components/pages/auth/SignOut';
import FundRequests from '../components/pages/fund_requests/FundRequests';
import Home from '../components/pages/home/Home';
import ExternalFunds from '../components/pages/external_funds/ExternalFunds';
import Employees from '../components/pages/employees/Employees';
import CsvValidations from '../components/pages/csv_validations/CsvValidations';
import Organizations from '../components/pages/organizations/Organizations';
import IdentityRestore from '../components/pages/auth/IdentityRestore';
import Redirect from '../components/pages/redirect/Redirect';
import { LayoutType } from '../modules/state_router/RouterProps';
import OfficesEdit from '../components/pages/offices-edit/OfficesEdit';
import OfficesCreate from '../components/pages/offices-edit/OfficesCreate';
import OrganizationEdit from '../components/pages/organizations-edit/OrganizationEdit';
import OrganizationCreate from '../components/pages/organizations-edit/OrganizationCreate';
import Auth2FA from '../components/pages/auth/Auth2FA';
import ProviderOverview from '../components/pages/provider-overview/ProviderOverview';
import Offices from '../components/pages/offices/Offices';
import Products from '../components/pages/products/Products';
import ProductsCreate from '../components/pages/products-edit/ProductsCreate';
import ProductsEdit from '../components/pages/products-edit/ProductsEdit';
import ProductsView from '../components/pages/products-view/ProductsView';
import Transactions from '../components/pages/transactions/Transactions';
import TransactionSettings from '../components/pages/transaction-settings/TransactionSettings';
import TransactionsView from '../components/pages/transactions-view/TransactionsView';
import Reservations from '../components/pages/reservations/Reservations';
import ReservationsSettings from '../components/pages/reservations-settings/ReservationsSettings';
import ReservationsView from '../components/pages/reservations-view/ReservationsView';
import ProviderFunds from '../components/pages/provider-funds/ProviderFunds';
import Feedback from '../components/pages/feedback/Feedback';
import NotFound from '../components/pages_system/NotFound';
import FundRequestsView from '../components/pages/fund_requests-view/FundRequestsView';
import OrganizationsSecurity from '../components/pages/organizations-security/OrganizationsSecurity';
import OrganizationsView from '../components/pages/organizations-view/OrganizationsView';
import OrganizationsNotifications from '../components/pages/organizations-notifications/OrganizationsNotifications';
import PreferencesEmails from '../components/pages/identity-preferences/PreferencesEmails';
import PreferencesNotifications from '../components/pages/identity-preferences/PreferencesNotifications';
import Security2FA from '../components/pages/identity-security/Security2FA';
import SecuritySessions from '../components/pages/identity-security/SecuritySessions';
import OrganizationsNoPermissions from '../components/pages/organizations-no-permissions/OrganizationsNoPermissions';
import PaymentMethods from '../components/pages/payment-methods/PaymentMethods';
import MolliePrivacy from '../components/pages/mollie-privacy/MolliePrivacy';
import CsvValidationsRedirect from '../components/pages/csv_validations/CsvValidationsRedirect';
import Reimbursements from '../components/pages/reimbursements/Reimbursements';
import ReimbursementsView from '../components/pages/reimbursements-view/ReimbursementsView';
import BankConnections from '../components/pages/bank-connections/BankConnections';
import ExtraPayments from '../components/pages/extra-payments/ExtraPayments';
import ExtraPaymentsView from '../components/pages/extra-payments-view/ExtraPaymentsView';
import Features from '../components/pages/features/Features';
import Feature from '../components/pages/feature/Feature';
import EventLogs from '../components/pages/eventLogs/EventLogs';
import ImplementationsView from '../components/pages/implementations-view/ImplementationsView';
import ImplementationsEmail from '../components/pages/implementations-email/ImplementationsEmail';
import ImplementationsDigid from '../components/pages/implementations-digid/ImplementationsDigid';
import FundBackofficeEdit from '../components/pages/fund-backoffice-edit/FundBackofficeEdit';
import ImplementationsCms from '../components/pages/implementations-cms/ImplementationsCms';
import ImplementationsConfig from '../components/pages/implementations-config/ImplementationsConfig';
import ImplementationsSocialMedia from '../components/pages/implementations-social-media/ImplementationsSocialMedia';
import ImplementationsCmsPageEdit from '../components/pages/implementations-cms-page/ImplementationsCmsPageEdit';
import ImplementationsCmsPageCreate from '../components/pages/implementations-cms-page/ImplementationsCmsPageCreate';
import FinancialDashboard from '../components/pages/financial-dashboard/FinancialDashboard';
import FinancialDashboardOverview from '../components/pages/financial-dashboard-overview/FinancialDashboardOverview';
import TransactionBulksView from '../components/pages/transaction-bulks-view/TransactionBulksView';
import ReimbursementCategories from '../components/pages/reimbursement-categories/ReimbursementCategories';
import Vouchers from '../components/pages/vouchers/Vouchers';
import VouchersViewComponent from '../components/pages/vouchers-view/VouchersViewComponent';
import ProductVouchers from '../components/pages/vouchers/ProductVouchers';
import SponsorProviderOrganizations from '../components/pages/sponsor-provider-organizations/SponsorProviderOrganizations';
import SponsorProviderOrganization from '../components/pages/sponsor-provider-organization/SponsorProviderOrganization';
import FundProvider from '../components/pages/fund-provider/FundProvider';
import SponsorProductsCreate from '../components/pages/sponsor-product-edit/SponsorProductsCreate';
import SponsorProductsEdit from '../components/pages/sponsor-product-edit/SponsorProductsEdit';
import FundProviderProductView from '../components/pages/fund-provider-product-view/FundProviderProductView';
import FundProviderProductSubsidyEdit from '../components/pages/fund-provider-product-subsidy-edit/FundProviderProductSubsidyEdit';
import ImplementationsNotifications from '../components/pages/implementations-notifications/ImplementationsNotifications';
import ImplementationsNotificationsSend from '../components/pages/implementations-notifications-send/ImplementationsNotificationsSend';
import ImplementationsNotificationsEdit from '../components/pages/implementations-notifications-edit/ImplementationsNotificationsEdit';
import ImplementationsNotificationsBranding from '../components/pages/implementations-notifications-branding/ImplementationsNotificationsBranding';
import OrganizationFunds from '../components/pages/organizations-funds/OrganizationFunds';
import OrganizationsFundsShow from '../components/pages/organizations-funds-show/OrganizationsFundsShow';
import OrganizationsFundsEdit from '../components/pages/organizations-funds-edit/OrganizationsFundsEdit';
import OrganizationsFundsSecurity from '../components/pages/organizations-funds-security/OrganizationsFundsSecurity';
import IdentitiesShow from '../components/pages/identitities-show/IdentitiesShow';
import PreCheck from '../components/pages/pre-check/PreCheck';
import BiConnection from '../components/pages/bi-connection/BiConnection';
import ThrowError from '../components/pages_system/ThrowError';
import Implementations from '../components/pages/implementations/Implementations';
import ExternalValidators from '../components/pages/external-validators/ExternalValidators';
import SponsorFundUnsubscriptions from '../components/pages/sponsor-fund-unsubscriptions/SponsorFundUnsubscriptions';
import OrganizationsContacts from '../components/pages/organizations-contacts/OrganizationsContacts';

const router = new RouterBuilder();

router.state('sign-in', <SignIn />, {
    path: `/sign-in`,
    layout: LayoutType.landingClear,
    protected: false,
});

router.state('sign-up', <SignUp />, {
    path: `/sign-up`,
    layout: LayoutType.landingClearNew,
    protected: false,
});

router.state('sign-out', <SignOut />, {
    path: `/sign-out`,
    protected: false,
});

router.state('auth-2fa', <Auth2FA />, {
    path: `/auth-2fa`,
    layout: LayoutType.landingClear,
    protected: false,
});

router.state('identity-restore', <IdentityRestore confirmation={false} />, {
    path: `/identity-restore`,
    protected: false,
});

router.state('identity-confirmation', <IdentityRestore confirmation={true} />, {
    path: `/confirmation/email/:token`,
    protected: false,
});

router.state('organizations', <Organizations />, {
    path: `/organizations`,
    protected: false,
});

router.state('organizations-view', <OrganizationsView />, {
    path: `/organizations/:organizationId`,
    protected: false,
});

router.state('organizations-create', <OrganizationCreate />, {
    path: `/organizations/create`,
    protected: false,
    fallbackState: 'organizations',
});

router.state('organizations-edit', <OrganizationEdit />, {
    path: `/organizations/:organizationId/edit`,
    fallbackState: 'organizations',
});

router.state('organization-funds', <OrganizationFunds />, {
    path: `/organizations/:organizationId/funds`,
    fallbackState: 'organizations',
});

router.state('fund-backoffice-edit', <FundBackofficeEdit />, {
    path: `/organizations/:organizationId/funds/:fundId/backoffice`,
    fallbackState: 'organizations',
});

router.state('funds-show', <OrganizationsFundsShow />, {
    path: `/organizations/:organizationId/funds/:fundId`,
    fallbackState: 'organizations',
});

router.state('funds-create', <OrganizationsFundsEdit />, {
    path: `/organizations/:organizationId/funds/create`,
});

router.state('funds-edit', <OrganizationsFundsEdit />, {
    path: `/organizations/:organizationId/funds/:fundId/edit`,
    fallbackState: 'organizations',
});

router.state('funds-security', <OrganizationsFundsSecurity />, {
    path: `/organizations/:organizationId/funds/:fundId/security`,
    fallbackState: 'organizations',
});

router.state('identities-show', <IdentitiesShow />, {
    path: `/organizations/:organizationId/funds/:fundId/identities/:id`,
    fallbackState: 'organizations',
});

router.state('pre-check', <PreCheck />, {
    path: `/organizations/:organizationId/pre-check`,
});

router.state('external-validators', <ExternalValidators />, {
    path: `/organizations/:organizationId/external-validators`,
});

router.state('sponsor-provider-organizations', <SponsorProviderOrganizations />, {
    path: `/organizations/:organizationId/providers`,
    fallbackState: 'organizations',
});

router.state('sponsor-provider-organization', <SponsorProviderOrganization />, {
    path: `/organizations/:organizationId/providers/:id`,
    fallbackState: 'organizations',
});

router.state('fund-provider', <FundProvider />, {
    path: `/organizations/:organizationId/funds/:fundId/providers/:id`,
    fallbackState: 'organizations',
});

router.state('fund-provider-product-create', <SponsorProductsCreate />, {
    path: `/organizations/:organizationId/funds/:fundId/providers/:fundProviderId/products/create`,
    fallbackState: 'organizations',
});

router.state('fund-provider-product', <FundProviderProductView />, {
    path: `/organizations/:organizationId/funds/:fundId/providers/:fundProviderId/products/:id`,
    fallbackState: 'organizations',
});

router.state('fund-provider-product-edit', <SponsorProductsEdit />, {
    path: `/organizations/:organizationId/funds/:fundId/providers/:fundProviderId/products/:id/edit`,
    fallbackState: 'organizations',
});

router.state('fund-provider-product-subsidy-edit', <FundProviderProductSubsidyEdit />, {
    path: `/organizations/:organizationId/funds/:fundId/providers/:fundProviderId/products/:id/subsidy`,
    fallbackState: 'organizations',
});

router.state('sponsor-fund-unsubscriptions', <SponsorFundUnsubscriptions />, {
    path: `/organizations/:organizationId/fund-unsubscriptions`,
    fallbackState: 'organizations',
});

router.state('bank-connections', <BankConnections />, {
    path: `/organizations/:organizationId/bank-connections`,
});

router.state('financial-dashboard', <FinancialDashboard />, {
    path: `/organizations/:organizationId/financial-dashboard`,
});

router.state('financial-dashboard-overview', <FinancialDashboardOverview />, {
    path: `/organizations/:organizationId/financial-dashboard-overview`,
});

router.state('vouchers', <Vouchers />, {
    path: `/organizations/:organizationId/vouchers`,
});

router.state('vouchers-show', <VouchersViewComponent />, {
    path: `/organizations/:organizationId/vouchers/:id`,
    fallbackState: 'organizations',
});

router.state('product-vouchers', <ProductVouchers />, {
    path: `/organizations/:organizationId/product-vouchers`,
});

router.state('reimbursements', <Reimbursements />, {
    path: `/organizations/:organizationId/reimbursements`,
});

router.state('reimbursements-view', <ReimbursementsView />, {
    path: `/organizations/:organizationId/reimbursements/:id`,
    fallbackState: 'reimbursements',
});

router.state('reimbursement-categories', <ReimbursementCategories />, {
    path: `/organizations/:organizationId/reimbursement-categories`,
});

router.state('extra-payments', <ExtraPayments />, {
    path: `/organizations/:organizationId/extra-payments`,
    fallbackState: 'organizations',
});

router.state('extra-payments-show', <ExtraPaymentsView />, {
    path: `/organizations/:organizationId/extra-payments/:id`,
    fallbackState: 'organizations',
});

router.state('implementations', <Implementations />, {
    path: `/organizations/:organizationId/implementations`,
    fallbackState: 'organizations',
});

router.state('implementations-view', <ImplementationsView />, {
    path: `/organizations/:organizationId/implementations/:id`,
    fallbackState: 'organizations',
});

router.state('implementations-cms', <ImplementationsCms />, {
    path: `/organizations/:organizationId/implementations/:id/cms`,
    fallbackState: 'organizations',
});

router.state('implementations-cms-page-edit', <ImplementationsCmsPageEdit />, {
    path: `/organizations/:organizationId/implementations/:implementationId/pages/:id`,
    fallbackState: 'organizations',
});

router.state('implementations-cms-page-create', <ImplementationsCmsPageCreate />, {
    path: `/organizations/:organizationId/implementations/:implementationId/pages/create`,
    fallbackState: 'organizations',
});

router.state('implementations-config', <ImplementationsConfig />, {
    path: `/organizations/:organizationId/implementations/:id/config`,
    fallbackState: 'organizations',
});

router.state('implementations-email', <ImplementationsEmail />, {
    path: `/organizations/:organizationId/implementations/:id/email`,
    fallbackState: 'organizations',
});

router.state('implementations-digid', <ImplementationsDigid />, {
    path: `/organizations/:organizationId/implementations/:id/digid`,
    fallbackState: 'organizations',
});

router.state('implementations-social-media', <ImplementationsSocialMedia />, {
    path: `/organizations/:organizationId/implementations/:id/social-media`,
    fallbackState: 'organizations',
});

router.state('implementation-notifications', <ImplementationsNotifications />, {
    path: `/organizations/:organizationId/implementation-notifications`,
    fallbackState: 'organizations',
});

router.state('implementation-notifications-send', <ImplementationsNotificationsSend />, {
    path: `/organizations/:organizationId/implementations/:id/implementation-notifications/send`,
    fallbackState: 'organizations',
});

router.state('implementation-notifications-edit', <ImplementationsNotificationsEdit />, {
    path: `/organizations/:organizationId/implementations/:implementationId/implementation-notifications/:id`,
    fallbackState: 'organizations',
});

router.state('implementation-notifications-branding', <ImplementationsNotificationsBranding />, {
    path: `/organizations/:organizationId/implementations/:id/notifications-branding`,
    fallbackState: 'organizations',
});

router.state('organization-logs', <EventLogs />, {
    path: `/organizations/:organizationId/logs`,
    fallbackState: 'organizations',
});

router.state('bi-connection', <BiConnection />, {
    path: `/organizations/:organizationId/bi-connection`,
    fallbackState: 'organizations',
});

router.state('organizations-contacts', <OrganizationsContacts />, {
    path: `/organizations/:organizationId/contacts`,
    fallbackState: 'organizations',
});

router.state('offices', <Offices />, {
    path: `/organizations/:organizationId/offices`,
});

router.state('offices-create', <OfficesCreate />, {
    path: `/organizations/:organizationId/offices/create`,
    protected: false,
    fallbackState: 'organizations',
});

router.state('offices-edit', <OfficesEdit />, {
    path: `/organizations/:organizationId/offices/:id/edit`,
    fallbackState: 'organizations',
});

router.state('organization-security', <OrganizationsSecurity />, {
    path: `/organizations/:organizationId/security`,
});

router.state('organization-no-permissions', <OrganizationsNoPermissions />, {
    path: `/organizations/:organizationId/no-permissions`,
});

router.state('provider-overview', <ProviderOverview />, {
    path: `/organizations/:organizationId/overview`,
});

router.state('provider-funds', <ProviderFunds />, {
    path: `/organizations/:organizationId/provider/funds`,
});

router.state('transactions', <Transactions />, {
    path: `/organizations/:organizationId/transactions`,
});

router.state('transaction-settings', <TransactionSettings />, {
    path: `/organizations/:organizationId/transaction-settings`,
});

router.state('transaction-bulk', <TransactionBulksView />, {
    path: `/organizations/:organizationId/transaction-bulks/:id`,
});

router.state('transaction', <TransactionsView />, {
    path: `/organizations/:organizationId/transactions/:address`,
});

router.state('reservations', <Reservations />, {
    path: `/organizations/:organizationId/reservations`,
});

router.state('reservations-show', <ReservationsView />, {
    path: `/organizations/:organizationId/reservations/:id`,
});

router.state('reservations-settings', <ReservationsSettings />, {
    path: `/organizations/:organizationId/reservations/settings`,
});

router.state('payment-methods', <PaymentMethods />, {
    path: `/organizations/:organizationId/payment-methods`,
});

router.state('mollie-privacy', <MolliePrivacy />, {
    path: `/organizations/:organizationId/mollie-privacy`,
});

router.state('products', <Products />, {
    path: `/organizations/:organizationId/products`,
});

router.state('products-show', <ProductsView />, {
    path: `/organizations/:organizationId/products/:id`,
    fallbackState: 'products',
});

router.state('products-create', <ProductsCreate />, {
    path: `/organizations/:organizationId/products/create`,
    fallbackState: 'products',
});

router.state('products-edit', <ProductsEdit />, {
    path: `/organizations/:organizationId/products/:id/edit`,
    fallbackState: 'products',
});

router.state('fund-requests', <FundRequests />, {
    path: `/organizations/:organizationId/requests`,
});

router.state('fund-request', <FundRequestsView />, {
    path: `/organizations/:organizationId/requests/:id`,
    fallbackState: 'fund-requests',
});

router.state('external-funds', <ExternalFunds />, {
    path: `/organizations/:organizationId/external-funds`,
});

router.state('employees', <Employees />, {
    path: `/organizations/:organizationId/employees`,
});

router.state('organization-notifications', <OrganizationsNotifications />, {
    path: `/organizations/:organizationId/notifications`,
});

router.state('features', <Features />, {
    path: `/organizations/:organizationId/features`,
});

router.state('feature', <Feature />, {
    path: `/organizations/:organizationId/feature/:key`,
});

router.state('feedback', <Feedback />, {
    path: `/organizations/:organizationId/feedback`,
});

router.state('csv-validation', <CsvValidations />, {
    path: `/csv-validations`,
});

router.state('csv-validation-redirect', <CsvValidationsRedirect />, {
    path: `/csv-validation/funds/redirect/:fundId?`,
});

router.state('preferences-emails', <PreferencesEmails />, {
    path: `/preferences/emails`,
});

router.state('preferences-notifications', <PreferencesNotifications />, {
    path: `/preferences/notifications`,
});

router.state('security-2fa', <Security2FA />, {
    path: `/security/2fa`,
});

router.state('security-sessions', <SecuritySessions />, {
    path: `/security/sessions`,
});

router.state('redirect', <Redirect />, {
    path: `/redirect`,
    layout: LayoutType.clear,
});

router.state('home', <Home />, {
    path: `/`,
    protected: false,
});

router.state('not-found', <NotFound />, {
    path: `/not-found`,
    protected: false,
});

router.state('throw', <ThrowError />, {
    path: `/throw`,
    protected: false,
});

router.state('*', <NotFound />, {
    path: `*`,
    protected: false,
});

export default router;
