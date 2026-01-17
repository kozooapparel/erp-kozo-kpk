# PRD: ERP kozo KPK (Jersey Convection Management)

## 1. Project Overview
A specialized ERP dashboard designed to migrate from manual book-based tracking to a digital workflow for "kozo KPK", a jersey convection business. The system focuses on visual production monitoring, financial gatekeeping, and customer order history.

## 2. Tech Stack
- **Framework**: Next.js (App Router)
- **Database & Auth**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (for Mockups and Payment Proofs)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Reference**: Documentation must prioritize latest standards from Context7.com.

## 3. Core Workflow (11-Stage Kanban)
The dashboard must implement a horizontal-scrolling Kanban board with these exact stages:
1.  **Customer DP Desain**: Initial entry point; requires photo upload of design deposit.
2.  **Proses Desain**: Active design/mockup phase.
3.  **DP Produksi**: Financial gatekeeper; requires 50% production deposit before moving forward.
4.  **Antrean Produksi**: Scheduling queue for confirmed orders.
5.  **Print & Press**: Printing onto paper and heat-pressing to fabric.
6.  **Cutting Bahan**: Pattern cutting phase.
7.  **Jahit**: Assembly phase (Primary bottleneck monitoring point).
8.  **Quality Control**: Post-production inspection and quantity count.
9.  **Packing**: Final packaging.
10. **Pelunasan**: Final financial gatekeeper; requires full payment verification.
11. **Pengiriman**: Shipping phase; requires tracking number (No. Resi) input.

## 4. Feature Specifications
### A. Customer CRM (Simplified)
- **Fields**: Name and Phone Number (No address required).
- **History**: System must auto-recognize repeat customers by Phone Number and display their previous orders and mockups.

### B. Order Data
- **Fields**: Total Quantity (Pcs) and a flexible "Order Description" text area.
- **Visuals**: Each card must display a thumbnail of the mockup once uploaded.

### C. Logic & Safety Rules
- **Gatekeeper System**: Orders are "locked" in 'DP Produksi' and 'Pelunasan' stages until payment is verified by an admin/owner.
- **Bottleneck Alert**: Cards remaining in the "Jahit" column for >3 days must trigger a visual warning (e.g., red border).
- **Permissions**: Two user roles (Owner & Admin). Both have full CRUD (Create, Read, Update, Delete) permissions.

## 5. Visual Requirements
- **Dashboard Layout**: Top bar showing quick metrics (Total Orders, Total Receivables, Bottlenecks).
- **Card Anatomy**: Customer Name, Total Pcs, Deadline, Mockup Thumbnail, and Payment Status Badge.
- **UX**: Search bar for customers/orders and filter by payment status.