# FinPilot - Personal Finance Dashboard

A modern, industry-standard personal finance dashboard built with Next.js 16, TypeScript, Prisma, and Tailwind CSS v4.

## Features

- **Dashboard**: Overview of financial metrics, AI-powered insights, expense charts, and recent transactions
- **Transactions**: Add, edit, and categorize income and expenses
- **Budgets**: Create and track monthly budgets with visual progress indicators
- **Goals**: Set and track financial goals with progress visualization
- **Analytics**: Comprehensive spending analytics with charts and breakdowns
- **AI Advisor**: AI-powered financial advice and insights
- **Settings**: Customize profile, currency, and preferences
- **Export**: Export financial data to PDF

## Tech Stack

- **Framework**: Next.js 16.2.6 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 with CSS variables
- **Database**: SQLite with Prisma ORM
- **UI Components**: Radix UI + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **PDF Export**: jsPDF + jsPDF-autotable

## Design System

- **Primary Color**: Terracotta (#E07A5F)
- **Fonts**: Playfair Display (headings), Plus Jakarta Sans (UI), Sora (numbers)
- **Border Radius**: rounded-xl, rounded-2xl
- **Shadows**: Subtle layered shadows
- **No Dark Mode**: Light-only design for consistency

## Environment Variables

### Local Development

Create a `.env.local` file in the project root:

```env
DATABASE_URL="file:./dev.db"
NODE_ENV="development"
```

### Vercel Deployment

The following environment variables are configured in `vercel.json`:

- `DATABASE_URL`: Database connection URL (use Vercel Postgres or external database)
- `NODE_ENV`: Set to `production` automatically

**For Vercel Postgres:**
1. Add a Vercel Postgres database to your project
2. The `DATABASE_URL` will be automatically provided
3. Run migrations on deployment using the build script

**For External Database:**
1. Set `DATABASE_URL` in Vercel project settings
2. Ensure your database is accessible from Vercel's network
3. Run migrations manually or through build script

### Backup & Restore

The app includes automatic backup functionality:
- **Manual Backup**: Use Settings → Backup & Restore to export all data as JSON
- **Automatic Backup**: Vercel cron job runs daily at 2 AM UTC (`/api/cron/backup`)
- **Restore**: Import previously exported JSON backup file

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/shameekyogi68/FinPilot.git
cd FinPilot
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma migrate dev --name init
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NODE_ENV=development
```

## Database

This project uses SQLite with Prisma ORM. The database file is located at `prisma/dev.db`.

### Running Migrations

```bash
npx prisma migrate dev
```

### Regenerating Prisma Client

```bash
npx prisma generate
```

### Viewing Database

```bash
npx prisma studio
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
finpilot/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── transactions/      # Transaction management
│   ├── budgets/           # Budget management
│   ├── goals/             # Goal tracking
│   ├── analytics/         # Analytics page
│   ├── ai-advisor/        # AI advisor
│   └── settings/          # Settings page
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   ├── transactions/      # Transaction components
│   ├── ui/               # UI components (shadcn/ui)
│   └── ai-advisor/        # AI advisor components
├── lib/                   # Utility libraries
│   ├── prisma.ts         # Prisma client
│   ├── utils.ts          # Utility functions
│   ├── env.ts            # Environment validation
│   ├── errors.ts         # Error classes
│   └── logger.ts         # Logging utility
├── hooks/                # Custom React hooks
├── prisma/               # Prisma schema and migrations
└── public/               # Static assets
```

## API Routes

- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/expenses` - Get expense data
- `GET /api/transactions` - Get transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/[id]` - Update transaction
- `DELETE /api/transactions/[id]` - Delete transaction
- `GET /api/budgets` - Get budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/[id]` - Update budget
- `DELETE /api/budgets/[id]` - Delete budget
- `GET /api/goals` - Get goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/[id]` - Update goal
- `DELETE /api/goals/[id]` - Delete goal
- `GET /api/settings/profile` - Get user profile
- `PATCH /api/settings/profile` - Update user profile
- `GET /api/settings/export` - Export data to PDF

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

### Environment Variables for Production

No additional environment variables are required for production. The database is SQLite and will be created during the build process.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is private and proprietary.

## Support

For issues and questions, please contact the development team.
