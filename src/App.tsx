import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AgentDetail, AgentsList } from './pages/sales/Agents';
import { CustomerDetail, CustomersList } from './pages/sales/Customers';
import { EnquiryDetail, EnquiryList } from './pages/sales/Enquiries';
import {
  QuotationDetail,
  QuotationEdit,
  QuotationNew,
  QuotationPreview,
  QuotationsList,
} from './pages/sales/Quotations';
import { ActiveSitesPage } from './pages/operations/ActiveSitesPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import {
  AuditAssetsPage,
  AuditCashBankPage,
  AuditDashboardPage,
  AuditDataFlowPage,
  AuditDebtorsCreditorsPage,
  AuditExpensesPage,
  AuditGstPage,
  AuditInventoryPage,
  AuditLogsPage,
  AuditProfitLossPage,
  AuditReportsPage,
  AuditChartOfAccountsRedirect,
} from './pages/audit/AuditModule';
import { ProjectDetail, ProjectsList } from './pages/projects/Projects';
import { ProjectSummariesPage } from './pages/projects/ProjectSummaries';
import { SiteToProjectRedirect } from './routes/SiteRedirects';
import { MaterialDetail, MaterialsList, PresetsPage, ToolsList } from './pages/inventory/Inventory';
import { InventoryDesk } from './pages/inventory/InventoryDesk';
import {
  ChartOfAccountsPage,
  ExpenseAuditPage,
  InvoiceDetail,
  InvoiceNew,
  InvoicesList,
  LoansList,
  PaymentsList,
  SaleBillsList,
  VendorsList,
} from './pages/finance/Finance';
import { FinanceHubPage } from './pages/finance/FinanceHubPage';
import { FinanceTransactionsPage } from './pages/finance/FinanceTransactionsPage';
import { FinanceAccountingDesk } from './pages/finance/FinanceAccountingDesk';
import { FinanceBillingDesk } from './pages/finance/FinanceBillingDesk';
import { FinancePartnersDesk } from './pages/finance/FinancePartnersDesk';
import {
  ChannelPartnerDetail,
  ChannelPartnersFinanceListEnhanced,
  LoanNew,
  PartnerDetail,
  PartnersFinanceListEnhanced,
  SaleBillDetail,
  SaleBillNew,
  VendorDetail,
} from './pages/finance/FinanceDetails';
import {
  AttendanceMonthlyPage,
  AttendancePage,
  DeploymentPage,
  EmployeeDetail,
  EmployeesList,
  HolidaysPage,
  PayrollPage,
  TaskDetail,
  TaskNew,
  TasksList,
} from './pages/hr/HR';
import { CompanyAndMasterPage, UserManagementPage } from './pages/settings/Settings';
import { SettingsDesk } from './pages/settings/SettingsDesk';
import { NotificationsPage } from './pages/utilities/Notifications';

function LegacySalesCustomerRedirect() {
  const { id } = useParams();
  if (!id) return <Navigate to="/finance/customers" replace />;
  return <Navigate to={`/finance/customers/${id}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="sales" element={<Navigate to="/sales/enquiries" replace />} />
        <Route path="sales/enquiries" element={<EnquiryList />} />
        <Route path="sales/enquiries/:id" element={<EnquiryDetail />} />
        <Route path="sales/agents" element={<AgentsList />} />
        <Route path="sales/agents/:id" element={<AgentDetail />} />
        <Route path="sales/quotations" element={<QuotationsList />} />
        <Route path="sales/quotations/new" element={<QuotationNew />} />
        <Route path="sales/quotations/:id/edit" element={<QuotationEdit />} />
        <Route path="sales/quotations/:id/preview" element={<QuotationPreview />} />
        <Route path="sales/quotations/:id" element={<QuotationDetail />} />
        <Route path="sales/customers" element={<Navigate to="/finance/customers" replace />} />
        <Route path="sales/customers/:id" element={<LegacySalesCustomerRedirect />} />

        <Route path="projects" element={<ProjectsList />} />
        <Route path="projects/active-sites" element={<ActiveSitesPage />} />
        <Route path="projects/summaries" element={<ProjectSummariesPage />} />
        <Route path="projects/sites" element={<Navigate to="/projects" replace />} />
        <Route path="projects/sites/:id" element={<SiteToProjectRedirect />} />
        <Route path="projects/timeline" element={<Navigate to="/projects/summaries" replace />} />
        <Route path="projects/:id" element={<ProjectDetail />} />

        <Route path="inventory" element={<InventoryDesk />} />
        <Route path="inventory/materials" element={<MaterialsList />} />
        <Route path="inventory/materials/:id" element={<MaterialDetail />} />
        <Route path="inventory/tools" element={<ToolsList />} />
        <Route path="inventory/presets" element={<Navigate to="/presets" replace />} />

        <Route path="presets" element={<PresetsPage />} />

        <Route path="finance/hub" element={<FinanceHubPage />} />
        <Route path="finance/customers" element={<CustomersList />} />
        <Route path="finance/customers/:id" element={<CustomerDetail />} />
        <Route path="finance/transactions" element={<FinanceTransactionsPage />} />
        <Route path="finance/billing" element={<FinanceBillingDesk />} />
        <Route path="finance/partners-vendors" element={<FinancePartnersDesk />} />
        <Route path="finance/accounting" element={<FinanceAccountingDesk />} />
        <Route path="finance/invoices" element={<InvoicesList />} />
        <Route path="finance/invoices/new" element={<InvoiceNew />} />
        <Route path="finance/invoices/:id" element={<InvoiceDetail />} />
        <Route path="finance/sale-bills" element={<SaleBillsList />} />
        <Route path="finance/sale-bills/new" element={<SaleBillNew />} />
        <Route path="finance/sale-bills/:id" element={<SaleBillDetail />} />
        <Route path="finance/payments" element={<PaymentsList />} />
        <Route path="finance/loans" element={<LoansList />} />
        <Route path="finance/loans/new" element={<LoanNew />} />
        <Route path="finance/vendors" element={<VendorsList />} />
        <Route path="finance/vendors/:id" element={<VendorDetail />} />
        <Route path="finance/partners" element={<PartnersFinanceListEnhanced />} />
        <Route path="finance/partners/:id" element={<PartnerDetail />} />
        <Route path="finance/channel-partners" element={<ChannelPartnersFinanceListEnhanced />} />
        <Route path="finance/channel-partners/:id" element={<ChannelPartnerDetail />} />
        <Route path="finance/chart-of-accounts" element={<ChartOfAccountsPage />} />
        <Route path="finance/expense-audit" element={<ExpenseAuditPage />} />

        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="audit" element={<AuditDashboardPage />} />
        <Route path="audit/chart-of-accounts" element={<AuditChartOfAccountsRedirect />} />
        <Route path="audit/profit-loss" element={<AuditProfitLossPage />} />
        <Route path="audit/inventory" element={<AuditInventoryPage />} />
        <Route path="audit/debtors-creditors" element={<AuditDebtorsCreditorsPage />} />
        <Route path="audit/gst" element={<AuditGstPage />} />
        <Route path="audit/cash-bank" element={<AuditCashBankPage />} />
        <Route path="audit/expenses" element={<AuditExpensesPage />} />
        <Route path="audit/assets" element={<AuditAssetsPage />} />
        <Route path="audit/logs" element={<AuditLogsPage />} />
        <Route path="audit/reports" element={<AuditReportsPage />} />
        <Route path="audit/data-flow" element={<AuditDataFlowPage />} />

        <Route path="hr" element={<Navigate to="/hr/employees" replace />} />
        <Route path="hr/employees" element={<EmployeesList />} />
        <Route path="hr/employees/:id" element={<EmployeeDetail />} />
        <Route path="hr/attendance" element={<AttendancePage />} />
        <Route path="hr/attendance/monthly" element={<AttendanceMonthlyPage />} />
        <Route path="hr/payroll" element={<PayrollPage />} />
        <Route path="hr/holidays" element={<HolidaysPage />} />
        <Route path="hr/deployment" element={<DeploymentPage />} />
        <Route path="hr/tasks" element={<TasksList />} />
        <Route path="hr/tasks/new" element={<TaskNew />} />
        <Route path="hr/tasks/:id" element={<TaskDetail />} />

        <Route path="settings/master-data" element={<CompanyAndMasterPage />} />
        <Route path="settings/users" element={<UserManagementPage />} />
        <Route path="settings/company" element={<CompanyAndMasterPage />} />
        <Route path="settings" element={<SettingsDesk />} />

        <Route path="utilities/notifications" element={<NotificationsPage />} />
      </Route>
    </Routes>
  );
}
