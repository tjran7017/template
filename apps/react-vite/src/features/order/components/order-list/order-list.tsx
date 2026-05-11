import styles from './order-list.module.scss'

interface Order {
  id: string
  item: string
  quantity: number
  createdAt: string
}

interface Props {
  orders: Order[]
}

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

// API에서 온 ISO 문자열이 손상돼도 컴포넌트 전체를 무너뜨리지 않게 가드
function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

export function OrderList({ orders }: Props) {
  if (orders.length === 0) {
    return <p className={styles.empty}>주문 내역이 없습니다.</p>
  }
  return (
    <ul className={styles.list}>
      {orders.map((order) => (
        <li key={order.id} className={styles.row}>
          <span className={styles.item}>
            {order.item} <span className={styles.meta}>× {order.quantity}</span>
          </span>
          <span className={styles.meta}>{formatDate(order.createdAt)}</span>
        </li>
      ))}
    </ul>
  )
}
