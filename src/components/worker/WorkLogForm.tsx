"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { cn } from "@/lib/utils";
import { workLogFormSchema, type WorkLogFormValues } from "@/lib/validations/work-log";

interface WorkLogFormProps {
  onSubmit: (data: WorkLogFormValues) => Promise<void>;
  isLoading?: boolean;
  defaultValues?: WorkLogFormValues;
}

// 근무 시간 계산 (분 단위)
function calcDuration(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return "";
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const total = eh * 60 + em - (sh * 60 + sm);
  if (total <= 0) return "";
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

export function WorkLogForm({ onSubmit, isLoading = false, defaultValues }: WorkLogFormProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<WorkLogFormValues | null>(null);

  const form = useForm<WorkLogFormValues>({
    resolver: zodResolver(workLogFormSchema),
    defaultValues: defaultValues ?? {
      workDate: "",
      startTime: "17:00",
      endTime: "22:00",
      roleType: undefined,
      memo: "",
    },
  });

  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");
  const duration = calcDuration(startTime, endTime);

  // 폼 제출 시 확인 다이얼로그 표시
  const handleFormSubmit = (data: WorkLogFormValues) => {
    setPendingData(data);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingData) return;
    setConfirmOpen(false);
    await onSubmit(pendingData);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* 근무일 선택 */}
          <FormField
            control={form.control}
            name="workDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>근무일</FormLabel>
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
                          ? format(new Date(field.value), "yyyy년 M월 d일 (EEE)", { locale: ko })
                          : "날짜를 선택해주세요"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-background border shadow-md"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                      locale={ko}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 시작 시간 / 종료 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>시작 시간</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>종료 시간</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 근무 시간 자동 계산 표시 */}
          {duration && (
            <div className="rounded-md bg-muted px-4 py-2 text-sm">
              <span className="text-muted-foreground">근무 시간: </span>
              <span className="font-medium">{duration}</span>
            </div>
          )}

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

          {/* 메모 */}
          <FormField
            control={form.control}
            name="memo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>메모 (선택)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="근무 내용을 간단히 작성해주세요"
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "제출 중..." : "근무 기록 제출"}
          </Button>
        </form>
      </Form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="근무 기록을 제출하시겠습니까?"
        description="제출 후 관리자 승인을 기다립니다. 승인 전까지 수정 및 삭제가 가능합니다."
        onConfirm={handleConfirm}
        confirmLabel="제출"
        loading={isLoading}
      />
    </>
  );
}
