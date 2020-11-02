export default class Consent {
  label: string;
  ocaSchemaNamespace: string;
  ocaSchemaDri: string;
  dataDri: string;

  constructor(label: string, ocaSchemaNamespace: string, ocaSchemaDri: string, dataDri: string) {
    this.label = label
    this.ocaSchemaNamespace = ocaSchemaNamespace
    this.ocaSchemaDri = ocaSchemaDri
    this.dataDri = dataDri
  }

  static deserialize(json: any) {
    return new Consent(
      json.label, json.ocaSchemaNamespace, json.ocaSchemaDri, json.dataDri
    )
  }

  isValid() {
    if (!this.label || !this.ocaSchemaNamespace || !this.ocaSchemaDri || !this.dataDri) {
      return false
    }
    return true
  }
}
