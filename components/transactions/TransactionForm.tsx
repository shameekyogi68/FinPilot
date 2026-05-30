"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const expenseCategories: string[] = [
  "food",
  "transport",
  "shopping",
  "bills",
  "subscriptions",
  "entertainment",
  "healthcare",
  "education",
  "travel",
  "miscellaneous",
]

const incomeCategories: string[] = ["salary", "freelance", "gift", "refund", "other"]

export const transactionFormSchema = z.object({
  amount: z
    .preprocess((value) => {
      if (typeof value === "string") {
        return value.trim() === "" ? NaN : Number(value)
      }
      return value
    }, z.number())
    .refine((value) => !Number.isNaN(value), {
      message: "Amount is required",
    })
    .refine((value) => value > 0, {
      message: "Amount must be positive",
    }),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category is required"),
  date: z
    .preprocess(
      (value) => (value instanceof Date ? value : value ? new Date(String(value)) : value),
      z.date()
    )
    .refine((date) => !Number.isNaN(date.getTime()), {
      message: "Date is required",
    }),
  note: z.string().optional(),
})

export type TransactionFormValues = z.infer<typeof transactionFormSchema>

type TransactionFormProps = {
  onSuccess?: () => void
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema) as any,
    defaultValues: {
      amount: undefined,
      type: "expense",
      category: expenseCategories[0],
      date: new Date(),
      note: "",
    },
  })

  const transactionType = watch("type")
  const categoryOptions = transactionType === "expense" ? expenseCategories : incomeCategories

  useEffect(() => {
    const currentCategory = getValues("category") as string
    if (!categoryOptions.includes(currentCategory as typeof categoryOptions[number])) {
      setValue("category", categoryOptions[0], { shouldValidate: true })
    }
  }, [transactionType, categoryOptions, getValues, setValue])

  const onSubmit = async (values: TransactionFormValues) => {
    const payload = {
      amount: values.amount,
      type: values.type,
      category: values.category,
      date: values.date.toISOString(),
      note: values.note?.trim() || null,
    }

    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      toast.error(json.error || "Unable to add transaction")
      return
    }

    toast.success("Transaction added")
    reset({
      amount: undefined,
      type: values.type,
      category: categoryOptions[0],
      date: new Date(),
      note: "",
    })

    onSuccess?.()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-3xl border border-border bg-background p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount?.message ? (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={watch("type")}
            onValueChange={(value) => setValue("type", value as "income" | "expense")}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="category">Category</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category?.message ? (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register("date", { valueAsDate: true })} />
          {errors.date?.message ? (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Note</Label>
          <Input id="note" type="text" placeholder="Optional note" {...register("note")} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          Add transaction
        </Button>
      </div>
    </form>
  )
}
