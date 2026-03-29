import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import importService, {
  ImportResult,
  DuplicateStrategy
} from '../services/importService'
import toast from 'react-hot-toast'

// Query keys for import operations
export const importKeys = {
  templates: () => ['import', 'templates'] as const,
  history: () => ['import', 'history'] as const,
}

// Get import templates
export const useImportTemplates = () => {
  return useQuery({
    queryKey: importKeys.templates(),
    queryFn: async () => {
      const templates = await importService.getTemplates()
      return templates
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - templates don't change often
    retry: 1,
  })
}

// Get import history
export const useImportHistory = () => {
  return useQuery({
    queryKey: importKeys.history(),
    queryFn: async () => {
      const history = await importService.getImportHistory()
      return history
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  })
}

// Validate CSV mutation
export const useValidateCSV = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<ImportResult> => {
      const result = await importService.validateCSV(file)

      if (!result.success) {
        const errorMessage = result.data?.errors?.length
          ? result.data.errors.slice(0, 3).map(err => err.message).join('; ')
          : result.error || 'CSV validation failed'
        throw new Error(errorMessage)
      }

      // Show warnings if any
      if (result.data?.warnings?.length) {
        toast(`File has ${result.data.warnings.length} warning(s). Ready for import.`)
      }

      return result
    },
    onError: (error: Error) => {
      toast.error(`Validation failed: ${error.message}`)
    },
  })
}

// Preview CSV mutation
export const usePreviewCSV = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<ImportResult> => {
      const result = await importService.previewCSV(file)

      if (!result.success) {
        const errorMessage = result.error || 'CSV preview failed'
        throw new Error(errorMessage)
      }

      return result
    },
    onError: (error: Error) => {
      toast.error(`Preview failed: ${error.message}`)
    },
  })
}

// Import CSV mutation
export const useImportCSV = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      options = {}
    }: {
      file: File
      options?: {
        routeId?: string
        routeName?: string
        duplicateStrategy?: DuplicateStrategy
      }
    }): Promise<ImportResult> => {
      const result = await importService.importCSV(file, {
        duplicateStrategy: DuplicateStrategy.SKIP,
        ...options,
      })

      if (!result.success) {
        const errorMessage = result.data?.errors?.length
          ? result.data.errors.slice(0, 3).map(err => `Row ${err.row}: ${err.message}`).join('; ')
          : result.error || 'Failed to import CSV'
        throw new Error(errorMessage)
      }

      return result
    },
    onSuccess: (result) => {
      // Invalidate import history to show the new import
      queryClient.invalidateQueries({ queryKey: importKeys.history() })

      // Show success message with stats
      if (result.data) {
        const { createdAccounts, updatedAccounts, skippedAccounts } = result.data
        toast.success(
          `Import successful!\nCreated: ${createdAccounts}, Updated: ${updatedAccounts}, Skipped: ${skippedAccounts}`
        )
      } else {
        toast.success('Import completed successfully')
      }
    },
    onError: (error: Error) => {
      toast.error(`Import failed: ${error.message}`)
    },
  })
}

// Download template mutation
export const useDownloadTemplate = () => {
  return useMutation({
    mutationFn: async (filename: string) => {
      await importService.downloadTemplate(filename)
    },
    onSuccess: () => {
      toast.success('Template downloaded successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to download template')
    },
  })
}

// Combined hook for full CSV upload workflow
export const useCSVUpload = () => {
  const validateCSV = useValidateCSV()
  const importCSV = useImportCSV()

  const uploadCSV = useMutation({
    mutationFn: async ({
      file,
      options = {}
    }: {
      file: File
      options?: {
        routeId?: string
        routeName?: string
        duplicateStrategy?: DuplicateStrategy
      }
    }) => {
      // First validate
      const validation = await validateCSV.mutateAsync(file)

      if (!validation.success) {
        throw new Error('Validation failed')
      }

      // Then import
      const importResult = await importCSV.mutateAsync({ file, options })

      return importResult
    },
  })

  return {
    uploadCSV,
    isValidating: validateCSV.isPending,
    isImporting: importCSV.isPending,
    isUploading: uploadCSV.isPending,
    error: uploadCSV.error || validateCSV.error || importCSV.error,
  }
}