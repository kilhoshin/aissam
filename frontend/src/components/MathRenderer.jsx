import React from 'react'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

const MathRenderer = ({ content }) => {
  if (!content) return null

  // Split content by math delimiters and render accordingly
  const renderWithMath = (text) => {
    // Handle block math ($$...$$)
    const blockMathRegex = /\$\$(.*?)\$\$/gs
    // Handle inline math ($...$)
    const inlineMathRegex = /\$(.*?)\$/g

    let parts = []
    let lastIndex = 0
    
    // First, handle block math
    text.replace(blockMathRegex, (match, math, offset) => {
      // Add text before math
      if (offset > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, offset)
        })
      }
      
      // Add block math
      parts.push({
        type: 'blockMath',
        content: math.trim()
      })
      
      lastIndex = offset + match.length
      return match
    })
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      })
    }
    
    // Now handle inline math in text parts
    const finalParts = []
    parts.forEach(part => {
      if (part.type === 'text') {
        let textParts = []
        let textLastIndex = 0
        
        part.content.replace(inlineMathRegex, (match, math, offset) => {
          // Add text before math
          if (offset > textLastIndex) {
            textParts.push({
              type: 'text',
              content: part.content.slice(textLastIndex, offset)
            })
          }
          
          // Add inline math
          textParts.push({
            type: 'inlineMath',
            content: math.trim()
          })
          
          textLastIndex = offset + match.length
          return match
        })
        
        // Add remaining text
        if (textLastIndex < part.content.length) {
          textParts.push({
            type: 'text',
            content: part.content.slice(textLastIndex)
          })
        }
        
        finalParts.push(...textParts)
      } else {
        finalParts.push(part)
      }
    })
    
    return finalParts
  }

  const parts = renderWithMath(content)
  
  return (
    <div className="math-content overflow-x-auto">
      {parts.map((part, index) => {
        switch (part.type) {
          case 'blockMath':
            try {
              return (
                <div key={index} className="my-4 text-center overflow-x-auto">
                  <BlockMath math={part.content} />
                </div>
              )
            } catch (error) {
              return (
                <div key={index} className="my-4 p-2 bg-red-100 border border-red-300 rounded text-red-700 break-words">
                  Math Error: {part.content}
                </div>
              )
            }
          case 'inlineMath':
            try {
              return <InlineMath key={index} math={part.content} />
            } catch (error) {
              return (
                <span key={index} className="bg-red-100 text-red-700 px-1 rounded break-all">
                  ${part.content}$
                </span>
              )
            }
          case 'text':
            return (
              <span key={index} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {part.content}
              </span>
            )
          default:
            return null
        }
      })}
    </div>
  )
}

export default MathRenderer
