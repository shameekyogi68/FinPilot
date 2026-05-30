This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## AI Insights Troubleshooting

### Common Issues & Fixes

- **API key invalid**: Double-check `.env.local` and restart the dev server.
- **CORS error**: OpenRouter does not require CORS setup for server-side calls.
- **Rate limited**: Wait 60 seconds, or rely on fallback insights.
- **AI response too slow**: The service already uses a timeout; show a loading skeleton while waiting.
- **Cache not working**: Check the `ai_cache` table in Supabase.
- **No transactions**: Add test data first.

### Enhancement Ideas

Once basic insights work, consider adding:

1. **Subscription Detection**

```ts
const subscriptions = transactions.filter((t) =>
  t.type === "expense" &&
  t.amount === lastMonthAmount &&
  t.note?.toLowerCase().includes("netflix") ||
  t.note?.toLowerCase().includes("spotify") ||
  t.note?.toLowerCase().includes("subscription")
)
```

2. **Unusual Spending Alerts**

```ts
const unusual = categories.filter((c) =>
  c.amount > previousMonthAvg * 1.5
)
```

3. **Savings Tips**

```ts
const tips = [
  `You spent $${coffeeTotal} on coffee. Making at home saves $${coffeeTotal * 0.7}`,
  `Your subscriptions total $${subscriptionsTotal}. Cancel unused ones.`,
]
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
