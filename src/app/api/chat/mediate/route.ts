import { NextRequest, NextResponse } from 'next/server'

// ============================================
// BLACKLISTED WORDS - Filtro de Ruído (pt-PT)
// ============================================

const BLACKLISTED_WORDS = {
  insults: [
    'estúpido', 'estúpida', 'idiota', 'burro', 'burra', 'imbecil', 'retardado', 'retardada',
    'incompetente', 'irresponsável', 'atrasado', 'atrasada', 'mentiroso', 'mentirosa',
    'nojo', 'nojento', 'nojenta', 'desgraçado', 'desgraçada', 'foda', 'caralho',
    'puta', 'porra', 'merda', 'cuzinho', 'cu'
  ],
  threats: [
    'vais pagar', 'vou pagar', 'vou tirar-te', 'tirar o miúdo', 'tirar a criança',
    'vê-mo-nos em tribunal', 'o meu advogado', 'o teu advogado', 'vou processar-te',
    'vou entrar em tribunal', 'tu vais ver', 'há-de pagar', 'há de pagar'
  ],
  possessive: [
    'o meu filho', 'a minha filha', 'o filho é meu', 'a filha é minha'
  ]
}

// ============================================
// Evaristo.ai Chat Mediation API
// ============================================

interface MediationRequest {
  content: string
  parental_unit_id: string
  sender_id: string
}

interface MediationResponse {
  original_content?: string
  mediated_content?: string
  tone?: 'positive' | 'neutral' | 'negative'
  should_suggest_rewrite?: boolean
  confidence_score?: number
  detected_issues?: string[]
  blocked?: boolean
  user_message?: string
  // New format fields
  rewritten_text?: string
  detected_emotion?: string
  is_hostile?: boolean
  mediation_tip?: string
}

// System prompt for the AI mediator (in pt-PT)
const MEDIATOR_SYSTEM_PROMPT = `### ROLE
Atuas como um Especialista em Mediação de Conflitos Familiares, certificado em Portugal. O teu objetivo é atuar como uma membrana neutra entre dois progenitores em processo de separação ou pós-divórcio.

### DIRETIVAS LINGUÍSTICAS (pt-PT)
- Usa exclusivamente Português de Portugal (pt-PT).
- Proibido o uso de gerúndios brasileiros (ex: "estou fazendo"). Usa "estou a fazer".
- Substitui "você" (frio/distante) por omissão de sujeito ou tratamento direto por "tu" (se o tom for construtivo).
- Substitui termos de posse ("meu filho") por termos de projeto comum ("o nosso filho" ou "[Nome]").

### ALGORITMO DE PROCESSAMENTO (Chain of Thought)
1. IDENTIFICAÇÃO: Extrai a necessidade logística (ex: horas, dinheiro, saúde, escola).
2. FILTRAGEM: Remove adjetivos pejorativos, sarcasmo, culpas passadas e ameaças.
3. REESCRITA: Reconstrói a mensagem focando APENAS no futuro e no bem-estar da criança.
4. PONTUAÇÃO: Atribui um 'confidence_score' de 0 a 100 baseado na neutralidade final.

### MATRIZ DE TRANSFORMAÇÃO (Exemplos)
- INPUT: "És um irresponsável, o miúdo chegou com fome!"
- LÓGICA: Facto = Fome/Horário. Ruído = "Irresponsável".
- OUTPUT: "O nosso filho chegou com bastante fome. Podemos ajustar o horário ou o lanche da próxima vez para ele não ficar tanto tempo sem comer?"

- INPUT: "Não vou pagar a escola enquanto não me deixares vê-lo."
- LÓGICA: Facto = Pagamento pendente. Ruído = Chantagem/Ameaça.
- OUTPUT: "Em relação à mensalidade da escola, gostaria que resolvêssemos o pagamento pendente. Podemos também alinhar as próximas visitas para que tudo fique conforme o acordo?"

### FORMATO DE SAÍDA (Obrigatório JSON)
{
  "rewritten_text": "string",
  "confidence_score": number,
  "detected_emotion": "string",
  "is_hostile": boolean
}

REGRA DE OURO: Se confidence_score < 70, não permitir envio automático.`

// ============================================
// Blacklist Check Function
// ============================================

function checkBlacklist(content: string): { blocked: boolean; issues: string[] } {
  const lowerContent = content.toLowerCase()
  const issues: string[] = []
  
  // Check for insults
  for (const insult of BLACKLISTED_WORDS.insults) {
    if (lowerContent.includes(insult)) {
      issues.push(`insulto: ${insult}`)
    }
  }
  
  // Check for threats
  for (const threat of BLACKLISTED_WORDS.threats) {
    if (lowerContent.includes(threat)) {
      issues.push(`ameaça: ${threat}`)
    }
  }
  
  // Check for possessive language
  for (const poss of BLACKLISTED_WORDS.possessive) {
    if (lowerContent.includes(poss)) {
      issues.push(`posse: ${poss}`)
    }
  }
  
  return {
    blocked: issues.length > 0,
    issues
  }
}

// ============================================
// Main POST Handler
// ============================================

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

    // Check blacklist FIRST - before API call
    const blacklistCheck = checkBlacklist(content)
    if (blacklistCheck.blocked) {
      const issueSummary = blacklistCheck.issues.map(i => i.split(': ')[1]).join(', ')
      return NextResponse.json({
        original_content: content,
        mediated_content: 'Esta mensagem não pode ser mediada.',
        tone: 'negative',
        should_suggest_rewrite: false,
        confidence_score: 10,
        blocked: true,
        user_message: `Palavras bloqueadas: ${issueSummary}. Por favor, foca-te no assunto prático e no bem-estar do nosso filho.`,
        detected_issues: blacklistCheck.issues,
        mediation_tip: 'Tenta escrever a mensagem focando-te apenas no que precisas discutir, sem usar palavras negativas.'
      })
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
    let mediationResult = JSON.parse(data.choices[0].message.content) as MediationResponse
    
    // Support both old and new field names
    const confidenceScore = mediationResult.confidence_score || (mediationResult as any).confidence_score || 70
    const rewrittenText = mediationResult.mediated_content || mediationResult.rewritten_text || content
    const detectedEmotion = (mediationResult as any).detected_emotion
    const isHostile = (mediationResult as any).is_hostile
    
    // Generate mediation tip based on detected issues
    let mediationTip = ''
    if (confidenceScore < 70) {
      if (detectedEmotion === 'raiva' || detectedEmotion === 'frustração') {
        mediationTip = 'Parece que a tua mensagem se foca muito no passado. Tenta focar-te apenas no que a criança precisa agora.'
      } else if (isHostile) {
        mediationTip = 'Detetámos um tom que pode dificultar a comunicação. Reformula a mensagem focando-te apenas nos factos.'
      } else {
        mediationTip = 'Parece que a tua mensagem tem bastante carga emocional. Tenta focar-te apenas no que é necessário para a criança.'
      }
    }
    
    // REGRA DE OURO: Se confidence_score < 70, não permitir envio automático
    if (confidenceScore < 70) {
      mediationResult = {
        ...mediationResult,
        original_content: content,
        mediated_content: rewrittenText,
        confidence_score: confidenceScore,
        detected_issues: [...(mediationResult.detected_issues || []), 'confidence_score baixo'],
        blocked: true,
        user_message: 'Detetámos um tom que pode dificultar a comunicação. Por favor, reformula a tua mensagem focando-te apenas nos factos.',
        mediation_tip: mediationTip
      }
    }

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

  // Calculate confidence score based on tone
  const confidenceScore = tone === 'positive' ? 90 : tone === 'neutral' ? 70 : 25
  
  // Generate mediation tip
  let mediationTip = ''
  if (confidenceScore < 70) {
    mediationTip = 'Parece que a tua mensagem se foca muito no passado. Tenta focar-te apenas no que a criança precisa agora.'
  }

  return {
    original_content: content,
    mediated_content: mediatedContent,
    tone,
    should_suggest_rewrite: shouldRewrite,
    confidence_score: confidenceScore,
    detected_issues: hasToxicPattern ? ['palavras potencialmente negativas'] : [],
    mediation_tip: mediationTip
  }
}