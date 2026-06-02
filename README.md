# CampusConnect
# Problem Statement:
Problem: Students often book separate rides or food orders to the same destinations/restaurants, leading to extra cost and wastage.
Challenge/Task: Build a platform for students to share rides and group food orders easily.


A full-stack web application that allows users to create group carts, add/remove items, upload invoices, and checkout. Admins can manage group orders and all users can view their items, totals, and invoices. Includes a real-time group chat integration.

---

## Features

- **Group Management**
  - Create and manage groups.
  - Assign an admin to each group.
  - Members can add items to the group cart.

- **Cart Functionality**
  - Add, update, and remove items.
  - Compute subtotal and total dynamically.
  - Each user sees their own items and total.

- **Invoice Handling**
  - Admins can upload invoice PDFs or images.
  - Invoice items automatically update cart prices.
  - Invoice stored and accessible via link.

- **Checkout**
  - Only admins can checkout.
  - Checkout updates cart and group status to "checkedout".
  - Checkout success page shows order summary and invoice link.

- **Real-time Group Chat**
  - Members can chat in the group.
  - Easy access from cart page.

- **Frontend**
  - Built with React + TailwindCSS.
  - Responsive design for desktop and mobile.

- **Backend**
  - Node.js + Express API.
  - MongoDB with Mongoose for data storage.
  - Multer for invoice uploads.
  - PDF and invoice parsing via custom helpers.

---

## Further extension 
Similar models and API endpoints to be built for shareRide feature enabling chat , retreiving  nearby trips and final fare share split.


