'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function InfoPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    department: '',
    age: '',
    gender: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = '请输入您的姓名'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    sessionStorage.setItem('disc_user_info', JSON.stringify({
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined,
      company: formData.company.trim() || undefined,
      department: formData.department.trim() || undefined,
      age: formData.age ? parseInt(formData.age) : undefined,
      gender: formData.gender || undefined,
    }))
    router.push('/test')
  }

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/" className="p-2 -ml-2 text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 text-center">
          <span className="text-sm font-medium text-slate-500">填写基本信息</span>
        </div>
        <div className="w-9" />
      </div>

      {/* 步骤指示 */}
      <div className="flex items-center gap-2 mb-8">
        <div className="flex-1 h-1 rounded-full bg-slate-800" />
        <div className="flex-1 h-1 rounded-full bg-slate-200" />
        <div className="flex-1 h-1 rounded-full bg-slate-200" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">基本信息</h2>
            <p className="text-xs text-slate-400">带 * 的为必填项</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* 姓名 */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-slate-700">
              姓名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="请输入您的姓名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`h-12 rounded-xl ${errors.name ? 'border-red-400' : ''}`}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* 手机号 */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-slate-700">手机号</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="可选"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="h-12 rounded-xl"
            />
          </div>

          {/* 公司 */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium text-slate-700">公司/组织</Label>
            <Input
              id="company"
              placeholder="可选"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="h-12 rounded-xl"
            />
          </div>

          {/* 部门 */}
          <div className="space-y-2">
            <Label htmlFor="department" className="text-sm font-medium text-slate-700">部门</Label>
            <Input
              id="department"
              placeholder="可选"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="h-12 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 年龄 */}
            <div className="space-y-2">
              <Label htmlFor="age" className="text-sm font-medium text-slate-700">年龄</Label>
              <Input
                id="age"
                type="number"
                placeholder="可选"
                min="1"
                max="150"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="h-12 rounded-xl"
              />
            </div>

            {/* 性别 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">性别</Label>
              <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="可选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">男</SelectItem>
                  <SelectItem value="female">女</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <Button
          onClick={handleSubmit}
          size="lg"
          className="w-full h-14 text-base rounded-2xl bg-gradient-to-r from-slate-800 to-slate-600 hover:from-slate-700 hover:to-slate-500 shadow-lg"
        >
          下一步，开始答题
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  )
}
