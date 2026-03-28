"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { hourlyRateFormSchema, type HourlyRateFormValues } from "@/lib/validations/hourly-rate"

interface HourlyRateFormProps {
  workerId: string
  onSubmit: (data: HourlyRateFormValues) => Promise<void>
  isLoading?: boolean
}

export function HourlyRateForm({ workerId, onSubmit, isLoading = false }: HourlyRateFormProps) {
  const form = useForm<HourlyRateFormValues>({
    resolver: zodResolver(hourlyRateFormSchema),
    defaultValues: {
      workerId,
      roleType: undefined,
      rate: 0,
      effectiveFrom: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* 역할 선택 */}
        <FormField
          control={form.control}
          name="roleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>역할</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="역할을 선택해주세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="assistant">조교</SelectItem>
                  <SelectItem value="coaching">코칭</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 시급 입력 */}
        <FormField
          control={form.control}
          name="rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>시급 (원)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="예: 15000"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 적용 시작일 */}
        <FormField
          control={form.control}
          name="effectiveFrom"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>적용 시작일</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value
                        ? format(new Date(field.value), "yyyy년 M월 d일", { locale: ko })
                        : "날짜를 선택해주세요"}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) =>
                      field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                    }
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "등록 중..." : "시급 등록"}
        </Button>
      </form>
    </Form>
  )
}
