import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useLocalStorage<T>(key: string, initialValue: T) {
  return useQuery({
    queryKey: ['localStorage', key],
    queryFn: () => {
      try {
        const item = window.localStorage.getItem(key)
        return item ? JSON.parse(item) : initialValue
      } catch {
        return initialValue
      }
    },
    staleTime: Infinity,
    initialData: initialValue,
  })
}

export function useSetLocalStorage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => {
      window.localStorage.setItem(key, JSON.stringify(value))
      return Promise.resolve()
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['localStorage', key] })
    },
  })
}
