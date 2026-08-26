import type { Product } from "@/services/api";
import { apiService } from "@/services/api";
import { useAuthStore } from "@/stores";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useCategories } from "./use-categories";
import {
  useCompanyProducts,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from "./use-products";

interface ProductFormData {
  name: string;
  description: string;
  costPrice: number | undefined;
  salePrice: number | undefined;
  categoryId: string;
  imageURL: string[];
  available: boolean;
  stockQuantity: number | undefined;
}

/**
 * Hook para gerenciar menu/produtos da empresa
 */
export const useMenuManagement = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // React Query hooks
  const {
    data: products = [],
    isLoading: loadingProducts,
    refetch,
  } = useCompanyProducts(user?.companyId || user?.id || null);
  const { data: categories = [], isLoading: loadingCategories } =
    useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    costPrice: undefined,
    salePrice: undefined,
    categoryId: "",
    imageURL: [],
    available: true,
    stockQuantity: undefined,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  /**
   * Produtos filtrados por busca e categoria
   */
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      product.productCategories?.some(
        (pc) =>
          pc.categoryId === selectedCategory ||
          pc.category?.id === selectedCategory,
      );

    return matchesSearch && matchesCategory;
  });

  /**
   * Abre modal para criar produto
   */
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      costPrice: undefined,
      salePrice: undefined,
      categoryId: "",
      imageURL: [],
      available: true,
      stockQuantity: undefined,
    });
    setIsModalOpen(true);
  };

  /**
   * Abre modal para editar produto
   */
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      categoryId:
        product.productCategories?.[0]?.category?.id ||
        product.productCategories?.[0]?.categoryId ||
        "",
      imageURL:
        product.imageURL?.map((img) =>
          typeof img === "string" ? img : img.url,
        ) || [],
      available: product.isAvailable,
      stockQuantity: product.stockQuantity || 0,
    });
    setIsModalOpen(true);
  };

  /**
   * Fecha o modal e limpa o formulário
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setIsCreatingCategory(false);
    setNewCategoryName("");
    setFormData({
      name: "",
      description: "",
      costPrice: undefined,
      salePrice: undefined,
      categoryId: "",
      imageURL: [],
      available: true,
      stockQuantity: undefined,
    });
  };

  /**
   * Atualiza campo do formulário
   */
  const updateFormField = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Valida o formulário
   */
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Nome do produto é obrigatório");
      return false;
    }
    if (formData.name.trim().length > 80) {
      toast.error("Nome do prato deve ter no máximo 80 caracteres");
      return false;
    }

    if (formData.description.trim().length > 300) {
      toast.error("Descrição deve ter no máximo 300 caracteres");
      return false;
    }
    if (formData.salePrice === undefined || formData.salePrice < 0.01) {
      toast.error("Preço de venda é obrigatório e deve ser no mínimo R$ 0,01");
      return false;
    }

    if (formData.costPrice === undefined || formData.costPrice < 0) {
      toast.error("Preço de custo é obrigatório e deve ser não-negativo");
      return false;
    }

    if (
      formData.costPrice !== undefined &&
      formData.costPrice > 0 &&
      formData.costPrice < 0.01
    ) {
      toast.error(
        "Preço de custo, quando informado, deve ser no mínimo R$ 0,01",
      );
      return false;
    }

    if (
      formData.costPrice !== undefined &&
      formData.salePrice !== undefined &&
      formData.costPrice > formData.salePrice
    ) {
      toast.error("Preço de custo não pode ser maior que o preço de venda");
      return false;
    }

    if (formData.stockQuantity === undefined || formData.stockQuantity < 1) {
      toast.error("Quantidade em estoque é obrigatória e deve ser no mínimo 1");
      return false;
    }

    if (isCreatingCategory) {
      if (!newCategoryName.trim()) {
        toast.error("O nome da nova categoria é obrigatório");
        return false;
      }
      if (newCategoryName.trim().length < 5) {
        toast.error("Nome da categoria deve ter no mínimo 5 caracteres");
        return false;
      }
      if (newCategoryName.trim().length > 50) {
        toast.error("Nome da categoria deve ter no máximo 50 caracteres");
        return false;
      }
    }
    // Se não, valida o select normal
    else if (!formData.categoryId) {
      toast.error("Selecione uma categoria");
      return false;
    }
    // -------------------

    return true;
  };

  /**
   * Salva o produto (criar ou atualizar) com upload de imagem
   */
  const handleSaveProduct = async (selectedImages?: File[]) => {
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      let productId: string | null = null;
      let finalCategoryId = formData.categoryId;

      // 1. Criar a categoria primeiro, se o usuário optou por criar uma nova
      if (isCreatingCategory) {
        try {
          const newCategoryResponse = await apiService.createCategory({
            name: newCategoryName,
            description: newCategoryName.trim(),
          });

          if (!newCategoryResponse.success || !newCategoryResponse.data?.id) {
            toast.error("Erro ao criar a nova categoria. Tente novamente.");
            setIsSaving(false);
            return;
          }

          finalCategoryId = newCategoryResponse.data.id;

          queryClient.invalidateQueries({ queryKey: ["categories"] });
        } catch (catError) {
          console.error("Erro ao criar categoria:", catError);
          toast.error("Erro ao criar a nova categoria. Tente novamente.");
          setIsSaving(false);
          return;
        }
      }

      if (editingProduct) {
        // Update: send only fields the backend DTO accepts (no productCategories)
        const updateData = {
          name: formData.name,
          description: formData.description,
          costPrice: formData.costPrice ?? 0,
          salePrice: formData.salePrice ?? 0,
          isAvailable: formData.available,
          stockQuantity: formData.stockQuantity ?? 0,
        };

        await updateProduct.mutateAsync({
          id: editingProduct.id,
          data: updateData,
        });
        productId = editingProduct.id;

        // Handle category change via category-product API
        const oldCategoryId =
          editingProduct.productCategories?.[0]?.category?.id;

        // Verifica usando o finalCategoryId
        if (finalCategoryId && finalCategoryId !== oldCategoryId) {
          // Remove old category link if it exists
          const oldLink = editingProduct.productCategories?.[0];
          if (oldLink?.productId && oldLink?.categoryId) {
            try {
              await apiService.unlinkCategoryFromProduct(
                oldLink.productId,
                oldLink.categoryId,
              );
            } catch (e) {
              console.error("Erro ao remover categoria antiga:", e);
            }
          }
          // Add new category link
          try {
            await apiService.linkCategoryToProduct(
              productId,
              finalCategoryId, // Usa a categoria final (nova ou existente)
              formData.description || formData.name,
            );
          } catch (e) {
            console.error("Erro ao vincular nova categoria:", e);
            toast.error("Erro ao atualizar categoria do produto");
          }
        }
      } else {
        // Create: backend CreateProductInput supports productCategories
        const createData = {
          name: formData.name,
          description: formData.description,
          costPrice: formData.costPrice ?? 0,
          salePrice: formData.salePrice ?? 0,
          isAvailable: formData.available,
          stockQuantity: formData.stockQuantity ?? 0,
          productCategories: [finalCategoryId], // Usa a categoria final (nova ou existente)
        };

        const result = await createProduct.mutateAsync(createData);
        productId = result?.id || null;

        // Insere o produto novo direto no cache em vez de confiar só no
        // refetch logo abaixo - um GET disparado bem em seguida do POST
        // às vezes ainda devolve a lista sem o item recém-criado (o prato
        // só aparecia depois de um F5). A imagem/categoria, se ainda
        // pendentes, chegam no refetch de qualquer forma.
        if (result) {
          queryClient.setQueryData(
            ["products", "company", user?.companyId || user?.id || null],
            (old: Product[] = []) =>
              old.some((p) => p.id === result.id) ? old : [...old, result],
          );
        }
      }

      // Fazer upload das imagens, se fornecidas. POST /product/image/:id
      // aceita uma imagem por chamada (não é upload em lote), mas as
      // chamadas em si são independentes - disparar todas em paralelo em
      // vez de uma de cada vez é o que faz essa etapa não ficar arrastada
      // quando o dono escolhe várias fotos de uma vez.
      if (selectedImages?.length && productId) {
        const uploadResults = await Promise.allSettled(
          selectedImages.map((image) =>
            apiService.uploadProductImage(productId!, image),
          ),
        );

        let uploadedCount = 0;
        uploadResults.forEach((result, index) => {
          const image = selectedImages[index];
          if (result.status === "fulfilled" && result.value.success) {
            uploadedCount += 1;
          } else {
            const message =
              result.status === "fulfilled"
                ? result.value.message
                : undefined;
            console.error("Erro ao fazer upload da imagem:", result);
            toast.error(`Erro ao enviar "${image.name}"${message ? `: ${message}` : ""}`);
          }
        });
        if (uploadedCount > 0) {
          toast.success(
            uploadedCount === 1
              ? "Imagem enviada com sucesso!"
              : `${uploadedCount} imagens enviadas com sucesso!`,
          );
        }
      }

      handleCloseModal();
      refetch();
    } catch (error: any) {
      console.error(
        "Erro detalhado ao salvar produto:",
        error?.response?.data || error,
      );
      toast.error(error?.response?.data?.message || "Erro ao salvar produto");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Abre o dialog de confirmação de delete
   */
  const handleRequestDelete = (product: Product) => {
    setDeleteTarget(product);
  };

  /**
   * Cancela o delete
   */
  const handleCancelDelete = () => {
    setDeleteTarget(null);
  };

  /**
   * Confirma e deleta o produto
   * Limpa relações (categorias e imagens) antes de deletar,
   * pois o backend em produção não faz essa limpeza automaticamente.
   */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      // 1. Remover vínculos de categoria e imagens - independentes entre si
      // e entre cada item, então disparados todos em paralelo em vez de um
      // de cada vez (era a parte que mais atrasava o delete de um prato com
      // várias fotos/categorias).
      const categoryLinks = deleteTarget.productCategories || [];
      const images = deleteTarget.imageURL || [];

      await Promise.all([
        ...categoryLinks.map((link) =>
          apiService
            .unlinkCategoryFromProduct(link.productId, link.categoryId)
            .catch((e) =>
              console.warn("Erro ao desvincular categoria:", link.id, e),
            ),
        ),
        ...images.map((img) =>
          apiService
            .deleteProductImage(deleteTarget.id, img.id)
            .catch((e) => console.warn("Erro ao remover imagem:", img.id, e)),
        ),
      ]);

      // 2. Deletar o produto
      await deleteProduct.mutateAsync(deleteTarget.id);

      // Remove do cache na hora - mesmo motivo do create: um GET disparado
      // logo após o DELETE às vezes ainda devolve o item removido (só
      // sumia da tela quando outro prato era removido em seguida).
      queryClient.setQueryData(
        ["products", "company", user?.companyId || user?.id || null],
        (old: Product[] = []) =>
          old.filter((p) => p.id !== deleteTarget.id),
      );

      toast.success("Prato removido com sucesso!");
      setDeleteTarget(null);
    } catch (error: any) {
      console.error("Erro ao deletar produto:", error);
      const errorMessage = error?.errorMessage || error?.message || "";
      toast.error(errorMessage || "Não foi possível deletar este prato.");
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Remove uma foto específica de um prato (sem mexer nas outras) -
   * DELETE /product/image/:productId/:imageId, endpoint que já existia mas
   * não tinha nenhuma UI usando.
   */
  const handleDeleteProductImage = async (
    productId: string,
    imageId: string,
  ) => {
    try {
      const response = await apiService.deleteProductImage(
        productId,
        imageId,
      );
      if (!response.success) {
        toast.error(response.message || "Erro ao remover imagem");
        return;
      }

      // Reflete na hora tanto no modal aberto quanto na grade de pratos,
      // sem esperar um refetch pra sumir a miniatura removida.
      setEditingProduct((prev) =>
        prev && prev.id === productId
          ? {
              ...prev,
              imageURL: prev.imageURL?.filter((img) => img.id !== imageId),
            }
          : prev,
      );

      queryClient.setQueryData(
        ["products", "company", user?.companyId || user?.id || null],
        (old: Product[] = []) =>
          old.map((p) =>
            p.id === productId
              ? { ...p, imageURL: p.imageURL?.filter((img) => img.id !== imageId) }
              : p,
          ),
      );

      toast.success("Imagem removida");
    } catch (error) {
      console.error("Erro ao remover imagem:", error);
      toast.error("Erro ao remover imagem");
    }
  };

  /**
   * Alterna disponibilidade do produto
   * Usa optimistic updates para resposta instantânea
   */
  const handleToggleAvailability = async (product: Product) => {
    const queryKey = [
      "products",
      "company",
      user?.companyId || user?.id || null,
    ];

    // Salva estado anterior para rollback em caso de erro
    const previousProducts = queryClient.getQueryData(queryKey);

    // Atualiza UI imediatamente (optimistic update)
    queryClient.setQueryData(queryKey, (old: Product[] = []) => {
      return old.map((p) =>
        p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p,
      );
    });

    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: {
          name: product.name,
          description: product.description,
          costPrice: product.costPrice,
          salePrice: product.salePrice,
          isAvailable: !product.isAvailable,
          companyId: user?.companyId || user?.id || "",
          stockQuantity: product.stockQuantity || 0,
        },
      });
    } catch (error) {
      // Reverte para estado anterior em caso de erro
      queryClient.setQueryData(queryKey, previousProducts);
      console.error("Erro ao atualizar disponibilidade:", error);
      toast.error("Erro ao atualizar disponibilidade");
    }
  };

  return {
    // Data
    products: filteredProducts,
    allProducts: products,
    categories,
    isLoading: loadingProducts || loadingCategories,

    // Modal state
    isModalOpen,
    editingProduct,
    formData,

    // Filters
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,

    // Actions
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseModal,
    handleSaveProduct,
    handleRequestDelete,
    handleConfirmDelete,
    handleCancelDelete,
    handleToggleAvailability,
    handleDeleteProductImage,
    updateFormField,
    isCreatingCategory,
    setIsCreatingCategory,
    newCategoryName,
    setNewCategoryName,

    // Loading states
    isSaving,
    isDeleting,
    deleteTarget,
  };
};
