import { NextRequest, NextResponse } from 'next/server'

// ============================================
// Evaristo.ai Chat Mediation API
// ============================================

interface MediationRequest {
  content: string
  parental_unit_id: string
  sender_id: string
}

interface MediationResponse {
  original_content: string
  mediated_content: string
  tone: 'positive' | 'neutral' | 'negative'
  should_suggest_rewrite: boolean
}

// System prompt for the AI mediator (in pt-PT)
const MEDIATOR_SYSTEM_PROMPT = `És um mediador familiar em Portugal com mais de 20 anos de experiência. O teu objetivo é ajudar progenitors separados a comunicarem de forma construtiva e focada no interesse superior da criança.

REGRAS DE MEDIAÇÃO:
1. Se a mensagem for tóxica, agressiva ou depreciativa, reescreve-a em português de Portugal (pt-PT) de forma neutra, focada apenas na logística do menor.
2. Se a mensagem for já neutra ou construtiva, mantém o conteúdo original.
3. NUNCA alteres o significado factual - apenas o tom e a forma de expressão.
4. Usa linguagem profissional mas acessível.
5. Foca na resolução de problemas práticos, não em ataques pessoais.

CATEGORIAS DE TOM:
- "positive": mensagem construtiva, respeitosa, focada em solução
- "neutral": mensagem informativa, sem carga emocional significativa
- "negative": mensagem agressiva, crítica, acusatória ou tóxica

EXEMPLOS DE REESCRITA:
- "Tu nunca cumpres o que prometes!" → "Podemos combinar uma hora fixa para a próxima troca?"
- "O filho está contigo etu não me avisas" → "Por favor, podes confirmar a hora da próxima troca?"
- "Isso éridículo, nunca aceito isso" → "Preciso de mais tempo para avaliar esta proposta."

Retorna SEMPRE um JSON com:
{
  "original_content": "mensagem original",
  "mediated_content": "mensagem reescrita (ou original se já neutra)",
  "tone": "positive|neutral|negative",
  "should_suggest_rewrite": boolean (true se tone !== "positive")
}`

export async function POST(request: NextRequest) {
  try {
    const body: MediationRequest = await request.json()
    const { content, parental_unit_id, sender_id } = body

    if (!content || !parental_unit_id || !sender_id) {
      return NextResponse.json(
        { error: 'Missing required fields: content, parental_unit_id, sender_id' },
        { status: 400 }
      )
    }

    // Get Evaristo.ai API key from environment
    const evaristoApiKey = process.env.EVARISTO_API_KEY
    
    if (!evaristoApiKey) {
      // Fallback: simple rule-based mediation if no API key
      const fallbackResult = ruleBasedMediation(content)
      return NextResponse.json(fallbackResult)
    }

    // Call Evaristo.ai API
    const response = await fetch('https://api.evaristo.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${evaristoApiKey}`,
      },
      body: JSON.stringify({
        model: 'evaristo-mediation-v1',
        messages: [
          {
            role: 'system',
            content: MEDIATOR_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: {
          type: 'json_object'
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Evaristo.ai API error:', errorData)
      
      // Fallback to rule-based mediation on API error
      const fallbackResult = ruleBasedMediation(content)
      return NextResponse.json(fallbackResult)
    }

    const data = await response.json()
    const mediationResult = JSON.parse(data.choices[0].message.content) as MediationResponse

    return NextResponse.json(mediationResult)
  } catch (error) {
    console.error('Mediation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================
// RULE-BASED MEDIATION (FALLBACK)
// ============================================

function ruleBasedMediation(content: string): MediationResponse {
  const lowerContent = content.toLowerCase()
  
  // List of toxic/aggressive patterns
  const toxicPatterns = [
    /nunca/i,
    /sempre/i,
    /ridículo/i,
    /estúpido/i,
    /inútil/i,
    /mentiroso/i,
    /egoísta/i,
    /irresponsável/i,
    /maluco/i,
    /idiota/i,
    /desgraçado/i,
    /nojo/i,
    /odia/i,
    /odeio/i,
    /foda/i,
    /caralho/i,
  ]
  
  // Check for toxic patterns
  const hasToxicPattern = toxicPatterns.some(pattern => pattern.test(lowerContent))
  
  // Check for question marks and constructive language
  const isConstructive = /\?/.test(content) || 
    /podemos/i.test(lowerContent) ||
    /poderia/i.test(lowerContent) ||
    /gostaria/i.test(lowerContent) ||
    /preciso/i.test(lowerContent) ||
    /combinar/i.test(lowerContent) ||
    /confirmar/i.test(lowerContent) ||
    /agradeço/i.test(lowerContent)

  let tone: 'positive' | 'neutral' | 'negative'
  let shouldRewrite: boolean
  let mediatedContent = content

  if (hasToxicPattern || (!isConstructive && content.length > 100)) {
    tone = 'negative'
    shouldRewrite = true
    
    // Simple rephrasing for Portuguese
    let rewritten = content
    if (/estúpido/i.test(content)) {
      rewritten = rewritten.replace(/estúpido/gi, 'preciso avaliar melhor esta situação')
    }
    if (/ridículo/i.test(content)) {
      rewritten = rewritten.replace(/ridículo/gi, 'preciso de considerar')
    }
    if (/nunca/i.test(content)) {
      rewritten = rewritten.replace(/nunca/gi, 'por vezes')
    }
    if (/sempre/i.test(content)) {
      rewritten = rewritten.replace(/sempre/gi, 'algumas vezes')
    }
    if (/tu /i.test(content) || /tu,\s/i.test(content)) {
      rewritten = rewritten.replace(/tu /gi, 'podemos ').replace(/tu,/gi, 'podemos,')
    }
    if (/odia/i.test(content) || /odeio/i.test(content)) {
      rewritten = rewritten.replace(/odi[oa]/gi, 'tenho dificuldade em aceitar')
    }
    if (/maluco/i.test(content)) {
      rewritten = rewritten.replace(/maluco/gi, 'preciso de tempo para analisar')
    }
    if (/inútil/i.test(content)) {
      rewritten = rewritten.replace(/inútil/gi, 'não funciona como esperado')
    }
    if (content.includes('!')) {
      rewritten = rewritten.replace(/!/g, '.')
    }
    mediatedContent = rewritten
  } else if (isConstructive) {
    tone = 'positive'
    shouldRewrite = false
  } else {
    tone = 'neutral'
    shouldRewrite = false
  }

  return {
    original_content: content,
    mediated_content: mediatedContent,
    tone,
    should_suggest_rewrite: shouldRewrite,
  }
}