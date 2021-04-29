const SERVICE_IDENTIFIER = {
  SETTINGS: {
    USE_CASE: {
      FETCH_CONTROLLER_SETTINGS: Symbol(
        'settings.use_cases.fetch_controller_settings'
      ).toString(),
      SAVE_CONTROLLER_SETTINGS: Symbol(
        'settings.use_cases.save_controller_settings'
      ).toString(),
      FETCH_ACTIVE_PDS: Symbol(
        'settings.use_cases.fetch_active_pds'
      ).toString(),
      FETCH_PDS_LIST: Symbol(
        'settings.use_cases.fetch_pds_list'
      ).toString(),
      ACTIVATE_PDS: Symbol(
        'settings.use_cases.activate_pds'
      ).toString()
    },
    REPOSITORY: {
      CONTROLLER_SETTINGS_REPO: Symbol(
        'settings.repositories.controller_settings_repo'
      ).toString(),
      PDS_REPO: Symbol(
        'settings.repositories.pds_repo'
      ).toString()
    }
  }
}

export default SERVICE_IDENTIFIER
