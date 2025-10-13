import React, { useState, useEffect } from 'react';
import { Switch, Select, Button, Message } from '@arco-design/web-react';
import { 
  IconLanguage, 
  IconPalette, 
  IconLock,
  IconSave
} from '@arco-design/web-react/icon';

const Settings = ({ theme, onThemeChange, language, onLanguageChange }) => {
  const [currentTheme, setCurrentTheme] = useState(theme || 'light');
  const [currentLanguage, setCurrentLanguage] = useState(language || 'zh-CN');
  const [privacySettings, setPrivacySettings] = useState({
    shareData: false,
    analytics: true,
    marketingEmails: false
  });

  useEffect(() => {
    setCurrentTheme(theme || 'light');
  }, [theme]);

  useEffect(() => {
    setCurrentLanguage(language || 'zh-CN');
  }, [language]);

  const handleThemeChange = (value) => {
    setCurrentTheme(value);
    if (onThemeChange) {
      onThemeChange(value);
    }
  };

  const handleLanguageChange = (value) => {
    setCurrentLanguage(value);
    if (onLanguageChange) {
      onLanguageChange(value);
    }
  };

  const handlePrivacyChange = (field, value) => {
    setPrivacySettings({
      ...privacySettings,
      [field]: value
    });
  };

  const handleSave = () => {
    // 保存设置的逻辑
    Message.success('设置已保存');
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
        设置
      </h2>
      
      <div style={{ marginBottom: 32 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: 16,
          padding: '12px 0'
        }}>
          <IconLanguage style={{ fontSize: 20, marginRight: 12, color: '#165dff' }} />
          <h3 style={{ fontSize: 18, fontWeight: 500, margin: 0, flex: 1 }}>语言设置</h3>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          padding: '16px 20px',
          background: '#f7f8fa',
          borderRadius: 8
        }}>
          <span style={{ marginRight: 16, minWidth: 80 }}>界面语言</span>
          <Select
            value={currentLanguage}
            onChange={handleLanguageChange}
            style={{ width: 200 }}
          >
            <Select.Option value="zh-CN">简体中文</Select.Option>
            <Select.Option value="en-US">English</Select.Option>
            <Select.Option value="ja-JP">日本語</Select.Option>
          </Select>
        </div>
      </div>
      
      <div style={{ marginBottom: 32 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: 16,
          padding: '12px 0'
        }}>
          <IconPalette style={{ fontSize: 20, marginRight: 12, color: '#165dff' }} />
          <h3 style={{ fontSize: 18, fontWeight: 500, margin: 0, flex: 1 }}>背景设置</h3>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          padding: '16px 20px',
          background: '#f7f8fa',
          borderRadius: 8,
          marginBottom: 12
        }}>
          <span style={{ marginRight: 16, minWidth: 80 }}>主题模式</span>
          <Select
            value={currentTheme}
            onChange={handleThemeChange}
            style={{ width: 200 }}
          >
            <Select.Option value="light">浅色模式</Select.Option>
            <Select.Option value="dark">深色模式</Select.Option>
            <Select.Option value="system">跟随系统</Select.Option>
          </Select>
        </div>
      </div>
      
      <div style={{ marginBottom: 32 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: 16,
          padding: '12px 0'
        }}>
          <IconLock style={{ fontSize: 20, marginRight: 12, color: '#165dff' }} />
          <h3 style={{ fontSize: 18, fontWeight: 500, margin: 0, flex: 1 }}>隐私设置</h3>
        </div>
        
        <div style={{ 
          padding: '16px 20px',
          background: '#f7f8fa',
          borderRadius: 8
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16
          }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>数据共享</div>
              <div style={{ fontSize: 12, color: '#86909c' }}>允许我们使用您的数据来改进产品</div>
            </div>
            <Switch 
              checked={privacySettings.shareData}
              onChange={(value) => handlePrivacyChange('shareData', value)}
            />
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16
          }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>使用分析</div>
              <div style={{ fontSize: 12, color: '#86909c' }}>帮助我们了解如何改进产品</div>
            </div>
            <Switch 
              checked={privacySettings.analytics}
              onChange={(value) => handlePrivacyChange('analytics', value)}
            />
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>营销邮件</div>
              <div style={{ fontSize: 12, color: '#86909c' }}>接收产品更新和营销信息</div>
            </div>
            <Switch 
              checked={privacySettings.marketingEmails}
              onChange={(value) => handlePrivacyChange('marketingEmails', value)}
            />
          </div>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        marginTop: 32
      }}>
        <Button 
          type="primary" 
          icon={<IconSave />}
          onClick={handleSave}
        >
          保存设置
        </Button>
      </div>
    </div>
  );
};

export default Settings;