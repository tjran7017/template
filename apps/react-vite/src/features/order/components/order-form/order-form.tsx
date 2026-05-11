import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@repo/ui/button'

import styles from './order-form.module.scss'
import { useCreateOrder } from '@/features/order/api'

const schema = z.object({
  item: z.string().min(1, '품목을 입력하세요').max(100, '품목은 100자 이내'),
  quantity: z.coerce.number().int('정수만 가능').positive('수량은 1 이상'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  onSuccess?: () => void
}

export function OrderForm({ onSuccess }: Props) {
  const { mutate, isPending, error } = useCreateOrder()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { item: '', quantity: 1 },
  })

  const onSubmit = handleSubmit((values) => {
    mutate(values, {
      onSuccess: () => {
        onSuccess?.()
      },
    })
  })

  return (
    <form className={styles.form} onSubmit={(e) => void onSubmit(e)} noValidate>
      <label className={styles.field}>
        <span>품목</span>
        <input
          {...register('item')}
          aria-invalid={errors.item ? true : undefined}
          className={styles.input}
        />
        {errors.item && (
          <span role="alert" className={styles.error}>
            {errors.item.message}
          </span>
        )}
      </label>
      <label className={styles.field}>
        <span>수량</span>
        <input
          type="number"
          min={1}
          {...register('quantity')}
          aria-invalid={errors.quantity ? true : undefined}
          className={styles.input}
        />
        {errors.quantity && (
          <span role="alert" className={styles.error}>
            {errors.quantity.message}
          </span>
        )}
      </label>
      {error && (
        <p role="alert" className={styles.error}>
          주문 생성 실패: {error instanceof Error ? error.message : '알 수 없는 오류'}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" disabled={isPending}>
          {isPending ? '저장 중…' : '저장'}
        </Button>
      </div>
    </form>
  )
}
