const labelDict : Record<string, string | undefined> = {
  local: 'Local',
  data_vault: 'Data Vault',
  own_your_data: 'Own Your Data'
}

export class PDSDriver {
  type: string
  label: string
  ocaSchemaDri: string

  constructor (type: string, ocaSchemaDri: string) {
    this.type = type
    this.label = labelDict[type] ? labelDict[type] as string : type
    this.ocaSchemaDri = ocaSchemaDri
  }
}
