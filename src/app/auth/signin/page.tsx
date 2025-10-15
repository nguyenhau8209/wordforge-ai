"use client"

import { signIn, getSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"

export default function SignIn() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push("/dashboard")
      }
    })
  }, [router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-bold">WordForge AI</CardTitle>
          <CardDescription>
            Đăng nhập để bắt đầu học từ vựng thông minh
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập với Google"}
          </Button>
          
          <div className="text-center text-sm text-gray-500">
            Bằng cách đăng nhập, bạn đồng ý với{" "}
            <a href="#" className="text-indigo-600 hover:underline">
              Điều khoản sử dụng
            </a>{" "}
            và{" "}
            <a href="#" className="text-indigo-600 hover:underline">
              Chính sách bảo mật
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
