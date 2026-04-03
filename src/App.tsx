import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AgentDetail, AgentsList } from './pages/sales/Agents';
import { CustomerDetail, CustomersList } from './pages/sales/Customers';
import { EnquiryDetail, EnquiryList } from './pages/sales/Enquiries';
import { QuotationDetail, QuotationNew, QuotationPreview, QuotationsList } from './pages/sales/Quotations';
import {
  GlobalTimeline,
  ProjectDetail,
  ProjectsList,
  SiteDetail,
  SitesList,
} from './pages/projects/Projects';
import { MaterialDetail, MaterialsList, PresetsPage, ToolsList } from './pages/inventory/Inventory';
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
  EmployeeDetail,
  EmployeesList,
  PayrollPage,
  TaskDetail,
  TaskNew,
  TasksList,
} from './pages/hr/HR';
import { CompanyProfilePage, MasterDataPage, UserManagementPage } from './pages/settings/Settings';
import { NotificationsPage } from './pages/utilities/Notifications';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="sales/enquiries" element={<EnquiryList />} />
        <Route path="sales/enquiries/:id" element={<EnquiryDetail />} />
        <Route path="sales/agents" element={<AgentsList />} />
        <Route path="sales/agents/:id" element={<AgentDetail />} />
        <Route path="sales/quotations" element={<QuotationsList />} />
        <Route path="sales/quotations/new" element={<QuotationNew />} />
        <Route path="sales/quotations/:id" element={<QuotationDetail />} />
        <Route path="sales/quotations/:id/preview" element={<QuotationPreview />} />
        <Route path="sales/customers" element={<CustomersList />} />
        <Route path="sales/customers/:id" element={<CustomerDetail />} />

        <Route path="projects" element={<ProjectsList />} />
        <Route path="projects/sites" element={<SitesList />} />
        <Route path="projects/sites/:id" element={<SiteDetail />} />
        <Route path="projects/timeline" element={<GlobalTimeline />} />
        <Route path="projects/:id" element={<ProjectDetail />} />

        <Route path="inventory/materials" element={<MaterialsList />} />
        <Route path="inventory/materials/:id" element={<MaterialDetail />} />
        <Route path="inventory/tools" element={<ToolsList />} />
        <Route path="inventory/presets" element={<PresetsPage />} />

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

        <Route path="hr/employees" element={<EmployeesList />} />
        <Route path="hr/employees/:id" element={<EmployeeDetail />} />
        <Route path="hr/attendance" element={<AttendancePage />} />
        <Route path="hr/attendance/monthly" element={<AttendanceMonthlyPage />} />
        <Route path="hr/payroll" element={<PayrollPage />} />
        <Route path="hr/tasks" element={<TasksList />} />
        <Route path="hr/tasks/new" element={<TaskNew />} />
        <Route path="hr/tasks/:id" element={<TaskDetail />} />

        <Route path="settings/master-data" element={<MasterDataPage />} />
        <Route path="settings/users" element={<UserManagementPage />} />
        <Route path="settings/company" element={<CompanyProfilePage />} />

        <Route path="utilities/notifications" element={<NotificationsPage />} />
      </Route>
    </Routes>
  );
}
