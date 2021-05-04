import { Dictionary } from '@/types'

export class Schema {
  dri: string
  name: string
  base: Dictionary
  overlays: Dictionary[]
  translations: Dictionary[]

  constructor (
    { dri, schemaBase, overlays }:
    { dri: string, schemaBase: Dictionary, overlays: Dictionary[] }
  ) {
    this.dri = dri
    this.name = schemaBase.name as string
    this.base = schemaBase
    this.overlays = overlays
    this.translations = this.sortOverlaysByTranslations(overlays)
  }

  private sortOverlaysByTranslations (overlays: Dictionary[]) {
    const sortedOverlays: Dictionary[] = []
    const labelOverlays = overlays.filter(o => (o.type as string).includes('label'))
    const languages = labelOverlays.map(o => o.language as string)
    languages.forEach(lang => {
      sortedOverlays.push({
        language: lang,
        overlays: overlays.filter(o => {
          if (!o.language) { return true }
          return o.language === lang
        })
      })
    })

    return sortedOverlays
  }
}
