// ============================================
// PORTUGAL HOLIDAYS 2026
// Reference data (also available in Supabase)
// ============================================

export interface Holiday {
  date: string // DD-MM format
  name: string
  type: 'national' | 'municipal'
}

export const NATIONAL_HOLIDAYS_2026: Holiday[] = [
  { date: '01-01', name: 'Ano Novo', type: 'national' },
  { date: '13-04', name: 'Segunda-feira de Páscoa', type: 'national' },
  { date: '25-04', name: 'Dia da Liberdade', type: 'national' },
  { date: '01-05', name: 'Dia do Trabalho', type: 'national' },
  { date: '10-06', name: 'Dia de Portugal', type: 'national' },
  { date: '15-08', name: 'Assunção de Nossa Senhora', type: 'national' },
  { date: '01-11', name: 'Todos os Santos', type: 'national' },
  { date: '01-12', name: 'Restauração da Independência', type: 'national' },
  { date: '08-12', name: 'Imaculada Conceição', type: 'national' },
  { date: '25-12', name: 'Natal', type: 'national' },
]

export const MUNICIPALITIES = [
  { id: 'aveiro', name: 'Aveiro', holidayDate: '12-05', holidayName: 'Dia do Município' },
  { id: 'beja', name: 'Beja', holidayDate: '19-06', holidayName: 'Dia do Município' },
  { id: 'braga', name: 'Braga', holidayDate: '24-06', holidayName: 'Dia de São João' },
  { id: 'braganca', name: 'Bragança', holidayDate: '22-08', holidayName: 'Dia do Município' },
  { id: 'castelo-branco', name: 'Castelo Branco', holidayDate: '01-04', holidayName: 'Segunda-feira de Páscoa' },
  { id: 'coimbra', name: 'Coimbra', holidayDate: '04-07', holidayName: 'Dia do Município' },
  { id: 'evora', name: 'Évora', holidayDate: '29-06', holidayName: 'Dia do Município' },
  { id: 'faro', name: 'Faro', holidayDate: '07-09', holidayName: 'Dia do Município' },
  { id: 'funchal', name: 'Funchal', holidayDate: '21-08', holidayName: 'Dia do Município' },
  { id: 'guarda', name: 'Guarda', holidayDate: '27-11', holidayName: 'Dia do Município' },
  { id: 'leiria', name: 'Leiria', holidayDate: '22-05', holidayName: 'Dia do Município' },
  { id: 'lisboa', name: 'Lisboa', holidayDate: '13-06', holidayName: 'Dia de Santo António' },
  { id: 'ponta-delgada', name: 'Ponta Delgada', holidayDate: '21-08', holidayName: 'Dia do Município' },
  { id: 'portalegre', name: 'Portalegre', holidayDate: '23-05', holidayName: 'Dia do Município' },
  { id: 'porto', name: 'Porto', holidayDate: '24-06', holidayName: 'Dia de São João' },
  { id: 'santarem', name: 'Santarém', holidayDate: '19-03', holidayName: 'Dia de São José' },
  { id: 'setubal', name: 'Setúbal', holidayDate: '15-09', holidayName: 'Dia do Município' },
  { id: 'viana-castelo', name: 'Viana do Castelo', holidayDate: '20-08', holidayName: 'Dia do Município' },
  { id: 'vila-real', name: 'Vila Real', holidayDate: '13-06', holidayName: 'Dia de Santo António' },
  { id: 'viseu', name: 'Viseu', holidayDate: '21-09', holidayName: 'Dia do Município' },
]

export function getMunicipalityById(id: string) {
  return MUNICIPALITIES.find(m => m.id === id)
}

export function getMunicipalityHoliday(municipalityId: string): Holiday | undefined {
  const municipality = getMunicipalityById(municipalityId)
  if (!municipality) return undefined
  return {
    date: municipality.holidayDate,
    name: municipality.holidayName,
    type: 'municipal',
  }
}

export function isNationalHoliday(date: string): boolean {
  return NATIONAL_HOLIDAYS_2026.some(h => h.date === date)
}

export function isMunicipalHoliday(date: string, municipalityId: string): boolean {
  const municipalHoliday = getMunicipalityHoliday(municipalityId)
  return municipalHoliday?.date === date
}

export function getHolidayForDate(date: string, municipalityId?: string): Holiday | undefined {
  // Check national first
  const national = NATIONAL_HOLIDAYS_2026.find(h => h.date === date)
  if (national) return national
  
  // Then municipal
  if (municipalityId) {
    const municipal = getMunicipalityHoliday(municipalityId)
    if (municipal?.date === date) return municipal
  }
  
  return undefined
}