import { useNavigate } from 'react-router'

import { Button } from '@repo/ui/button'
import { Card, CardBody, CardFooter, CardHeader } from '@repo/ui/card'

import { BackLink } from '@/components'
import { useOrders } from '@/features/order/api'
import { OrderList } from '@/features/order/components'

function OrderListPage() {
  const { data: orders } = useOrders()
  const navigate = useNavigate()

  const handleClickCreate = () => {
    void navigate('/orders/new')
  }

  return (
    <main className="page-container">
      <Card>
        <CardHeader>
          <h1>주문 내역</h1>
        </CardHeader>
        <CardBody>
          <p>
            <code>useSuspenseQuery</code>로 목록 조회. 새 주문은 <code>POST /orders</code> 후{' '}
            <code>queryClient.invalidateQueries</code>로 자동 반영됩니다.
          </p>
          <OrderList orders={orders} />
        </CardBody>
        <CardFooter>
          <Button onClick={handleClickCreate}>주문 생성</Button>
          <BackLink href="/">홈</BackLink>
        </CardFooter>
      </Card>
    </main>
  )
}

export { OrderListPage as Component }
