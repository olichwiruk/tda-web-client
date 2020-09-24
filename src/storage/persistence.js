export function add_consent(context, consent) {
  const allData = JSON.parse(localStorage.getItem('_consents')) || []
  const [contextIndex, contextData] = get_context_index_data(context)

  if(contextIndex === -1) {
    allData.push({
      instanceUuid: context.instanceUuid,
      instanceAgent: context.instanceAgent,
      list: [consent]
    })
  } else {
    contextData.list.push(consent)
    allData[contextIndex] = contextData
  }

  return localStorage.setItem('_consents', JSON.stringify(allData));
}

export function get_consents(context) {
  const contextData = get_context_index_data(context)[1]
  return contextData ? contextData.list : []
}

function get_context_index_data(context) {
  const allData = JSON.parse(localStorage.getItem('_consents')) || []
  const contextIndex = allData.findIndex(el => {
    return el.instanceUuid == context.instanceUuid &&
      el.instanceAgent == context.instanceAgent
  })
  return [contextIndex, allData[contextIndex]]
}
