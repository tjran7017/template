import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'

import { Card, CardBody, CardFooter, CardHeader } from './card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('renders as a div element', () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.querySelector('div')).toBeInTheDocument()
  })

  it('accepts additional className', () => {
    const { container } = render(<Card className="extra-class">Content</Card>)
    expect(container.querySelector('div')).toHaveClass('extra-class')
  })

  it('passes through HTML attributes', () => {
    render(<Card data-testid="my-card">Content</Card>)
    expect(screen.getByTestId('my-card')).toBeInTheDocument()
  })

  it('renders CardHeader / CardBody / CardFooter', () => {
    render(
      <Card>
        <CardHeader>제목</CardHeader>
        <CardBody>본문</CardBody>
        <CardFooter>하단</CardFooter>
      </Card>,
    )
    expect(screen.getByText('제목')).toBeInTheDocument()
    expect(screen.getByText('본문')).toBeInTheDocument()
    expect(screen.getByText('하단')).toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(
      <Card>
        <CardHeader>Card Title</CardHeader>
        <CardBody>Card content description.</CardBody>
      </Card>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
