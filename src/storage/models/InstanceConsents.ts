import Consent from './Consent'

export default class InstanceConsents {
  instanceUuid: string;
  instanceAgent: string;
  list: Consent[];

  constructor(instanceUuid: string, instanceAgent: string, list: Consent[] = []) {
    this.instanceUuid = instanceUuid
    this.instanceAgent = instanceAgent
    this.list = list
  }

  static deserialize(json: any) {
    return new InstanceConsents(
      json.instanceUuid, json.instanceAgent,
      json.list.map((el: any) => Consent.deserialize(el))
    )
  }

  addConsent(consent: Consent) {
    if (!consent.isValid()) {
      return { success: false, errors: ['consent is invalid']}
    }
    if (this.list.find(el => el.label == consent.label)) {
      return { success: false, errors: [`consent with '${consent.label}' label already exists`]}
    }

    this.list.push(consent)
    return { success: true }
  }

  isValid() {
    if (!this.list || !this.instanceAgent) { return false }
    return true
  }
}
