import { useEffect, useState } from 'react'

export default function usePromise<Value = any, Err = Error>(
  factory: (params: { cancel: boolean }) => Promise<Value | undefined>,
  deps: any[],
): [finished: boolean, result: Value | undefined, error: Err | undefined] {
  const [finished, setFinished] = useState<boolean>(false)
  const [result, setResult] = useState<Value | undefined>(undefined)
  const [error, setError] = useState<Err | undefined>(undefined)

  useEffect(() => {
    setFinished(false)
    setResult(undefined)
    setError(undefined)

    const params = {
      cancel: false,
    }

    factory(params)
      .then(
        (result) => {
          if (!params.cancel) setResult(result)
        },
        (err: Err) => {
          if (!params.cancel) setError(err)
        },
      )
      .finally(() => {
        if (!params.cancel) setFinished(true)
      })

    return () => {
      params.cancel = true
    }
  }, deps)

  return [finished, result, error]
}
