import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import {
  Home as HomeIcon,
  Search,
  ShoppingCart,
  History as HistoryIcon,
  Mic
} from "lucide-react";

import Products from "./pages/Products.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Voice from "./pages/Voice.jsx";
import MyList from "./pages/MyList.jsx";
import Report from "./pages/Report.jsx";
import Share from "./pages/Share.jsx";
import History from "./pages/History.jsx";
import NewList from "./pages/NewList.jsx";

function Header() {
  return (
    <>
      <header className="top-header">
        <NavLink to="/" className="brand-logo">
          <span className="brand-mark">G</span>
          <span>GHARLIST</span>
        </NavLink>

        <nav className="desktop-nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/voice">Voice</NavLink>
          <NavLink to="/my-list">My List</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
      </header>

      <nav className="mobile-nav">
        <NavLink to="/" end>
          <HomeIcon size={21} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/products">
          <Search size={21} />
          <span>Products</span>
        </NavLink>

        <NavLink to="/voice">
          <Mic size={21} />
          <span>Voice</span>
        </NavLink>

        <NavLink to="/my-list">
          <ShoppingCart size={21} />
          <span>My List</span>
        </NavLink>

        <NavLink to="/history">
          <HistoryIcon size={21} />
          <span>History</span>
        </NavLink>
      </nav>
    </>
  );
}

function Home() {
  return (
    <main className="page home-page">
      <section className="hero">
        <div>
          <span className="eyebrow">
            SMART FAMILY SHOPPING
          </span>

          <h1>
            Your family list.
            <br />
            <span>Made simple.</span>
          </h1>

          <p>
            Search 5,188 products, build your list,
            or shop using your voice.
          </p>

          <div className="hero-actions">
            <NavLink
              to="/products"
              className="primary-button"
            >
              Browse Products
            </NavLink>

            <NavLink
              to="/voice"
              className="secondary-button"
            >
              <Mic size={18} />
              Shop by Voice
            </NavLink>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/product/:id"
          element={<ProductDetail />}
        />

        <Route
          path="/voice"
          element={<Voice />}
        />

        <Route
          path="/my-list"
          element={<MyList />}
        />

        <Route
          path="/report"
          element={<Report />}
        />

        <Route
          path="/share"
          element={<Share />}
        />

        <Route
          path="/history"
          element={<History />}
        />

        <Route
          path="/new-list"
          element={<NewList />}
        />

        <Route
          path="*"
          element={<Home />}
        />
      </Routes>
    </BrowserRouter>
  );
}
