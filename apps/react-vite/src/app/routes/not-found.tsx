import { Card, CardBody, CardFooter, CardHeader } from '@repo/ui/card'

import { BackLink } from '@/components'

function NotFoundPage() {
  return (
    <main className="page-container">
      <Card>
        <CardHeader>
          <h1>404</h1>
        </CardHeader>
        <CardBody>
          <p>페이지를 찾을 수 없습니다.</p>
        </CardBody>
        <CardFooter>
          <BackLink href="/">홈</BackLink>
        </CardFooter>
      </Card>
    </main>
  )
}

export { NotFoundPage as Component }
