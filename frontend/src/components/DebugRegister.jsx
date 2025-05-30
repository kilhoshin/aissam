import React, { useState } from 'react'

export default function DebugRegister() {
  const [result, setResult] = useState('')

  const testRegistration = async () => {
    const testData = {
      name: "테스트 사용자",
      email: "test" + Date.now() + "@example.com",
      password: "test123456",
      grade: "고1"
    }
    
    console.log('Testing with data:', testData)
    
    try {
      const response = await fetch('https://web-production-e0951.up.railway.app/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })
      
      const responseText = await response.text()
      console.log('Response status:', response.status)
      console.log('Response text:', responseText)
      
      setResult(`Status: ${response.status}\nResponse: ${responseText}`)
    } catch (error) {
      console.error('Test failed:', error)
      setResult(`Error: ${error.message}`)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Debug Registration Test</h2>
      <button onClick={testRegistration} style={{ padding: '10px 20px', marginBottom: '20px' }}>
        Test Registration API
      </button>
      
      {result && (
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
          {result}
        </pre>
      )}
    </div>
  )
}
