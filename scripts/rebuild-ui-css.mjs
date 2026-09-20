import fs from "fs";
import path from "path";

const file = path.join(
  process.cwd(),
  "src/styles/index.css"
);

const css = `
/* =========================================================
   GHARLIST — GLOBAL RESET
========================================================= */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  margin: 0;
  padding: 0;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  padding: 0;
  min-width: 320px;
  background: #f7faf8;
  color: #123c2a;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  -webkit-tap-highlight-color: transparent;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
}


/* =========================================================
   HEADER
========================================================= */

.top-header {
  width: 100%;
  height: 76px;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid #e2ebe6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(14px);
}

.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #087f3f;
  font-size: 21px;
  font-weight: 850;
  letter-spacing: -0.5px;
  white-space: nowrap;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #087f3f;
  color: white;
  font-size: 19px;
  font-weight: 900;
  box-shadow: 0 7px 18px rgba(8, 127, 63, 0.18);
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px;
  border: 1px solid #e1ebe5;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 10px 35px rgba(20, 55, 38, 0.08);
}

.desktop-nav a {
  color: #53645b;
  text-decoration: none;
  font-size: 15px;
  font-weight: 650;
  padding: 10px 13px;
  border-radius: 12px;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.desktop-nav a:hover {
  color: #087f3f;
  background: #edf8f1;
}

.desktop-nav a.active {
  color: #087f3f;
  background: #e7f6ed;
}


/* =========================================================
   MOBILE NAV
========================================================= */

.mobile-nav {
  display: none;
}


/* =========================================================
   PAGE SYSTEM
========================================================= */

.page {
  width: 100%;
  min-height: calc(100vh - 76px);
  padding: 42px 32px 90px;
}

.page > * {
  max-width: 1240px;
  margin-left: auto;
  margin-right: auto;
}


/* =========================================================
   HOME
========================================================= */

.home-page {
  padding: 0;
  min-height: calc(100vh - 76px);
}

.home-page > .hero {
  max-width: none;
  width: 100%;
  min-height: calc(100vh - 76px);
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 78% 35%,
      rgba(75, 190, 124, 0.13),
      transparent 30%
    ),
    radial-gradient(
      circle at 20% 10%,
      rgba(29, 166, 91, 0.09),
      transparent 28%
    ),
    linear-gradient(
      135deg,
      #f4fbf7 0%,
      #ffffff 54%,
      #f1faf5 100%
    );
}

.hero::before {
  content: "";
  position: absolute;
  width: 520px;
  height: 520px;
  right: -150px;
  top: -170px;
  border-radius: 50%;
  background: rgba(14, 143, 72, 0.055);
  pointer-events: none;
}

.hero::after {
  content: "";
  position: absolute;
  width: 360px;
  height: 360px;
  left: -180px;
  bottom: -180px;
  border-radius: 50%;
  background: rgba(14, 143, 72, 0.05);
  pointer-events: none;
}

.hero > div {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 100px 32px;
  position: relative;
  z-index: 1;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 7px 13px;
  border-radius: 999px;
  background: #e3f6eb;
  color: #08783c;
  font-size: 12px;
  line-height: 1;
  font-weight: 850;
  letter-spacing: 0.45px;
}

.hero h1 {
  margin: 22px 0 20px;
  max-width: 720px;
  color: #103d2b;
  font-size: clamp(48px, 6vw, 82px);
  line-height: 0.98;
  letter-spacing: -4px;
  font-weight: 850;
}

.hero h1 span {
  color: #087f3f;
}

.hero p {
  max-width: 660px;
  margin: 0 0 32px;
  color: #5d6f66;
  font-size: 18px;
  line-height: 1.7;
}


/* =========================================================
   BUTTONS
========================================================= */

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 50px;
  padding: 13px 21px;
  border-radius: 15px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.primary-button {
  border: 0;
  background: #07883f;
  color: #ffffff;
  box-shadow: 0 12px 25px rgba(8, 136, 63, 0.18);
}

.primary-button:hover {
  background: #067737;
  transform: translateY(-2px);
  box-shadow: 0 16px 30px rgba(8, 136, 63, 0.24);
}

.secondary-button {
  border: 1px solid #c9ded1;
  background: #ffffff;
  color: #08783c;
}

.secondary-button:hover {
  background: #eef9f2;
}

.primary-button.added {
  background: #126f42;
}


/* =========================================================
   PAGE HEADINGS
========================================================= */

.page-heading {
  margin-bottom: 24px;
}

.page-heading h1 {
  margin: 10px 0 5px;
  font-size: clamp(30px, 4vw, 48px);
  line-height: 1;
  letter-spacing: -1.5px;
  color: #123c2a;
}

.page-heading p {
  margin: 0;
  color: #718078;
}


/* =========================================================
   CATALOG TOOLBAR
========================================================= */

.catalog-toolbar {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 230px 230px;
  gap: 12px;
  align-items: center;
  margin: 24px auto;
}

.catalog-search {
  min-width: 0;
  height: 52px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 15px;
  background: #ffffff;
  border: 1px solid #dbe7e0;
  border-radius: 15px;
  color: #6d7c74;
  box-shadow: 0 5px 20px rgba(28, 64, 46, 0.04);
}

.catalog-search:focus-within {
  border-color: #79c89a;
  box-shadow: 0 0 0 4px rgba(8, 136, 63, 0.07);
}

.catalog-search input {
  flex: 1;
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #183e2d;
}

.catalog-search input::placeholder {
  color: #9aa79f;
}

.catalog-toolbar select {
  width: 100%;
  height: 52px;
  padding: 0 13px;
  border: 1px solid #dbe7e0;
  border-radius: 15px;
  outline: 0;
  background: #ffffff;
  color: #42554b;
  cursor: pointer;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 50%;
  background: #edf5ef;
  color: #3e5d4c;
  cursor: pointer;
}


/* =========================================================
   PRODUCT GRID
========================================================= */

.product-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.product-card {
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #dfe9e3;
  border-radius: 22px;
  box-shadow: 0 8px 24px rgba(24, 63, 43, 0.045);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  border-color: #b9d8c5;
  box-shadow: 0 16px 34px rgba(24, 63, 43, 0.10);
}

.product-image-button {
  display: block;
  width: 100%;
  height: 235px;
  padding: 0;
  border: 0;
  background: #f2f8f4;
  cursor: pointer;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  padding: 22px;
  transition: transform 0.25s ease;
}

.product-card:hover .product-image {
  transform: scale(1.035);
}

.product-image-fallback {
  width: 100%;
  height: 100%;
  min-height: 235px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef8f2;
  color: #087f3f;
}

.product-card-body {
  padding: 18px;
}

.product-brand {
  margin-bottom: 8px;
  color: #07883f;
  font-size: 12px;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.45px;
}

.product-name {
  width: 100%;
  min-height: 48px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #102f23;
  text-align: left;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 750;
  cursor: pointer;
}

.product-quantity {
  margin-top: 11px;
  color: #738078;
  font-size: 13px;
}

.product-card-footer {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.product-card-footer strong {
  color: #103d2b;
  font-size: 19px;
}

.add-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 68px;
  min-height: 40px;
  padding: 8px 14px;
  border: 0;
  border-radius: 12px;
  background: #07883f;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.add-button:hover {
  background: #067737;
}

.add-button.added {
  background: #126f42;
}


/* =========================================================
   FILTER CHIPS
========================================================= */

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.active-filters button {
  border: 1px solid #b9dfc8;
  background: #edf9f1;
  color: #087c3b;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
}


/* =========================================================
   LOAD MORE
========================================================= */

.load-more-wrap {
  display: flex;
  justify-content: center;
  padding: 36px 0 18px;
}

.load-more-button {
  border: 0;
  border-radius: 14px;
  background: #07883f;
  color: white;
  padding: 14px 24px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  gap: 12px;
  align-items: center;
  box-shadow: 0 10px 24px rgba(8, 136, 63, 0.16);
}

.load-more-button:hover {
  background: #067737;
}

.load-more-button span {
  opacity: .78;
  font-weight: 600;
}

.catalog-end {
  text-align: center;
  color: #718078;
  padding: 24px;
}


/* =========================================================
   PRODUCT DETAIL
========================================================= */

.product-detail-page {
  max-width: none !important;
}

.back-button {
  max-width: 1240px;
  margin: 0 auto 24px;
  padding: 0;
  border: 0;
  background: transparent;
  display: flex;
  gap: 8px;
  align-items: center;
  color: #087c3b;
  font-weight: 750;
  cursor: pointer;
}

.product-detail {
  width: 100%;
  max-width: 1240px;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(320px, 1fr);
  gap: 55px;
  margin: 0 auto;
  padding: 34px;
  background: #ffffff;
  border: 1px solid #dfe9e3;
  border-radius: 28px;
  box-shadow: 0 12px 35px rgba(20, 55, 38, 0.06);
}

.detail-image {
  min-height: 480px;
  border-radius: 22px;
  overflow: hidden;
  background: #f2f8f4;
}

.detail-product-image {
  width: 100%;
  height: 480px;
  object-fit: contain;
  padding: 30px;
}

.detail-info {
  padding: 22px 0;
}

.detail-info h1 {
  margin: 10px 0 18px;
  color: #103d2b;
  font-size: clamp(28px, 4vw, 46px);
  line-height: 1.08;
  letter-spacing: -1.5px;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-meta span {
  padding: 8px 12px;
  border-radius: 999px;
  background: #edf7f0;
  color: #496056;
  font-size: 13px;
}

.detail-price {
  margin: 28px 0 18px;
  color: #075f30;
  font-size: 34px;
  font-weight: 850;
}

.detail-description {
  color: #617168;
  line-height: 1.7;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}

.product-reference {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5ebe7;
  color: #7a887f;
  font-size: 13px;
  line-height: 1.9;
}


/* =========================================================
   EMPTY / LOADING
========================================================= */

.loading-state {
  min-height: 50vh;
  display: grid;
  place-items: center;
  color: #087c3b;
  font-weight: 750;
}

.empty-state {
  width: 100%;
  max-width: 700px !important;
  margin: 50px auto !important;
  padding: 55px 30px;
  text-align: center;
  border: 1px dashed #cbdcd1;
  border-radius: 24px;
  background: #ffffff;
}

.empty-state h1,
.empty-state h2 {
  margin: 0 0 10px;
  color: #143d2c;
}

.empty-state p {
  margin: 0 0 22px;
  color: #738078;
}


/* =========================================================
   TABLET
========================================================= */

@media (max-width: 1050px) {

  .top-header {
    padding: 0 24px;
  }

  .desktop-nav a {
    padding: 9px 10px;
  }

  .product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .catalog-toolbar {
    grid-template-columns: 1fr 1fr;
  }

  .catalog-search {
    grid-column: 1 / -1;
  }

  .product-detail {
    gap: 30px;
  }
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 760px) {

  .top-header {
    height: 64px;
    padding: 0 16px;
  }

  .brand-logo {
    font-size: 18px;
  }

  .brand-mark {
    width: 34px;
    height: 34px;
    border-radius: 10px;
  }

  .desktop-nav {
    display: none;
  }

  .mobile-nav {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 200;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding: 7px;
    border: 1px solid #dbe8e0;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 15px 40px rgba(20, 55, 38, 0.14);
    backdrop-filter: blur(16px);
  }

  .mobile-nav a {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 8px 4px;
    border-radius: 13px;
    color: #718078;
    font-size: 10px;
    font-weight: 750;
  }

  .mobile-nav a.active {
    background: #07883f;
    color: #ffffff;
  }

  .page {
    min-height: calc(100vh - 64px);
    padding: 28px 16px 100px;
  }

  .home-page {
    padding: 0;
  }

  .home-page > .hero {
    min-height: calc(100vh - 64px);
  }

  .hero > div {
    padding: 65px 20px 100px;
  }

  .hero h1 {
    font-size: clamp(42px, 13vw, 62px);
    letter-spacing: -2.8px;
  }

  .hero p {
    font-size: 16px;
  }

  .catalog-toolbar {
    display: grid;
    grid-template-columns: 1fr;
  }

  .catalog-search {
    grid-column: auto;
  }

  .catalog-toolbar select {
    width: 100%;
  }

  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .product-image-button {
    height: 170px;
  }

  .product-image {
    padding: 15px;
  }

  .product-card-body {
    padding: 13px;
  }

  .product-name {
    min-height: 44px;
    font-size: 14px;
  }

  .product-card-footer {
    align-items: flex-end;
  }

  .product-card-footer strong {
    font-size: 16px;
  }

  .add-button {
    min-width: 58px;
    min-height: 36px;
    padding: 7px 10px;
    font-size: 12px;
  }

  .product-detail {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 16px;
    border-radius: 20px;
  }

  .detail-image {
    min-height: 320px;
  }

  .detail-product-image {
    height: 320px;
  }

  .detail-info {
    padding: 8px 4px 20px;
  }
}


/* =========================================================
   SMALL PHONES
========================================================= */

@media (max-width: 430px) {

  .product-grid {
    grid-template-columns: 1fr;
  }

  .product-image-button {
    height: 230px;
  }

  .hero h1 {
    font-size: 43px;
  }

  .hero > div {
    padding-left: 16px;
    padding-right: 16px;
  }
}
`;

fs.writeFileSync(file, css, "utf8");

console.log("==============================================");
console.log(" GHARLIST UI CSS REBUILT");
console.log("==============================================");
console.log("✓ Global reset");
console.log("✓ Header");
console.log("✓ Navigation");
console.log("✓ Hero");
console.log("✓ Product cards");
console.log("✓ Product grid");
console.log("✓ Search/filter");
console.log("✓ Product detail");
console.log("✓ Mobile navigation");
console.log("✓ Responsive desktop");
console.log("==============================================");
