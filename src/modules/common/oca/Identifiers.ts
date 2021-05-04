const SERVICE_IDENTIFIER = {
  COMMON: {
    OCA: {
      USE_CASE: {
        FETCH_FORM: Symbol(
          'common.oca.use_case.fetch_form'
        ).toString(),
        SAVE_FORMS: Symbol(
          'common.oca.use_case.save_forms'
        ).toString()
      },
      REPOSITORY: {
        SCHEMA_REPO: Symbol(
          'common.oca.repository.schema_repo'
        ).toString(),
        FORM_REPO: Symbol(
          'common.oca.repository.form_repo'
        ).toString()
      }
    }
  }
}

export default SERVICE_IDENTIFIER
