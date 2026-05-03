import type { ReactNode } from 'react'
import { Link } from 'react-router'

import styles from './back-link.module.scss'

type Props = {
  href: string
  children: ReactNode
}

export function BackLink({ href, children }: Props) {
  return (
    <Link to={href} className={styles.backLink}>
      <span aria-hidden className={styles.arrow}>
        ←
      </span>
      <span>{children}</span>
    </Link>
  )
}
