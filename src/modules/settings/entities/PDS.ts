const labelDict : Record<string, string | undefined> = {
  local: 'Local',
  data_vault: 'Data Vault',
  own_your_data: 'Own Your Data'
}

export class PDS {
  label: string
  type: string
  name: string
  active: boolean

  constructor ({ type, name, active = false }: { type: string, name: string, active?: boolean }) {
    this.type = type
    this.name = name
    this.active = active

    this.label = labelDict[type] ? labelDict[type] as string : type
  }

  activate () {
    this.active = true
  }

  deactivate () {
    this.active = false
  }
}
