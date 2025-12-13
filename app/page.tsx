import { Button } from '@/components/ui/button'
import Logout from '@/module/auth/components/logout'
import { requireAuth } from '@/module/auth/utils/auth-utils'


const page = async () => {
  await requireAuth()
  return (
    <div className='flex items-center justify-center h-screen'>
      <Logout>
        <Button>Logout</Button>
      </Logout>
    </div>
  )
}

export default page