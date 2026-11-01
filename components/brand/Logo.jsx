import Image from 'next/image'
import { cn } from '@/lib/utils'

export const APP_NAME = 'AI Interview Labs'

const LOGO_SRC = '/AI Interview Labs Mascot Logo.png'
const LOGO_WIDTH = 2172
const LOGO_HEIGHT = 724

const SIZES = {
    sm: 'w-[140px]',
    md: 'w-[170px]',
    lg: 'w-[220px]',
}

// Brand logo (mascot + wordmark). Used everywhere the app shows its name.
function Logo({ size = 'md', className, priority = false }) {
    return (
        <Image
            src={LOGO_SRC}
            alt={APP_NAME}
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            priority={priority}
            className={cn('h-auto', SIZES[size], className)}
        />
    )
}

export default Logo
