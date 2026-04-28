import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '#/orpc/client'
import type { TtsResponse } from '#/orpc/schema'

export function useTtsGenerate(onSuccess?: (data: TtsResponse) => void) {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.generateTts.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['audio'] })
        onSuccess?.(data as TtsResponse)
      },
    })
  )
}
