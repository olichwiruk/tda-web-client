import { UseCase } from '@/modules/UseCase'

const handleError = (errorOrMsg: Error | string) => {
  console.log('--------------------------')
  if (typeof errorOrMsg === 'string') {
    console.error(errorOrMsg)
  } else {
    console.error(errorOrMsg.message)
  }
}

export const handler = {
  // eslint-disable-next-line
  apply: function (target: any, thisArgument: any, argumentsList: any) {
    try {
      // eslint-disable-next-line
      return target.apply(thisArgument, argumentsList)
    } catch (e) {
      handleError(e)
    }
  }
}

export const asyncHandler = {
  // eslint-disable-next-line
  apply: async function (target: any, thisArgument: any, argumentsList: any) {
    try {
      // eslint-disable-next-line
      return await target.apply(thisArgument, argumentsList)
    } catch (e) {
      handleError(e)
    }
  }
}

// eslint-disable-next-line
export const useCaseErrorHandler = function (_context: any, useCase: UseCase) {
  if (useCase.call.constructor.name === 'AsyncFunction') {
    // eslint-disable-next-line
    useCase.call = new Proxy(useCase.call, asyncHandler)
  } else {
    // eslint-disable-next-line
    useCase.call = new Proxy(useCase.call, handler)
  }
  return useCase
}
