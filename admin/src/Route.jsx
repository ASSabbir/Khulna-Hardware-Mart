import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Root from "./Root";
import ScrollToTop from "./ScrollToTop";
import ProtectedRoute from "./Components/ProtectedRoute";

// Phase 10 (C1) — route-based code splitting: every page becomes its own bundle,
// only fetched when the route is actually visited.
const Home = lazy(() => import("./Pages/Home/Home"));
const Stock = lazy(() => import("./Pages/Stock/Stock"));
const Invoice = lazy(() => import("./Pages/Invoice/Invoice"));
const ProductLayout = lazy(() => import("./Pages/Products/ProductLayout"));
const AllProducts = lazy(
  () => import("./Pages/Products/AllProducts/AllProducts"),
);
const AddProduct = lazy(() => import("./Pages/Products/AddProduct"));
const ProductDetails = lazy(
  () => import("./Pages/Products/AllProducts/ProductDetails"),
);
const EditProduct = lazy(() => import("./Pages/Products/EditProduct"));
const CustomerLayout = lazy(() => import("./Pages/Customer/CustomerLayout"));
const AccountLayout = lazy(() => import("./Pages/Accounts/AccountLayout"));
const InvoiceLayout = lazy(() => import("./Pages/Invoice/InvoiceLayout"));
const AllCustomers = lazy(() => import("./Pages/Customer/AllCustomers"));
const PaidCustomers = lazy(() => import("./Pages/Customer/PaidCustomers"));
const DueCustomers = lazy(() => import("./Pages/Customer/DueCustomers"));
const Partners = lazy(() => import("./Pages/Customer/Partners"));
const Suppliers = lazy(() => import("./Pages/Customer/Suppliers"));
const AddMoney = lazy(() => import("./Pages/Accounts/AddMoney"));
const AddExpense = lazy(() => import("./Pages/Accounts/AddExpense"));
const AccountsStatus = lazy(() => import("./Pages/Accounts/AccountsStatus"));
const DraftInvoice = lazy(() => import("./Pages/Invoice/DraftInvoice"));
const DueInvoice = lazy(() => import("./Pages/Invoice/DueInvoice"));
const PaidInvoice = lazy(() => import("./Pages/Invoice/PaidInvoice"));
const DeshboardLayout = lazy(() => import("./Pages/Dashboard/DeshboardLayout"));
const AdminDeshboard = lazy(() => import("./Pages/Dashboard/AdminDeshboard"));
const Revenue = lazy(() => import("./Pages/Dashboard/Revenue"));
const BookDeveloper = lazy(() => import("./Pages/Dashboard/BookDeveloper"));
const DeshboardOverview = lazy(
  () => import("./Pages/Dashboard/DeshboardOverview"),
);
const Login = lazy(() => import("./Pages/Login/Login"));
const Settings = lazy(() => import("./Pages/Settings/Settings"));
const PublicProducts = lazy(
  () => import("./Pages/PublicProducts/PublicProducts"),
);
const PurchaseHistory = lazy(() => import("./Pages/Products/PurchaseHistory"));
const InvoiceReturn = lazy(() => import("./Pages/Invoice/InvoiceReturn"));
const AccountsHistory = lazy(() => import("./Pages/Accounts/AccountsHistory"));
const Zakat = lazy(() => import("./Pages/Accounts/Zakat"));
const ShopSourceHistory = lazy(() => import("./Pages/Products/ShopSourceHistory"));
const SupplierPurchaseOrder = lazy(() => import("./Pages/Products/SupplierPurchaseOrder"));
const DueInvoicePaymentHistory = lazy(
  () => import("./Pages/Invoice/DueInvoicePaymentHistory"),
);

const PageFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
  </div>
);
const withSuspense = (el) => (
  <Suspense fallback={<PageFallback />}>{el}</Suspense>
);

const Route = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <ScrollToTop />
        <Root />
      </>
    ),
    children: [
      { path: "/", element: withSuspense(<Home />) },
      { path: "/login", element: withSuspense(<Login />) },
      { path: "/products-catalog", element: withSuspense(<PublicProducts />) },

      // Protected routes - require admin login
      {
        path: "/stock-warning",
        element: <ProtectedRoute>{withSuspense(<Stock />)}</ProtectedRoute>,
      },
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>{withSuspense(<DeshboardLayout />)}</ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="overview" replace /> },
          { path: "overview", element: withSuspense(<DeshboardOverview />) },
          { path: "admin", element: withSuspense(<AdminDeshboard />) },
          { path: "revenue", element: withSuspense(<Revenue />) },
          { path: "book", element: withSuspense(<BookDeveloper />) },
        ],
      },

      {
        path: "/customer",
        element: (
          <ProtectedRoute>{withSuspense(<CustomerLayout />)}</ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="all" replace /> },

          { path: "all", element: withSuspense(<AllCustomers />) },
          { path: "paid", element: withSuspense(<PaidCustomers />) },
          { path: "due", element: withSuspense(<DueCustomers />) },
          { path: "partners", element: withSuspense(<Partners />) },
          { path: "suppliers", element: withSuspense(<Suppliers />) },
        ],
      },
      {
        path: "/accounts",
        element: (
          <ProtectedRoute>{withSuspense(<AccountLayout />)}</ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="add-money" replace /> },

          { path: "add-money", element: withSuspense(<AddMoney />) },
          { path: "add-expense", element: withSuspense(<AddExpense />) },
          { path: "status", element: withSuspense(<AccountsStatus />) },
          { path: "history", element: withSuspense(<AccountsHistory />) },
          { path: "zakat", element: withSuspense(<Zakat />) },
        ],
      },
      {
        path: "/invoice",
        element: (
          <ProtectedRoute>{withSuspense(<InvoiceLayout />)}</ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="invoice" replace /> },

          { path: "invoice", element: withSuspense(<Invoice />) },
          { path: "draft", element: withSuspense(<DraftInvoice />) },
          { path: "due", element: withSuspense(<DueInvoice />) },
          { path: "paid", element: withSuspense(<PaidInvoice />) },
          { path: "return", element: withSuspense(<InvoiceReturn />) },
          {
            path: "due-payment-history",
            element: withSuspense(<DueInvoicePaymentHistory />),
          },
        ],
      },

      {
        path: "/products",
        element: (
          <ProtectedRoute>{withSuspense(<ProductLayout />)}</ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="all" replace /> },

          { path: "all", element: withSuspense(<AllProducts />) },
          { path: "add", element: withSuspense(<AddProduct />) },
          {
            path: "purchase-history",
            element: withSuspense(<PurchaseHistory />),
          },
          {
            path: "shop-sources",
            element: withSuspense(<ShopSourceHistory />),
          },
          { path: "supplier-purchase", element: withSuspense(<SupplierPurchaseOrder />) },
        ],
      },
      {
        path: "products/edit/:id",
        element: (
          <ProtectedRoute>{withSuspense(<EditProduct />)}</ProtectedRoute>
        ),
      },
      {
        path: "products/:id",
        element: (
          <ProtectedRoute>{withSuspense(<ProductDetails />)}</ProtectedRoute>
        ),
      },

      {
        path: "/settings",
        element: <ProtectedRoute>{withSuspense(<Settings />)}</ProtectedRoute>,
      },
    ],
  },
]);

export default Route;
