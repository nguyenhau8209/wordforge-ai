"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Brain, Target, Zap } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">WordForge AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">Xin chào, {session.user?.name}</span>
                  <Button variant="outline" onClick={() => signOut()}>
                    Đăng xuất
                  </Button>
                  <Link href="/dashboard">
                    <Button>Dashboard</Button>
                  </Link>
                </div>
              ) : (
                <Button onClick={() => signIn("google")}>
                  Đăng nhập với Google
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Học từ vựng thông minh với{" "}
            <span className="text-indigo-600">AI</span>
          </h2>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Tạo flashcard tự động, hệ thống lặp lại ngắt quãng và các bài kiểm tra tương tác 
            để mở rộng vốn từ vựng một cách hiệu quả.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  Bắt đầu học ngay
                </Button>
              </Link>
            ) : (
              <Button size="lg" onClick={() => signIn("google")} className="w-full sm:w-auto">
                Đăng nhập để bắt đầu
              </Button>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <CardHeader>
                <Brain className="h-12 w-12 text-indigo-600 mx-auto" />
                <CardTitle>AI Flashcard Forge</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Nhập một từ vựng, hệ thống tự động tạo flashcard đầy đủ với định nghĩa, 
                  phát âm, câu ví dụ và hình ảnh minh họa.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Target className="h-12 w-12 text-indigo-600 mx-auto" />
                <CardTitle>Hệ thống SRS</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Tự động lên lịch ôn tập dựa trên mức độ ghi nhớ của bạn 
                  để tối ưu hóa quá trình học.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Zap className="h-12 w-12 text-indigo-600 mx-auto" />
                <CardTitle>Luyện tập & Kiểm tra</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Các bài quiz đa dạng với trắc nghiệm và điền từ 
                  để củng cố kiến thức.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-indigo-600 mx-auto" />
                <CardTitle>Dashboard Tiến độ</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Thống kê trực quan về quá trình học của bạn 
                  với biểu đồ và báo cáo chi tiết.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
