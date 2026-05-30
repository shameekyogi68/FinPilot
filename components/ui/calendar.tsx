"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  mode?: "single" | "range"
  selected?: Date | { from?: Date; to?: Date }
  onSelect?: (date: Date | { from?: Date; to?: Date }) => void
}

export function Calendar({
  className,
  mode = "single",
  selected,
  onSelect,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const days = Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => i + 1)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

  const isDateSelected = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (mode === "single" && selected instanceof Date) {
      return (
        date.getFullYear() === selected.getFullYear() &&
        date.getMonth() === selected.getMonth() &&
        date.getDate() === selected.getDate()
      )
    }
    return false
  }

  const handleDayClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (onSelect) {
      if (mode === "single") {
        onSelect(date)
      } else {
        onSelect({ from: date, to: date })
      }
    }
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" })

  return (
    <div className={cn("p-3", className)} {...props}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">{monthName}</div>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-slate-600">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => (
              <Button
                key={day}
                onClick={() => handleDayClick(day)}
                variant={isDateSelected(day) ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
              >
                {day}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
