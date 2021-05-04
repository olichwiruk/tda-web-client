import { Dictionary } from '@/types'

export class Form {
  uuid: string
  dri: string
  label: string
  sections: Dictionary[]
  translations: Dictionary[]
  type: string

  constructor (
    { uuid, DRI, label, sections, translations, type }:
    { uuid: string, DRI: string, label: string,
      sections: Dictionary[], translations: Dictionary[], type: string }
  ) {
    this.uuid = uuid
    this.dri = DRI
    this.label = label
    this.sections = sections
    this.translations = translations
    this.type = type
  }
}
