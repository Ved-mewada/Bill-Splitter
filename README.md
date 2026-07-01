# ExpenseHub 

ExpenseHub is a full-stack expense management app for tracking personal spending and splitting shared costs with groups. It combines a modern Next.js dashboard with Supabase authentication, protected database access, category analytics, and settlement calculations for group expenses.

## Why ExpenseHub?

Managing expenses usually gets messy when personal spending, shared payments, and friend settlements live in different places. ExpenseHub keeps everything in one flow:

- Track your own expenses by amount, category, date, and description.
- Create shared groups for trips, roommates, events, or recurring plans.
- Add friends as local group members even if they do not have an account.
- Log payments for any member and see who paid what.
- Calculate simple settlements so everyone knows who owes whom.
- View spending patterns through category, weekly, and monthly breakdowns.

## Features

| Area | What it does |
| --- | --- |
| Authentication | Email/password signup and login powered by Supabase Auth. |
| Personal expenses | Add, categorize, date, view, analyze, and delete personal expenses. |
| Analytics | See total spend, monthly spend, average spend, top categories, weekly trends, and monthly comparisons. |
| Groups | Create groups, view created and joined groups, and manage shared expense spaces. |
| Local members | Add guest members to groups without requiring every participant to sign up. |
| Group payments | Log payments by member, amount, category, description, and date. |
| Settlements | Automatically calculate who should pay whom to settle group balances. |
| Access control | Supabase Row Level Security keeps user and group data scoped to authorized users. |

## Tech Stack

- **Framework:** Next.js 14 with the App Router
- **Language:** TypeScript
- **UI:** React 18, Tailwind CSS, custom responsive dashboard styling
- **Backend:** Supabase Auth, Supabase Postgres, Row Level Security policies
- **Server logic:** Next.js Server Actions
- **Icons:** Lucide React
- **Fonts:** Manrope, Space Mono, Playfair Display

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- A Supabase project

### 1. Clone and Install

```bash
git clone <your-repository-url>
cd full-stack
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under **API**.

### 3. Set Up the Database

Open the Supabase SQL editor and run the contents of `schema.sql`.

The schema creates:

- User profiles linked to Supabase Auth users
- Personal expense records
- Shared groups and group memberships
- Local guest members
- Group payment logs
- Row Level Security policies for protected access
- Helper functions for safe group access checks

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app redirects to the dashboard and sends unauthenticated users to the login page.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

| Script | Description |
| --- | --- |
| `npm run dev` | Starts the local development server. |
| `npm run build` | Creates a production build. |
| `npm run start` | Runs the production build locally. |
| `npm run lint` | Runs the Next.js lint command. |

## Project Structure

```text
src/
  app/
    actions.ts                    Auth server actions
    dashboard/
      expenses/                   Personal expense dashboard and actions
      groups/                     Group list, group detail pages, and actions
    login/                        Login page
    signup/                       Signup page
  components/
    ExpensesClient.tsx            Personal expense form and list UI
    GroupsClient.tsx              Group creation and group cards
    GroupDetailClient.tsx         Group members, payments, analytics, settlements
    Navigation.tsx                Dashboard navigation
    Footer.tsx                    Shared footer
  utils/
    supabase/                     Browser and server Supabase clients
schema.sql                        Supabase database schema and RLS policies
```

## Data Model Overview

ExpenseHub uses Supabase Postgres with the following core tables:

- `users` stores public profile data for authenticated users.
- `personal_expenses` stores private personal expense entries.
- `shared_groups` stores group expense spaces.
- `group_members` connects authenticated users to groups.
- `group_members_local` stores guest members for easier real-world splitting.
- `group_expense_payments` stores shared payments made by authenticated or local members.

Row Level Security is enabled across the schema so users can only access their own expenses and groups they own or belong to.

## App Flow

1. A user signs up or logs in with Supabase Auth.
2. The dashboard opens on the personal expenses page.
3. Personal expenses can be added with category and date fields.
4. The groups page lets users create shared groups.
5. Inside a group, users can add guest members and log shared payments.
6. ExpenseHub summarizes spending and calculates settlement suggestions.

## Deployment

The app can be deployed on Vercel or any platform that supports Next.js.

Before deploying, add the same Supabase environment variables to your hosting provider:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Then build the app with:

```bash
npm run build
```

## License

This project is currently private and does not include an open-source license.
