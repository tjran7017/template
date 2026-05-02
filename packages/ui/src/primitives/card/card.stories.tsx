import type { Meta, StoryObj } from '@storybook/react'

import { Card, CardBody, CardFooter, CardHeader } from './card'

const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card>
      <CardBody>Card content goes here.</CardBody>
    </Card>
  ),
}

export const WithComposite: Story = {
  render: () => (
    <Card>
      <CardHeader>제목</CardHeader>
      <CardBody>본문 내용이 들어가는 영역입니다.</CardBody>
      <CardFooter>하단 액션 영역</CardFooter>
    </Card>
  ),
}

export const BodyOnly: Story = {
  render: () => (
    <Card>
      <CardBody>Header / Footer 없이 Body만 사용하는 경우입니다.</CardBody>
    </Card>
  ),
}

export const HeaderAndBody: Story = {
  render: () => (
    <Card>
      <CardHeader>알림 설정</CardHeader>
      <CardBody>이메일 및 푸시 알림을 설정합니다.</CardBody>
    </Card>
  ),
}
