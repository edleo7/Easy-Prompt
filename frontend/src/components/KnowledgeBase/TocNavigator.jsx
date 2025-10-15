import React, { useState, useEffect } from 'react'
import { Anchor, Empty } from '@arco-design/web-react'
import { IconBook } from '@arco-design/web-react/icon'

const { Link } = Anchor

export default function TocNavigator({ content, editorType = 'markdown' }) {
  const [headings, setHeadings] = useState([])
  const [activeKey, setActiveKey] = useState('')

  // 解析Markdown标题
  const parseMarkdownHeadings = (text) => {
    if (!text) return []
    
    const lines = text.split('\n')
    const headingsList = []
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/)
      if (match) {
        const level = match[1].length
        const title = match[2].trim()
        const id = `heading-${index}-${title.replace(/\s+/g, '-').toLowerCase()}`
        
        headingsList.push({
          id,
          title,
          level,
          lineNumber: index
        })
      }
    })
    
    return headingsList
  }

  // 解析富文本标题（简化版，实际应该解析HTML）
  const parseRichTextHeadings = (html) => {
    if (!html) return []
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    
    const headingsList = []
    headingElements.forEach((el, index) => {
      const level = parseInt(el.tagName.charAt(1))
      const title = el.textContent.trim()
      const id = `heading-${index}-${title.replace(/\s+/g, '-').toLowerCase()}`
      
      headingsList.push({
        id,
        title,
        level
      })
    })
    
    return headingsList
  }

  // 更新标题列表
  useEffect(() => {
    if (editorType === 'markdown') {
      setHeadings(parseMarkdownHeadings(content))
    } else {
      setHeadings(parseRichTextHeadings(content))
    }
  }, [content, editorType])

  // 构建Anchor数据
  const buildAnchorData = () => {
    const anchorItems = []
    const stack = []

    headings.forEach(heading => {
      const item = {
        key: heading.id,
        href: `#${heading.id}`,
        title: heading.title,
        level: heading.level,
        children: []
      }

      // 找到合适的父节点
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop()
      }

      if (stack.length === 0) {
        anchorItems.push(item)
      } else {
        stack[stack.length - 1].children.push(item)
      }

      stack.push(item)
    })

    return anchorItems
  }

  // 渲染Anchor链接
  const renderAnchorLinks = (items, depth = 0) => {
    return items.map(item => (
      <Link 
        key={item.key} 
        href={item.href} 
        title={item.title}
        style={{
          paddingLeft: depth * 16
        }}
      >
        {item.children.length > 0 && renderAnchorLinks(item.children, depth + 1)}
      </Link>
    ))
  }

  // 滚动到指定标题
  const handleLinkClick = (hash) => {
    const id = hash.replace('#', '')
    const element = document.getElementById(id)
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const anchorData = buildAnchorData()

  return (
    <div style={{ 
      height: '100%', 
      overflowY: 'auto',
      padding: '16px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '1px solid #e5e6eb'
      }}>
        <IconBook style={{ marginRight: 8, color: '#165dff' }} />
        <span style={{ fontWeight: 500, fontSize: 14 }}>目录</span>
      </div>

      {anchorData.length > 0 ? (
        <Anchor
          lineless
          affix={false}
          targetOffset={80}
          onChange={(newLink, oldLink) => {
            setActiveKey(newLink)
          }}
          onClick={handleLinkClick}
          style={{
            fontSize: 13
          }}
        >
          {renderAnchorLinks(anchorData)}
        </Anchor>
      ) : (
        <Empty 
          description="暂无目录"
          style={{ 
            marginTop: 60,
            fontSize: 13
          }}
        />
      )}

      {/* 自定义样式 */}
      <style>{`
        .arco-anchor-link {
          padding: 6px 0;
        }
        .arco-anchor-link-title {
          font-size: 13px;
          color: #4e5969;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .arco-anchor-link-title:hover {
          color: #165dff;
        }
        .arco-anchor-link-active > .arco-anchor-link-title {
          color: #165dff;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}

