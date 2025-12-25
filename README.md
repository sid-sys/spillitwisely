# spill it wisely

A full-stack expense sharing application built with Next.js 14 and SQLite.

## Features

- **Expense Tracking**: Add expenses with equal splits among group members.
- **Group Management**: Create groups, add members, and track group balances.
- **Smart Debt Ledger**: Atomic transaction engine that automatically calculates who owes whom.
- **Activity Feed**: Real-time history of all transactions and group updates.
- **Dark Mode UI**: Polished, mobile-first design.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Vanilla CSS, SWR
- **Backend**: Next.js API Routes
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT (Stateless authentication)

## Getting Started

1.  **Install Dependencies**

    ```bash
    npm install
    ```

2.  **Run the Development Server**

    ```bash
    npm run dev
    ```

3.  **Open the App**

    Navigate to [http://localhost:3000](http://localhost:3000).

    *The database will be automatically seeded with demo data (Users: Sidharth, Shahaba, Sruthy, etc.) on the first run.*

## Project Structure

- `src/app`: Next.js pages and API routes
- `src/components`: Reusable UI components
- `src/lib/db`: Database schema and connection logic
- `src/context`: Global state management
- `data/`: SQLite database storage (ignored from git)

## Database Schema

The application uses a normalized SQLite schema:
- `users`: User profiles and settings
- `groups`: Expense groups
- `expenses`: Transaction records
- `expense_splits`: Individual shares of each expense
- `debts`: Running total ledger between users
