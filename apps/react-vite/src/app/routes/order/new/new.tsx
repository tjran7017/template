import { useNavigate } from 'react-router'

import { Card, CardBody, CardFooter, CardHeader } from '@repo/ui/card'

import { BackLink } from '@/components'
import { OrderForm } from '@/features/order/components'

function OrderNewPage() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    void navigate('/orders')
  }

  return (
    <main className="page-container">
      <Card>
        <CardHeader>
          <h1>주문 생성</h1>
        </CardHeader>
        <CardBody>
          <p>
            <code>react-hook-form + zod</code>로 검증, <code>useMutation</code>으로 제출. 성공 시
            목록 캐시 invalidate + <code>/orders</code>로 navigate.
          </p>
          <OrderForm onSuccess={handleSuccess} />
        </CardBody>
        <CardFooter>
          <BackLink href="/orders">목록</BackLink>
        </CardFooter>
      </Card>
    </main>
  )
}

export { OrderNewPage as Component }
