# BiblioFlow – Online Bookstore Management System

Course: IMS566 – Advanced Web Design Development and Content Management (Individual Assignment)

BiblioFlow is a website for managing an online bookstore. The admin can log in to view the dashboard, manage books, check customer orders and view sales charts. This website was created using HTML, CSS and JavaScript only. All sample data is stored in JavaScript, so it does not use a database or server.

## How to Test the Login

There is no registration page. The demo account is already filled in on the login page. Just click **Log In** to enter the system.

You can also enter the login details manually:

| Role | Username | Password |
| Admin | `farahiyah` | `fl@W123` |

- If the username or password is wrong, a red error message will appear.
- After two wrong login attempts, a hint will appear.
- Refresh the page to get the demo login details back.
- If you leave the fields empty, a message will ask you to fill them in.
- If you try to open a page such as `dashboard.html` without logging in, the system will send you back to the login page.

## Pages

| File | Description |
|---|---|
| `index.html` | Login page with error messages and a show/hide password button. |
| `dashboard.html` | Shows summary cards, revenue chart, category chart, best-selling books, recent orders and low stock alerts. |
| `books.html` | **Data View 1:** Contains 48 books. Admin can search, filter by category or stock, sort books, switch between table and grid views, use pagination and view book details with a sales chart. Admin can also add, restock and delete books. |
| `orders.html` | **Data View 2:** Contains 260 orders. Admin can use status tabs, search, filters, sort columns, use pagination, view order details, update order status, export data to CSV and print orders. |
| `analytics.html` | Shows 12 types of charts, including bar, line, doughnut, radar, bubble, heatmap and polar area charts. Admin can filter the charts by category and period and view short insights. |

## Features

- Login using a fixed admin account. The login session is saved in `sessionStorage`, and other pages are protected from users who have not logged in.
- The same sidebar and footer are used on every page after login. On mobile devices, the sidebar can slide in from the side.
- Light mode and dark mode.
- Sample data includes 48 books, 40 customers and 260 orders from the past 12 months.
- Orders are dated from December 2025 to 5 November 2026. Use dates within this period when testing the date filter on the Orders page.
- Charts show revenue, category share, stock levels, customer growth, sales by state and busy shopping times.
- Notification bell for new orders, orders that need attention, low stock and new stock.
- Admin can update order status through the order details window using **Mark as Processing**, **Shipped** or **Completed**. A pop-up message will appear after the update.
- Admin can manage books on the Books page:
  - Add new books using a form with input validation and an automatically created SVG cover.
  - Add stock using the +10, +25 or +50 options.
  - Delete books from the list.
  - Summary cards and charts update automatically after changes.
- Pop-up (toast) messages appear to confirm actions.
- Footer includes contact details and pop-up windows for Terms, Privacy, Shipping and Cancellation.
- All images use SVG format, including the logo, favicon, illustrations and book covers. No PNG or JPG files are used.
- Each page has its own `<title>`, meta description and keywords.
- HTML elements include `<header>`, `<main>`, `<section>`, `<article>` and `<footer>`, with ARIA labels for accessibility.
- Number count-up and fade-in animations are included. These animations are turned off when the device has reduced motion enabled.

> **Note:** BiblioFlow is a front-end prototype and does not use a database. Changes such as updating order status, adding books, restocking or deleting books are temporary. When the page is refreshed, the original sample data will return.

## Frameworks / Libraries

- [Bootstrap 5.3](https://getbootstrap.com/) – Used for page layout, components and responsive grid.
- [Bootstrap Icons](https://icons.getbootstrap.com/) – Used for icons.
- [Chart.js 4](https://www.chartjs.org/) – Used to create charts.
- Google Fonts – Playfair Display and Poppins.
- Vanilla JavaScript (ES6), HTML5 and CSS3.

An internet connection is needed because the libraries are loaded from a CDN.

## Project Structure

```text
BiblioFlow/
│
├── index.html
├── dashboard.html
├── books.html
├── orders.html
├── analytics.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── auth.js
│   ├── data.js
│   ├── charts.js
│   └── Other page JavaScript files
│
└── assets/
    ├── logo
    ├── favicon
    └── SVG illustrations and book covers
```

## Running Locally (VS Code)

1. Open the BiblioFlow project folder in Visual Studio Code.
2. Install the **Live Server** extension.
3. Open `index.html` and click **Go Live**.
4. The system will open in your browser. Google Chrome is recommended.
5. To check the mobile layout, press `F12`, then `Ctrl + Shift + M` and select a phone size.

## Deploying to GitHub Pages

1. Create a new repository on GitHub.
2. Upload all project files to the repository. Make sure `index.html` is in the main folder.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder.
6. Click **Save**.
7. Wait for GitHub Pages to publish the website.

Your website will be available at:

`https://<username>.github.io/<repo>/`

## Author

**Nur Farahiyah**  
Student ID: 2025166315  
Course: IMS566  
Year: 2026
