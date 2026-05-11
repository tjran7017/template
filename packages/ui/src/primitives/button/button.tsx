import styles from './button.module.scss'
import { cn } from '../../lib/cn'

interface ButtonProps extends React.ComponentPropsWithRef<'button'> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

/**
 * ```tsx
 * <Button variant="primary" onClick={() => console.warn('clicked')}>저장</Button>
 * <Button variant="secondary" size="sm">취소</Button>
 * <Button variant="danger" disabled>삭제</Button>
 * ```
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(styles.button, styles[variant], styles[size], className)}
      {...props}
    />
  )
}
