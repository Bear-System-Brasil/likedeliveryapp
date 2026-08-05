import type { Category } from '@/services/api'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from './use-categories'

interface CategoryFormData {
  name: string
  description: string
}

/**
 * Hook para gerenciar categorias de produtos
 */
export const useCategoryManagement = () => {
  // React Query hooks
  const { data: categories = [], isLoading, refetch } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
  })
  const [searchQuery, setSearchQuery] = useState('')

  /**
   * Categorias filtradas por busca
   */
  const filteredCategories = categories.filter((category: Category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  /**
   * Abre modal para criar categoria
   */
  const handleOpenCreateModal = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      description: '',
    })
    setIsModalOpen(true)
  }

  /**
   * Abre modal para editar categoria
   */
  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
    })
    setIsModalOpen(true)
  }

  /**
   * Fecha o modal e limpa o formulário
   */
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setFormData({
      name: '',
      description: '',
    })
  }

  /**
   * Atualiza campo do formulário
   */
  const updateFormField = (field: keyof CategoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  /**
   * Valida o formulário
   */
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Nome da categoria é obrigatório')
      return false
    }

    if (formData.name.length < 3) {
      toast.error('Nome deve ter pelo menos 3 caracteres')
      return false
    }

    return true
  }

  /**
   * Salva a categoria (criar ou atualizar)
   */
  const handleSaveCategory = async () => {
    if (!validateForm()) return

    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      }

      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          data: categoryData,
        })
      } else {
        await createCategory.mutateAsync(categoryData)
      }

      handleCloseModal()
      refetch()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
    }
  }

  /**
   * Deleta uma categoria
   */
  const handleDeleteCategory = async (category: Category) => {
    const confirm = window.confirm(
      `Deseja realmente deletar a categoria "${category.name}"?\nEsta ação não pode ser desfeita.`
    )
    if (!confirm) return

    try {
      await deleteCategory.mutateAsync(category.id)
      refetch()
    } catch (error) {
      console.error('Erro ao deletar categoria:', error)
    }
  }

  return {
    // Data
    categories: filteredCategories,
    allCategories: categories,
    isLoading,

    // Modal state
    isModalOpen,
    editingCategory,
    formData,

    // Filters
    searchQuery,
    setSearchQuery,

    // Actions
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseModal,
    handleSaveCategory,
    handleDeleteCategory,
    updateFormField,
  }
}
