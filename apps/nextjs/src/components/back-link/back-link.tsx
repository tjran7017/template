import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

import styles from './back-link.module.scss'

type Props = {
  href: ComponentProps<typeof Link>['href']
  children: ReactNode
}

export function BackLink({ href, children }: Props) {
  return (
    <Link href={href} className={styles.backLink}>
      <span aria-hidden className={styles.arrow}>
        ←
      </span>
      <span>{children}</span>
    </Link>
  )
}
