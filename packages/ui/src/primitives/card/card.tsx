import styles from './card.module.scss'
import { cn } from '../../lib/cn'

interface CardProps extends React.ComponentPropsWithRef<'div'> {}

/**
 * ```tsx
 * <Card>
 *   <CardHeader>제목</CardHeader>
 *   <CardBody>본문 내용</CardBody>
 *   <CardFooter>하단 영역</CardFooter>
 * </Card>
 * ```
 */
export function Card({ className, ref, ...props }: CardProps) {
  return <div ref={ref} className={cn(styles.card, className)} {...props} />
}

export function CardHeader({ className, ref, ...props }: CardProps) {
  return <div ref={ref} className={cn(styles.header, className)} {...props} />
}

export function CardBody({ className, ref, ...props }: CardProps) {
  return <div ref={ref} className={cn(styles.body, className)} {...props} />
}

export function CardFooter({ className, ref, ...props }: CardProps) {
  return <div ref={ref} className={cn(styles.footer, className)} {...props} />
}
