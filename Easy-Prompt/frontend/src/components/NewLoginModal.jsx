// 滑块验证
{showCaptcha && (
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  }}>
    <div style={{
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 8,
      width: 320
    }}>
      <Vertify
        width={320}
        height={160}
        onSuccess={() => {
          Message.success('验证成功')
          setShowCaptcha(false)
        }}
        onFail={() => Message.error('验证失败')}
        onRefresh={() => Message.info('验证码已刷新')}
      />
    </div>
  </div>
)}