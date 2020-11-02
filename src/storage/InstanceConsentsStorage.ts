import InstanceConsents from "./models/InstanceConsents"

export default class InstanceConsentsStorage {
  list: InstanceConsents[];

  constructor() {
    const instanceConsentsStr = localStorage.getItem('_consents')
    const instanceConsents = instanceConsentsStr ? JSON.parse(instanceConsentsStr) : []
    this.list = instanceConsents.map((el: any) => InstanceConsents.deserialize(el))
  }

  add(instanceConsents: InstanceConsents) {
    if (!instanceConsents.isValid()) {
      return { success: false, errors: ['instance consents is invalid']}
    }
    if (this.instanceConsentsExists(instanceConsents.instanceUuid, instanceConsents.instanceAgent)) {
      this.remove(instanceConsents)
    }

    this.list.push(instanceConsents)
    this.persist()
    return { success: true }
  }

  remove(instanceConsents: InstanceConsents) {
    this.list = this.list.filter((el: InstanceConsents) => {
      return (el.instanceUuid != instanceConsents.instanceUuid &&
      el.instanceAgent != instanceConsents.instanceAgent)
    })
    this.persist()
    return { success: true }
  }

  all(): InstanceConsents[] {
    return this.list
  }

  findByInstance(instanceUuid: string, instanceAgent: string) {
    return this.list.find((el: InstanceConsents) => {
      return (el.instanceUuid == instanceUuid &&
        el.instanceAgent == instanceAgent)
    }) || new InstanceConsents(instanceUuid, instanceAgent)
  }

  instanceConsentsExists(instanceUuid: string, instanceAgent: string) {
    return !!this.list.find((el: InstanceConsents) => {
      return (el.instanceUuid == instanceUuid &&
        el.instanceAgent == instanceAgent)
    })
  }

  private persist() {
    localStorage.setItem('_consents', JSON.stringify(this.list))
  }
}
