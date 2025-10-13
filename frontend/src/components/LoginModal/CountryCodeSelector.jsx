import React from 'react'

const countryCodes = [
  { code: '+86', country: '中国', iso: 'CN' },
  { code: '+1', country: '美国', iso: 'US' },
  { code: '+852', country: '中国香港', iso: 'HK' },
  { code: '+853', country: '中国澳门', iso: 'MO' },
  { code: '+886', country: '中国台湾', iso: 'TW' },
  { code: '+65', country: '新加坡', iso: 'SG' },
  { code: '+60', country: '马来西亚', iso: 'MY' },
  { code: '+66', country: '泰国', iso: 'TH' },
  { code: '+81', country: '日本', iso: 'JP' },
  { code: '+44', country: '英国', iso: 'GB' },
  { code: '+49', country: '德国', iso: 'DE' },
  { code: '+33', country: '法国', iso: 'FR' },
  { code: '+39', country: '意大利', iso: 'IT' },
  { code: '+82', country: '韩国', iso: 'KR' },
  { code: '+61', country: '澳大利亚', iso: 'AU' }
]

export default function CountryCodeSelector({ visible, position, onSelect }) {
  if (!visible) return null

  return (
    <div 
      data-country-selector
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: 16,
        width: '33%',
        maxWidth: '90vw',
        maxHeight: 300,
        overflowY: 'auto',
        zIndex: 1000
      }}
    >
      <div style={{
        fontSize: 16,
        fontWeight: 500,
        marginBottom: 12,
        color: '#1d2129'
      }}>
        选择国家/地区
      </div>
      {countryCodes.map((item) => (
        <div
          key={item.code}
          onClick={() => onSelect(item.code)}
          style={{
            padding: '12px 16px',
            borderRadius: 4,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'background-color 0.2s',
            fontSize: 14
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f2f3f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span style={{ color: '#1d2129' }}>
            {item.country}
          </span>
          <span style={{ color: '#86909c' }}>
            {item.code}
          </span>
        </div>
      ))}
    </div>
  )
}

