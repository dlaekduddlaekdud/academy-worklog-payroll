"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { rejectionReasonSchema, type RejectionReasonValues } from "@/lib/validations/rejection"

interface RejectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  loading?: boolean
}

export function RejectionDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: RejectionDialogProps) {
  const form = useForm<RejectionReasonValues>({
    resolver: zodResolver(rejectionReasonSchema),
    defaultValues: { reason: "" },
  })

  const handleSubmit = (data: RejectionReasonValues) => {
    onConfirm(data.reason)
    form.reset()
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) form.reset()
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>근무 기록 반려</DialogTitle>
          <DialogDescription>
            반려 사유를 입력해주세요. 근무자에게 표시됩니다.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>반려 사유</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="반려 사유를 입력해주세요"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                취소
              </Button>
              <Button type="submit" variant="destructive" disabled={loading}>
                {loading ? "처리 중..." : "반려 처리"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
