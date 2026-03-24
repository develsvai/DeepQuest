import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className='flex min-h-[calc(100vh-80px)] w-full items-center justify-center bg-muted p-6 md:p-10'>
      <SignIn />
    </div>
  )
}
