import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始创建测试数据...')

  // 1. 创建测试用户
  const passwordHash = await bcrypt.hash('admin123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: passwordHash
    }
  })
  console.log('✅ 用户创建成功:', user.email)

  // 2. 创建工作空间
  const workspace = await prisma.workspace.upsert({
    where: { id: 'default-workspace' },
    update: {},
    create: {
      id: 'default-workspace',
      name: '默认工作空间',
      ownerId: user.id
    }
  })
  console.log('✅ 工作空间创建成功:', workspace.name)

  // 3. 创建知识库
  const kb1 = await prisma.knowledgeBase.create({
    data: {
      name: 'AI Prompt 最佳实践',
      description: '收集和整理各种AI Prompt的最佳实践方法，帮助您更好地使用AI工具。',
      coverImage: '',
      tags: JSON.stringify(['AI', 'Prompt', '最佳实践']),
      fileCount: 0,
      collaborators: JSON.stringify([user.id]),
      workspaceId: workspace.id
    }
  })
  console.log('✅ 知识库1创建成功:', kb1.name)

  const kb2 = await prisma.knowledgeBase.create({
    data: {
      name: '产品设计文档',
      description: '产品设计相关的规范、原则和案例分享。',
      coverImage: '',
      tags: JSON.stringify(['产品', '设计', 'UI/UX']),
      fileCount: 0,
      collaborators: JSON.stringify([user.id]),
      workspaceId: workspace.id
    }
  })
  console.log('✅ 知识库2创建成功:', kb2.name)

  const kb3 = await prisma.knowledgeBase.create({
    data: {
      name: '技术开发规范',
      description: '前端、后端开发规范和最佳实践。',
      coverImage: '',
      tags: JSON.stringify(['开发', '规范', '技术']),
      fileCount: 0,
      collaborators: JSON.stringify([user.id]),
      workspaceId: workspace.id
    }
  })
  console.log('✅ 知识库3创建成功:', kb3.name)

  // 4. 创建文件夹
  const folder1 = await prisma.folder.create({
    data: {
      name: 'Prompt 基础',
      kbId: kb1.id,
      parentId: null
    }
  })
  console.log('✅ 文件夹创建成功:', folder1.name)

  const folder2 = await prisma.folder.create({
    data: {
      name: '高级技巧',
      kbId: kb1.id,
      parentId: null
    }
  })
  console.log('✅ 文件夹创建成功:', folder2.name)

  // 5. 创建文档
  const file1 = await prisma.file.create({
    data: {
      name: 'Prompt 入门指南',
      kbId: kb1.id,
      folderId: folder1.id,
      editorType: 'markdown',
      content: `# Prompt 入门指南

## 什么是 Prompt？

Prompt 是给 AI 模型的指令或提示，它决定了 AI 如何理解和回应你的需求。

## 基本原则

1. **清晰明确**：使用简单直接的语言
2. **提供上下文**：给 AI 足够的背景信息
3. **设定角色**：告诉 AI 它应该扮演什么角色
4. **明确输出格式**：指定你期望的回答形式

## 示例

\`\`\`
你是一位专业的前端开发工程师。
请帮我解释 React Hooks 的工作原理，
用通俗易懂的语言，并配合代码示例。
\`\`\`

## 进阶技巧

- 使用少样本学习（Few-shot Learning）
- 链式思考（Chain of Thought）
- 角色扮演（Role Playing）
`,
      mimeType: 'text/markdown',
      size: 0,
      storageUrl: ''
    }
  })
  console.log('✅ 文档创建成功:', file1.name)

  const file2 = await prisma.file.create({
    data: {
      name: 'CoT 思维链技巧',
      kbId: kb1.id,
      folderId: folder2.id,
      editorType: 'markdown',
      content: `# Chain of Thought (思维链) 技巧

## 什么是 CoT？

思维链是一种让 AI 逐步推理的 Prompt 技巧，通过展示推理过程来提高答案质量。

## 使用方法

在 Prompt 中加入 "让我们一步一步思考" 或类似的引导语。

## 示例

**普通 Prompt：**
> 一个苹果3元，买5个多少钱？

**CoT Prompt：**
> 一个苹果3元，买5个多少钱？让我们一步一步计算：
> 1. 首先确定单价
> 2. 然后乘以数量
> 3. 得出总价

## 效果对比

使用 CoT 后，AI 的回答会更加详细，推理过程更清晰。
`,
      mimeType: 'text/markdown',
      size: 0,
      storageUrl: ''
    }
  })
  console.log('✅ 文档创建成功:', file2.name)

  // 更新知识库文档计数
  await prisma.knowledgeBase.update({
    where: { id: kb1.id },
    data: { fileCount: 2 }
  })

  console.log('\n✅ 所有测试数据创建完成！')
  console.log('\n📝 测试账号信息：')
  console.log('   邮箱: admin@example.com')
  console.log('   密码: admin123')
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

