import { requireAuth } from '@/module/auth/utils/auth-utils'
import { redirect } from 'next/navigation'


const page = async () => {
  await requireAuth()
  return redirect('/dashboard')
}

export default page