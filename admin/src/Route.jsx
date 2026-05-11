import { createBrowserRouter, Navigate } from "react-router-dom";
import Root from "./Root";
import ScrollToTop from "./ScrollToTop";
import Home from "./Pages/Home/Home";
import Stock from "./Pages/Stock/Stock";
import Dashboard from "./Pages/Dashboard/Dashboard";
import Invoice from "./Pages/Invoice/Invoice";
import ProductLayout from "./Pages/Products/ProductLayout";
import AllProducts from "./Pages/Products/AllProducts/AllProducts";
import AddProduct from "./Pages/Products/AddProduct";
import ProductDetails from "./Pages/Products/AllProducts/ProductDetails";
import CustomerLayout from "./Pages/Customer/CustomerLayout";
import AccountLayout from "./Pages/Accounts/AccountLayout";
import InvoiceLayout from "./Pages/Invoice/InvoiceLayout";
import AllCustomers from "./Pages/Customer/AllCustomers";
import PaidCustomers from "./Pages/Customer/PaidCustomers";
import DueCustomers from "./Pages/Customer/DueCustomers";
import Partners from "./Pages/Customer/Partners";
import Suppliers from "./Pages/Customer/Suppliers";
import AddMoney from "./Pages/Accounts/AddMoney";
import AddExpense from "./Pages/Accounts/AddExpense";
import AccountsStatus from "./Pages/Accounts/AccountsStatus";
import DraftInvoice from "./Pages/Invoice/DraftInvoice";
import DueInvoice from "./Pages/Invoice/DueInvoice";
import PaidInvoice from "./Pages/Invoice/PaidInvoice";
import DeshboardLayout from "./Pages/Dashboard/DeshboardLayout";
import AdminDeshboard from "./Pages/Dashboard/AdminDeshboard";
import Revenue from "./Pages/Dashboard/Revenue";
import BookDeveloper from "./Pages/Dashboard/BookDeveloper";
import DeshboardOverview from "./Pages/Dashboard/DeshboardOverview";


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
      { path: "/", element: <Home></Home> },
      { path: "/stock-warning", element: <Stock></Stock> },
      {
        path: "/dashboard",
        element: <DeshboardLayout></DeshboardLayout>,
        children: [
          { index: true, element: <Navigate to="admin" replace /> },
          { path: "overview", element: <DeshboardOverview></DeshboardOverview> },
          { path: "admin", element: <AdminDeshboard></AdminDeshboard> },
          { path: "revenue", element: <Revenue></Revenue> },
          { path: "book", element: <BookDeveloper></BookDeveloper> },
        ],
      },

      {
        path: "/customer",
        element: <CustomerLayout></CustomerLayout>,
        children: [
          { index: true, element: <Navigate to="all" replace /> },

          { path: "all", element: <AllCustomers /> },
          { path: "paid", element: <PaidCustomers /> },
          { path: "due", element: <DueCustomers /> },
          { path: "partners", element: <Partners /> },
          { path: "suppliers", element: <Suppliers /> },
        ],
      },
      {
        path: "/accounts",
        element: <AccountLayout></AccountLayout>,
        children: [
          { index: true, element: <Navigate to="add-money" replace /> },

          { path: "add-money", element: <AddMoney /> },
          { path: "add-expense", element: <AddExpense /> },
          { path: "status", element: <AccountsStatus /> },
        ],
      },
      {
        path: "/invoice",
        element: <InvoiceLayout></InvoiceLayout>,
        children: [
          { index: true, element: <Navigate to="invoice" replace /> },

          { path: "invoice", element: <Invoice /> },
          { path: "draft", element: <DraftInvoice /> },
          { path: "due", element: <DueInvoice /> },
          { path: "paid", element: <PaidInvoice /> },
        ],
      },

      {
        path: "/products",
        element: <ProductLayout />,
        children: [
          { index: true, element: <Navigate to="all" replace /> },

          { path: "all", element: <AllProducts /> },
          { path: "add", element: <AddProduct /> },
        ],
      },
      { path: "products/:id", element: <ProductDetails></ProductDetails> },

    ],
  },
]);

export default Route;