const SERVICE_IDENTIFIER = {
  SETTINGS: {
    USE_CASE: {
      FETCH_CONTROLLER_SETTINGS: Symbol(
        'settings.use_cases.fetch_controller_settings'
      ).toString(),
      SAVE_CONTROLLER_SETTINGS: Symbol(
        'settings.use_cases.save_controller_settings'
      ).toString()
    },
    REPOSITORY: {
      CONTROLLER_SETTINGS_REPO: Symbol(
        'settings.repositories.controller_settings_repo'
      ).toString()
    }
  }
}

export default SERVICE_IDENTIFIER
