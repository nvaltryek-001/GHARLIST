<div align="center">

# 🛒 GHARLIST

### Smart Family Shopping Assistant

*Search products, speak your list, adjust quantities, generate a digital report and share it with your family.*

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-gharlist.netlify.app-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://gharlist.netlify.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub-GHARLIST-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/nvaltryek-001/GHARLIST)

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=flat-square&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![React Router](https://img.shields.io/badge/React_Router-Routing-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-State-443E38?style=flat-square)
![Netlify](https://img.shields.io/badge/Deployed_on-Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white)
![Products](https://img.shields.io/badge/Products-5,188+-2E7D32?style=flat-square)
![Voice](https://img.shields.io/badge/Voice-EN_|_HI_|_KN-2E7D32?style=flat-square)
![License](https://img.shields.io/badge/License-Not_specified_yet-lightgrey?style=flat-square)

</div>

---

## 🌐 Live Demo

| Resource | Link |
|---|---|
| 🚀 **Live Website** | [https://gharlist.netlify.app](https://gharlist.netlify.app) |
| 💻 **GitHub Repository** | [https://github.com/nvaltryek-001/GHARLIST](https://github.com/nvaltryek-001/GHARLIST) |

---

## 📖 Overview

**GHARLIST** (*Ghar* = home in Hindi) is a family-focused shopping assistant web application that makes grocery and household shopping simpler. It combines a large, searchable product catalog with a voice-based product search, a persistent shopping list, and a digital shopping report that can be shared with other family members.

With GHARLIST, a user can:

1. Browse a large product catalog.
2. Search products and brands.
3. Filter products by category and brand.
4. Add products to a shopping list.
5. Change shopping quantities.
6. Use voice input to search for products.
7. Select English, Hindi or Kannada voice recognition.
8. Add matched voice-search results to the shopping list.
9. Generate a digital shopping report.
10. View previous shopping reports through history.
11. Share the shopping report/list.
12. Use the application on desktop, tablet and mobile devices.

---

## ❗ Problem Statement

Family shopping can involve manually searching products, remembering quantities and communicating shopping lists.

Lists are often scattered across paper notes, chat messages and memory, which makes it easy to forget items, duplicate purchases or lose track of what was already decided.

## 💡 Solution

GHARLIST provides a simple digital shopping workflow where users can **search products manually or through voice**, **build a list**, **generate a report** and **share it**, all from a clean, mobile-friendly interface that needs no account.

---

## ✨ Key Features

| | Feature | Description |
|---|---|---|
| 🛍️ | **Large Product Catalog** | 5,188+ products across 31 categories and 805 brands, with real product images |
| 🔎 | **Search & Filters** | Search by product or brand; filter by category and brand |
| 📄 | **Product Detail Pages** | Dedicated page for each product |
| 🎤 | **Voice Search** | Speak a product name using browser Speech Recognition |
| 🌍 | **English / Hindi / Kannada** | Manually selectable voice locales (`en-IN`, `hi-IN`, `kn-IN`) |
| ➕ | **Add / Add All** | Add one matched product or all matched voice-search results at once |
| 📝 | **Shopping List** | Add, remove, increase and decrease quantities, with live totals |
| 💾 | **Local Persistence** | List and history are stored in the browser's `localStorage` |
| 🧾 | **Digital Report** | Report with images, quantities, prices, item totals and grand total |
| 🕘 | **Report History** | Previously generated reports available on the History page |
| 📤 | **Sharing** | Copy, WhatsApp, share report image, general share, email and print |
| 📱 | **Responsive UI** | Desktop, laptop, tablet and mobile layouts |
| 🖼️ | **Serverless Image Proxy** | `api/image-proxy.js` handles external product-image requests, with a fallback for unavailable images |

---

## 🧭 User Workflow

### Manual Shopping Flow

```mermaid
flowchart LR
    A[📦 Products] --> B[🔎 Search / Filter]
    B --> C[👆 Select Product]
    C --> D[➕ Add to My List]
    D --> E[🔢 Adjust Quantity]
    E --> F[🧾 Generate Report]
    F --> G[📤 Share]

    style A fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style B fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style C fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style D fill:#C8E6C9,stroke:#2E7D32,color:#1B5E20
    style E fill:#C8E6C9,stroke:#2E7D32,color:#1B5E20
    style F fill:#A5D6A7,stroke:#2E7D32,color:#1B5E20
    style G fill:#A5D6A7,stroke:#2E7D32,color:#1B5E20
```

### Voice Shopping Flow

```mermaid
flowchart LR
    A[🎤 Voice Page] --> B[🌍 Select Language]
    B --> C[🗣️ Speak Product Name]
    C --> D[🧠 Speech Recognition]
    D --> E[📝 Transcript]
    E --> F[🔎 Product Matching]
    F --> G[➕ Add All / Add Product]
    G --> H[📝 My List]
    H --> I[🧾 Generate Report]
    I --> J[📤 Share]

    style A fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style B fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style C fill:#E8F5E9,stroke:#2E7D32,color:#1B5E20
    style D fill:#C8E6C9,stroke:#2E7D32,color:#1B5E20
    style E fill:#C8E6C9,stroke:#2E7D32,color:#1B5E20
    style F fill:#C8E6C9,stroke:#2E7D32,color:#1B5E20
    style G fill:#A5D6A7,stroke:#2E7D32,color:#1B5E20
    style H fill:#A5D6A7,stroke:#2E7D32,color:#1B5E20
    style I fill:#81C784,stroke:#2E7D32,color:#1B5E20
    style J fill:#81C784,stroke:#2E7D32,color:#1B5E20
```

---

## 🏗️ Architecture

GHARLIST is a client-side React application that reads a static product dataset, keeps shopping state in a Zustand store persisted to `localStorage`, and uses a single serverless function to proxy external product images.

```mermaid
flowchart TD
    U([👤 User]) --> FE[⚛️ React Frontend<br/>React 19 + Vite]
    FE --> RR[🧭 React Router]
    RR --> P[📄 Pages<br/>Home · Products · Product Detail · Voice<br/>My List · Report · Share · History · New List]
    P --> SS[⚙️ Services + 🗃️ Zustand Store]
    SS --> DATA[(📦 Static Product Dataset<br/>public/data/*.json)]
    SS --> LS[(💾 Browser localStorage<br/>Shopping List + History)]
    SS --> PROXY[☁️ Serverless Image Proxy<br/>api/image-proxy.js]
    PROXY --> EXT[🖼️ External Product Image Source]

    style U fill:#FFF3E0,stroke:#EF6C00,color:#000
    style FE fill:#E3F2FD,stroke:#1565C0,color:#000
    style RR fill:#E3F2FD,stroke:#1565C0,color:#000
    style P fill:#E8F5E9,stroke:#2E7D32,color:#000
    style SS fill:#E8F5E9,stroke:#2E7D32,color:#000
    style DATA fill:#F3E5F5,stroke:#6A1B9A,color:#000
    style LS fill:#F3E5F5,stroke:#6A1B9A,color:#000
    style PROXY fill:#FFFDE7,stroke:#F9A825,color:#000
    style EXT fill:#ECEFF1,stroke:#546E7A,color:#000
```

### 🧩 Layers at a Glance

| Layer | Responsibility |
|---|---|
| **Pages** (`src/pages`) | One component per route: UI and user interaction |
| **Components** (`src/components`) | Reusable UI: `ProductCard`, `ProductGrid`, `ProductImage` |
| **Services** (`src/services`) | Product loading/search, images, voice, reports, sharing, storage |
| **Store** (`src/store`) | Zustand shopping-list state (`shoppingStore.js`) |
| **Static data** (`public/data`) | Generated JSON catalog, categories, brands and image metadata |
| **Serverless API** (`api`) | `image-proxy.js`, an image proxy compatible with Netlify Functions |

### 🗃️ State Management (Zustand)

The shopping list is managed by a Zustand store in `src/store/shoppingStore.js`, persisted through the browser's `localStorage`.

| State / Action | Purpose |
|---|---|
| `items` | Products currently on the shopping list |
| `addItem` | Add a product to the list |
| `removeItem` | Remove a product from the list |
| `increment` | Increase the shopping quantity |
| `decrement` | Decrease the shopping quantity |
| `setQuantity` | Set an explicit shopping quantity |
| `clearList` | Clear the list (used to start fresh) |
| `totals` | Derived totals (items, units, amount) |

> ### ⚠️ Two different “quantities”
> - **`product.quantity`** → the product's **pack/size information** from the dataset (for example, a pack size shown on the product).
> - **Shopping quantity** → the **number of units the user has selected** on their shopping list.
>
> These are separate concepts and are handled separately in the code and UI.

---

## 🎤 Voice Workflow

GHARLIST's Voice page uses the **browser Speech Recognition API** (`window.SpeechRecognition` or `window.webkitSpeechRecognition`).

**Supported languages / locales**

| Language | Locale |
|---|---|
| 🇬🇧 English | `en-IN` |
| 🇮🇳 Hindi | `hi-IN` |
| 🇮🇳 Kannada | `kn-IN` |

**Current flow**

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Voice as 🎤 Voice Page
    participant Browser as 🌐 Browser Speech Recognition
    participant Match as 🔎 Product Matching
    participant List as 📝 My List

    User->>Voice: Select language (EN / HI / KN)
    User->>Voice: Press microphone & speak
    Voice->>Browser: Start recognition (chosen locale)
    Browser-->>Voice: Transcript
    Voice->>Match: Match transcript against product information
    Match-->>Voice: Matching products
    User->>Voice: Add Product / Add All
    Voice->>List: Add selected products
```

**How it works**

1. The user **selects a language**. Language is chosen manually.
2. The user **presses the microphone** and speaks.
3. The browser's speech recognition produces a **transcript**.
4. GHARLIST **searches/matches** the transcript against product information.
5. Matching products are displayed.
6. The user can **Add Product** or **Add All**.
7. Products appear in **My List**, where quantities are managed.

> **ℹ️ Important:** The current implementation matches the spoken transcript against product information. It does **not** perform automatic language detection, and it does **not** parse full natural-language shopping lists. For example, a sentence such as *"2 kg rice, 1 litre oil and 2 soaps"* is **not** converted into structured quantities. Quantity management currently happens in **My List**.

---

## 🛍️ Product Catalog

The Products page is the main browsing experience.

- **5,188+ products** displayed as image-first **product cards**
- **Real product images** with a fallback for unavailable images
- Product **names, brands and prices**
- **Category filtering** and **brand filtering**
- **Product search** (placeholder: *"Search products, brands..."*)
- **Load More** functionality
- **Product detail navigation**
- **Responsive product grid**

**Filters available:** `All Products` · `All Categories` · `All Brands` · Search · Category filtering · Brand filtering · Load More

> The current UI displays product **price** and does **not** display discount information.

### 🖼️ Image System

GHARLIST uses **real product images** rather than generated placeholder images. The project uses DMart product-image metadata and a serverless image-proxy API (`api/image-proxy.js`). The image system was validated during development, and the application includes real product-image mapping and a fallback for unavailable images.

> External image sources are outside the project's control, so the permanent availability of every external image URL cannot be guaranteed.

---

## 📊 Dataset

The project uses a structured **DMart product dataset**.

| Statistic | Value |
|---|---|
| 🛒 Products | **5,188** |
| 🗂️ Categories | **31** |
| 🏷️ Brands | **805** |

**Fields available in the dataset**

- Product name
- Brand
- Price
- Discounted price *(present in source data; not displayed in the current UI)*
- Category
- Subcategory
- Pack / quantity information
- Description
- Breadcrumbs
- Product image metadata

**Data files**

| File | Description |
|---|---|
| `dataset/DMart.csv` | Original source dataset |
| `public/data/products.json` | Generated product catalog |
| `public/data/categories.json` | Generated category list |
| `public/data/brands.json` | Generated brand list |
| `public/data/product-images.json` | Product image metadata |
| `public/data/dataset-stats.json` | Dataset statistics |

---

## 🧰 Technology Stack

**Frontend**

| Technology | Usage |
|---|---|
| ⚛️ React 19 | UI library |
| ⚡ Vite | Dev server and production build tool |
| 🟨 JavaScript | Application language |
| 🧭 React Router | Client-side routing |
| 🐻 Zustand | Shopping list state management |
| 🎨 CSS | Styling (`src/styles/index.css`) |
| 🔣 Lucide React | Icon set |

**Backend / Serverless**

| Technology | Usage |
|---|---|
| ☁️ Serverless API | Image proxy |
| 📄 `api/image-proxy.js` | Proxies external product-image requests |
| 🟢 Netlify Functions-compatible structure | API layout for serverless deployment |

**Data**

| Technology | Usage |
|---|---|
| 📦 JSON product catalog | Static catalog served from `public/data` |
| 📑 CSV source dataset | Original data in `dataset/DMart.csv` |
| 💾 Browser `localStorage` | Shopping list and report history |

**Deployment**

| Technology | Usage |
|---|---|
| 🐙 GitHub | Source hosting |
| 🌐 Netlify | Hosting and continuous deployment |
| 🏗️ Vite production build | Generates the `dist` directory |

> GHARLIST does not use a traditional backend server, and it does not use MongoDB, MySQL, PostgreSQL, Firebase or Supabase.

---

## 📁 Project Structure

```text
GHARLIST/
│
├── api/
│   └── image-proxy.js            # Serverless image proxy
│
├── dataset/
│   └── DMart.csv                 # Original source dataset
│
├── public/
│   ├── data/
│   │   ├── products.json
│   │   ├── categories.json
│   │   ├── brands.json
│   │   ├── product-images.json
│   │   └── dataset-stats.json
│   ├── images/
│   ├── products/
│   ├── categories/
│   ├── gharlist-icon.svg
│   └── manifest.json
│
├── src/
│   ├── components/
│   │   ├── ProductCard.jsx
│   │   ├── ProductGrid.jsx
│   │   └── ProductImage.jsx
│   │
│   ├── pages/
│   │   ├── History.jsx
│   │   ├── MyList.jsx
│   │   ├── NewList.jsx
│   │   ├── ProductDetail.jsx
│   │   ├── Products.jsx
│   │   ├── Report.jsx
│   │   ├── Share.jsx
│   │   └── Voice.jsx
│   │
│   ├── services/
│   │   ├── imageService.js
│   │   ├── productService.js
│   │   ├── reportImageService.js
│   │   ├── reportService.js
│   │   ├── shareService.js
│   │   ├── storageService.js
│   │   └── voiceService.js
│   │
│   ├── store/
│   │   └── shoppingStore.js
│   │
│   ├── utils/
│   │   └── constants.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── styles/
│       └── index.css
│
├── scripts/
├── reports/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── vercel.json
├── .env.example
└── .gitignore
```

---

## 🧭 Routes

| Route | Page | Purpose |
|---|---|---|
| `/` | **Home** | Landing page and entry point to the main features |
| `/products` | **Products** | Browse, search and filter the product catalog; Load More |
| `/product/:id` | **Product Detail** | View details of a single product and add it to the list |
| `/voice` | **Voice** | Choose a language, speak a product name, review matches, Add Product / Add All |
| `/my-list` | **My List** | Review the shopping list, change quantities, remove items, see totals |
| `/report` | **Report** | Generate a digital report with images, quantities, prices and totals |
| `/share` | **Share** | Share or print the report (copy, WhatsApp, image, general share, email, print) |
| `/history` | **History** | Browse previously generated reports stored in the browser |
| `/new-list` | **New List** | Start a fresh shopping list |

### 📝 Shopping List

- Add a product to the list
- Prevent accidental duplicate product cards
- Increase / decrease quantity
- Remove an item
- Calculate item totals
- Calculate total quantity / items
- Persist the list in browser `localStorage`

### 🧾 Report System

The Report page is generated from the **current shopping list** and provides:

- Selected products with **product images**
- **Quantities** and **prices**
- **Item totals**
- **Total items**, **total units** and **total amount**
- Report generation with **report history integration**
- **Sharing / printing** support

### 📤 Sharing

The project includes share services for:

- 📋 Copy report
- 💬 WhatsApp sharing
- 🖼️ Share report image
- 🔗 General share
- ✉️ Email
- 🖨️ Print

GHARLIST **prepares and shares the content** through supported browser/device capabilities. It does not send messages automatically, and delivery (for example, on WhatsApp) is not guaranteed by the application.

### 🕘 History

Previously generated shopping reports are stored **locally in the browser** and can be reopened from the History page. This is browser/local-storage based and is **not** a cloud-synchronized account history.

### 🆕 New List

New List lets users **start a fresh shopping list**.

---

## 🚀 Installation

**Prerequisites:** [Node.js](https://nodejs.org/) and npm installed.

```bash
# 1. Clone the repository
git clone https://github.com/nvaltryek-001/GHARLIST.git

# 2. Go to the project folder
cd GHARLIST

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

## 🛠️ Development

After running `npm run dev`, Vite normally serves the development application at:

```text
http://localhost:5173
```

Open this address in your browser. The page updates automatically as you edit files.

> 💡 **Voice tip:** Speech Recognition support depends on the browser. Use a browser that supports the Web Speech API and allow microphone access when prompted.

## 📦 Production Build

```bash
# Create an optimized production build
npm run build

# Preview the production build locally
npm run preview
```

- `npm run build` creates the **`dist`** directory.
- `npm run preview` serves the production build locally so you can check it before deploying.

---

## ☁️ Deployment

**Current deployment pipeline:** `GitHub → Netlify`

🌐 **Live:** [https://gharlist.netlify.app](https://gharlist.netlify.app)

```mermaid
flowchart LR
    A[💻 Local Changes] -->|git push| B[🐙 GitHub · main]
    B -->|auto trigger| C[🏗️ Netlify Build<br/>npm run build]
    C --> D[📦 Publish dist/]
    C --> E[⚡ Functions from api/]
    D --> F([🌐 gharlist.netlify.app])
    E --> F

    style B fill:#F3F3F3,stroke:#24292F,color:#000
    style C fill:#E0F7F5,stroke:#00A99D,color:#000
    style F fill:#C8E6C9,stroke:#2E7D32,color:#000
```

**Netlify settings**

| Setting | Value |
|---|---|
| Branch | `main` |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `api` |

**Automatic deployment**

```bash
git add .
git commit -m "Update GHARLIST"
git push
```

After you push to GitHub, Netlify automatically builds and deploys the latest version.

---

## ✅ QA / Testing

GHARLIST was checked with browser-based UI/UX and end-to-end QA runs during development.

| Test Suite | Result |
|---|---|
| Browser UI/UX QA | ✅ **247 PASS** · 0 FAIL |
| Populated Report E2E | ✅ **60 PASS** · 0 FAIL |
| Functional E2E | ✅ **10 PASS** · 0 FAIL |
| Voice E2E | ✅ **14 PASS** · 0 FAIL |
| Production build | ✅ PASS |
| Production preview | ✅ PASS |

**Tested areas**

- 🖥️ Desktop, laptop, tablet and mobile layouts
- 🛍️ Product catalog, search and product selection
- 📝 Shopping list and quantity controls
- 🧾 Report generation and history
- 🎤 Voice recognition, voice product matching and Add All
- 🖼️ Real product images
- 📐 Responsive layout with no horizontal overflow in QA
- 🧹 No critical console, runtime or network errors during the successful QA runs

> These results reflect functional and UI/UX quality checks. They are **not** a formal security audit or a production penetration test.

### 🎨 Design / UI

- Clean and **family-friendly** interface
- **Responsive** and mobile optimized
- **Large, touch-friendly controls**
- **Image-first** product cards
- **Simple shopping workflow**
- **Green / white** visual identity
- Desktop, tablet and mobile support

### 🔒 Security / Privacy Notes

- No user account system is currently required.
- The shopping list and history are stored **locally in the browser**.
- GHARLIST does **not collect passwords**.
- External image requests are handled through the **image proxy** where applicable.
- GHARLIST does not claim enterprise-grade security.

---

## 📸 Screenshots

> Replace the placeholders below with real screenshots. Save images inside the repository and update the paths (for example under `docs/screenshots/` or `reports/browser-uiux/`).

<!--
  HOW TO ADD A SCREENSHOT
  1. Copy the image into your repo (example: reports/browser-uiux/desktop-products.png)
  2. Replace the placeholder row below with:
     <img src="reports/browser-uiux/desktop-products.png" alt="Products" width="100%"/>
  Only use paths that actually exist in the repository.
-->

| 🏠 Home | 🛍️ Products |
|:---:|:---:|
| `Screenshot placeholder` | `Screenshot placeholder` |
| *Add: path to Home screenshot* | *Add: e.g. `reports/browser-uiux/desktop-products.png`* |

| 🎤 Voice | 📝 My List |
|:---:|:---:|
| `Screenshot placeholder` | `Screenshot placeholder` |
| *Add: path to Voice screenshot* | *Add: path to My List screenshot* |

| 🧾 Report | 🕘 History |
|:---:|:---:|
| `Screenshot placeholder` | `Screenshot placeholder` |
| *Add: path to Report screenshot* | *Add: path to History screenshot* |

| 📱 Mobile View |
|:---:|
| `Screenshot placeholder` |
| *Add: path to mobile screenshot* |

---

## 📌 Project Highlights

| Feature | Status |
|---|---|
| Product catalog | ✅ Implemented |
| 5,188 products | ✅ Implemented |
| Product search | ✅ Implemented |
| Category filtering | ✅ Implemented |
| Brand filtering | ✅ Implemented |
| Voice search | ✅ Implemented |
| English voice | ✅ Implemented |
| Hindi voice | ✅ Implemented |
| Kannada voice | ✅ Implemented |
| Shopping list | ✅ Implemented |
| Quantity management | ✅ Implemented |
| Digital report | ✅ Implemented |
| Report history | ✅ Implemented |
| Sharing | ✅ Implemented |
| Responsive UI | ✅ Implemented |
| Serverless image proxy | ✅ Implemented |
| Authentication | ❌ Not implemented |
| Payments | ❌ Not implemented |
| Cloud database | ❌ Not implemented |
| Automatic language detection | 🔮 Future |
| Natural-language quantity extraction | 🔮 Future |

## 🔬 Technical Highlights

- **Large structured product dataset**: 5,188+ products, 31 categories, 805 brands
- **Real product-image mapping** with a fallback for unavailable images
- **Client-side product search and filtering**
- **Browser Speech Recognition API** integration
- **Multi-language voice interface** (English, Hindi, Kannada)
- **Zustand state management** with a clear separation between product pack size and shopping quantity
- **Local persistence** via browser `localStorage`
- **Report generation** with image support
- **Serverless API** for image proxying
- **Responsive React architecture**
- **Automated browser E2E testing**
- **Netlify continuous deployment** from GitHub

---

## ⚠️ Limitations

1. Voice recognition depends on **browser Speech Recognition support**.
2. Voice currently performs **product matching** rather than complete quantity-aware natural-language parsing.
3. The shopping list and history are **browser-local** and are **not synchronized across devices**.
4. **External product image availability may change.**
5. **No authentication / user accounts** currently exist.
6. **No payment / order checkout system** exists.
7. **No cloud database** is currently used for shopping lists.

## 🔮 Future Enhancements

> The items below are **planned ideas only**. They are **not implemented** in the current version.

- 🌐 Automatic language detection
- 🔢 Natural-language quantity extraction
- 👤 User accounts
- ☁️ Cloud synchronization
- 📴 Offline / PWA improvements
- 🎯 More advanced product matching
- 📷 Barcode scanning
- 👨‍👩‍👧‍👦 Family shared lists
- 🤝 Real-time collaboration
- 💰 Shopping budget tracking
- 📍 Store / location integration
- 🤖 Optional AI-assisted shopping list parsing

---

## 💼 Resume Description

> *Built **GHARLIST**, a React-based smart family shopping assistant with a 5,188+ product catalog, multilingual voice product search, persistent shopping lists, digital report generation, sharing functionality, real product-image mapping and serverless image proxy deployment.*

## 🎓 Project Presentation

| | |
|---|---|
| **Problem** | Family shopping can involve manually searching products, remembering quantities and communicating shopping lists. |
| **Solution** | GHARLIST provides a simple digital shopping workflow where users can search products manually or through voice, build a list, generate a report and share it. |

**Target Users**

- 👨‍👩‍👧 Families
- 🧑‍🍼 Parents
- 🎓 Students
- 🏠 Household shoppers
- 🎤 Users who prefer voice-based shopping input

## 🧩 Project Applications

- Weekly grocery planning for a household
- Monthly household-supplies lists
- Sharing a ready-to-shop list with a family member via WhatsApp, email or print
- Hands-free product search in English, Hindi or Kannada
- A reference project for React, Zustand, Speech Recognition API and serverless deployment (college projects, hackathons and portfolios)

---

## 🤝 Contributing

Contributions, suggestions and bug reports are welcome.

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature-name`
5. Open a **Pull Request** on [GitHub](https://github.com/nvaltryek-001/GHARLIST)

You can also open an issue on the repository to report a bug or suggest an improvement.

## 📄 License

**License:** Not specified yet.

## 📬 Contact

| | |
|---|---|
| 💻 **GitHub** | [https://github.com/nvaltryek-001/GHARLIST](https://github.com/nvaltryek-001/GHARLIST) |
| 🌐 **Live** | [https://gharlist.netlify.app](https://gharlist.netlify.app) |

<div align="center">

<br/>

**Made with 💚 for families who shop together.**

⭐ If you like GHARLIST, consider starring the repository!

</div>
