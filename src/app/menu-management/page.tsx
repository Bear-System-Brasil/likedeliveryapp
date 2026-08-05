"use client";

import { AdminDish, AdminDishCard } from "@/components/admin-dish-card";
import ProtectedRoute from "@/components/role-check";
import Sidebar from "@/components/sidebar-menu-management/index";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyCentsInput } from "@/components/ui/currency-cents-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StockQuantityInput } from "@/components/ui/stock-quantity-input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMenuManagement } from "@/hooks";
import { Building2, Loader2, Plus, Search, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function MenuManagementContent() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Hook centralizado para gerenciamento de menu
  const {
    products,
    categories,
    isLoading: loading,
    isModalOpen,
    editingProduct,
    formData,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseModal,
    handleSaveProduct,
    handleRequestDelete,
    handleConfirmDelete,
    handleCancelDelete,
    handleToggleAvailability,
    updateFormField,
    isSaving,
    isDeleting,
    deleteTarget,
    isCreatingCategory,
    setIsCreatingCategory,
    newCategoryName,
    setNewCategoryName,
  } = useMenuManagement();

  // Converter produtos para formato AdminDish
  const filteredDishes: AdminDish[] = useMemo(() => {
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: product.salePrice,
      image:
        product.imageURL && product.imageURL.length > 0
          ? product.imageURL[0].url
          : "/placeholder.jpg",
      category:
        product.productCategories?.[0]?.category?.name || "Sem categoria",
      available: product.isAvailable ?? true,
      tags: [],
    }));
  }, [products]);

  // Criar array de categorias para o Tabs
  const allCategories = useMemo(() => {
    return [{ id: "all", name: "Todas" }, ...categories];
  }, [categories]);

  const handleEditDish = (dish: AdminDish) => {
    const product = products.find((p) => p.id === dish.id);
    if (product) {
      resetImageState();
      handleOpenEditModal(product);
    }
  };

  const handleDeleteDish = async (dish: AdminDish) => {
    const product = products.find((p) => p.id === dish.id);
    if (product) {
      handleRequestDelete(product);
    }
  };

  const handleToggleAvail = async (dish: AdminDish) => {
    const product = products.find((p) => p.id === dish.id);
    if (product) {
      handleToggleAvailability(product);
    }
  };

  const resetImageState = useCallback(() => {
    setImagePreview(null);
    setSelectedImage(null);
  }, []);

  const handleCloseModalWithReset = () => {
    resetImageState();
    handleCloseModal();
  };

  // Centralized cleanup: revoke blob URLs when imagePreview changes or on unmount
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleClearForm = () => {
    if (editingProduct) {
      handleOpenEditModal(editingProduct);
    } else {
      handleOpenCreateModal();
    }
    resetImageState();
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-orange-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-r from-purple-400/15 to-blue-400/15 rounded-full blur-2xl animate-pulse delay-1000" />
          <div className="absolute bottom-40 left-1/4 w-80 h-80 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="relative z-10 p-3 sm:p-4 md:p-6 pt-6 lg:pl-72">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
              {/* Lado esquerdo: botão do menu + título juntos */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 shadow-sm flex-shrink-0 lg:hidden cursor-pointer"
                >
                  ☰
                </button>
                <Sidebar
                  isOpen={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                />

                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-500 bg-clip-text text-transparent">
                    Gerenciamento do Cardápio
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                    Gerencie os pratos do seu restaurante
                  </p>
                </div>
              </div>

              {/* Lado direito: botões de ação */}
              <div className="flex gap-2 w-full sm:w-auto">
                <Link href="/company-profile" className="flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    className="cursor-pointer border-2 border-gray-200 hover:border-orange-400 hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-50 hover:text-orange-600 
                         transition-all w-full h-10 sm:h-11 text-sm sm:text-base"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Perfil</span>
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    resetImageState();
                    handleOpenCreateModal();
                  }}
                  className="cursor-pointer bg-gradient-to-r from-orange-500 to-orange-500 hover:from-orange-600 
                       hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all flex-1 sm:flex-none text-sm sm:text-base h-10 sm:h-11"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Prato
                </Button>
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <Input
                  placeholder="Buscar pratos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base rounded-xl border-2 border-gray-200 focus:border-orange-400 
                             bg-white shadow-sm transition-all"
                />
              </div>
            </div>
            <Tabs
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="mb-4 sm:mb-6"
            >
              <TabsList className="bg-white border-2 border-gray-200 shadow-sm w-full sm:w-auto flex-wrap h-auto gap-1 p-1">
                {allCategories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredDishes.map((dish) => (
                <AdminDishCard
                  key={dish.id}
                  dish={dish}
                  onEdit={handleEditDish}
                  onDelete={handleDeleteDish}
                  onToggleAvailability={handleToggleAvail}
                />
              ))}
            </div>{" "}
            {filteredDishes.length === 0 && !loading && (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-sm">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-orange-100 to-orange-100 
                              flex items-center justify-center"
                >
                  <Plus className="w-8 h-8 text-orange-500" />
                </div>
                <p className="text-gray-700 font-medium mb-2">
                  Nenhum prato encontrado
                </p>
                <p className="text-gray-400 text-sm">
                  {searchQuery
                    ? "Tente outro termo de busca"
                    : "Comece adicionando seu primeiro prato"}
                </p>
              </div>
            )}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="border-2 border-gray-200">
                    <Skeleton className="w-full h-48 rounded-t-lg" />
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Skeleton className="h-5 w-32" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-9 flex-1 rounded-xl" />
                        <Skeleton className="h-9 w-9 rounded-xl" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              if (!open) {
                handleCloseModalWithReset();
              }
            }}
          >
            <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[90vh] p-0 flex flex-col">
              <DialogHeader className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b border-gray-100 shrink-0">
                <DialogTitle
                  className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-500 
                                      bg-clip-text text-transparent"
                >
                  {editingProduct ? "Editar Prato" : "Adicionar Novo Prato"}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-600">
                  Preencha as informações do prato.
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 flex-1">
                <div className="grid gap-2.5 sm:gap-3">
                  {/* Image Upload */}
                  <div className="grid gap-1 sm:gap-1.5">
                    <Label
                      htmlFor="productImage"
                      className="text-xs sm:text-sm"
                    >
                      Imagem do Prato
                    </Label>
                    <Input
                      id="productImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validate file size (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("Imagem muito grande. Máximo 5MB");
                            e.target.value = "";
                            return;
                          }
                          setSelectedImage(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="h-9 sm:h-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 text-xs sm:text-sm"
                    />

                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview da imagem"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}

                    {selectedImage && (
                      <p className="text-[10px] sm:text-xs text-green-600">
                        ✓ {selectedImage.name}
                      </p>
                    )}
                    {editingProduct &&
                      editingProduct.imageURL &&
                      editingProduct.imageURL.length > 0 && (
                        <p className="text-xs text-gray-500">
                          Imagem atual: {editingProduct.imageURL.length} foto(s)
                        </p>
                      )}
                  </div>

                  <div className="grid gap-1 sm:gap-1.5">
                    <Label htmlFor="name" className="text-xs sm:text-sm">
                      Nome do Prato *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateFormField("name", e.target.value)}
                      placeholder="Nome do prato"
                      className="h-9 sm:h-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Categoria *</Label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCategory(!isCreatingCategory);
                          if (isCreatingCategory) {
                            setNewCategoryName(""); // Limpa o texto se cancelar a criação
                          } else {
                            updateFormField("categoryId", ""); // Limpa o select se for criar
                          }
                        }}
                        className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
                      >
                        {isCreatingCategory
                          ? "Selecionar existente"
                          : "+ Criar nova"}
                      </button>
                    </div>

                    {isCreatingCategory ? (
                      <Input
                        id="newCategory"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Digite o nome da nova categoria"
                        className="h-9 sm:h-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 text-xs sm:text-sm"
                        autoFocus
                      />
                    ) : (
                      <select
                        value={formData.categoryId}
                        onChange={(e) =>
                          updateFormField("categoryId", e.target.value)
                        }
                        className="w-full h-9 sm:h-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 text-xs sm:text-sm px-3 bg-white"
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid gap-1 sm:gap-1.5">
                    <Label htmlFor="description" className="text-xs sm:text-sm">
                      Descrição *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        updateFormField("description", e.target.value)
                      }
                      placeholder="Descreva o prato"
                      className="rounded-xl border-2 border-gray-200 focus:border-orange-400 text-xs sm:text-sm resize-none min-h-[60px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="grid gap-1 sm:gap-1.5">
                      <Label htmlFor="costPrice" className="text-xs sm:text-sm">
                        Custo
                      </Label>

                      <CurrencyCentsInput
                        id="costPrice"
                        value={formData.costPrice}
                        onValueChange={(value) =>
                          updateFormField("costPrice", value)
                        }
                        maskWhileTyping={true}
                        placeholder="R$ 0,01"
                        className="h-9 sm:h-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="grid gap-1 sm:gap-1.5">
                      <Label htmlFor="salePrice" className="text-xs sm:text-sm">
                        Venda *
                      </Label>

                      <CurrencyCentsInput
                        id="salePrice"
                        value={formData.salePrice}
                        onValueChange={(value) =>
                          updateFormField("salePrice", value)
                        }
                        maskWhileTyping={true}
                        placeholder="R$ 0,01"
                        className="h-9 sm:h-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid gap-1 sm:gap-1.5">
                    <Label
                      htmlFor="stockQuantity"
                      className="text-xs sm:text-sm"
                    >
                      Qtd. Estoque
                    </Label>

                    <StockQuantityInput
                      id="stockQuantity"
                      value={formData.stockQuantity}
                      onValueChange={(value) =>
                        updateFormField("stockQuantity", value)
                      }
                      placeholder="1"
                      minValue={1}
                      maxValue={9999}
                      className="h-9 sm:h-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      checked={formData.available}
                      onChange={(e) =>
                        updateFormField("available", e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <Label
                      htmlFor="isAvailable"
                      className="cursor-pointer text-xs sm:text-sm"
                    >
                      Disponível para venda
                    </Label>
                  </div>
                </div>
              </div>

              <DialogFooter className="px-4 sm:px-6 pb-3 sm:pb-4 pt-2 sm:pt-3 border-t border-gray-100 flex-col-reverse sm:flex-row gap-2 sm:gap-0 shrink-0">
                <Button
                  variant="ghost"
                  onClick={handleClearForm}
                  className="cursor-pointer text-gray-500 hover:text-gray-700 w-full sm:w-auto text-sm"
                >
                  Limpar Tudo
                </Button>
                <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleCloseModalWithReset}
                    className="cursor-pointer w-full sm:w-auto text-sm"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() =>
                      handleSaveProduct(selectedImage || undefined)
                    }
                    disabled={isSaving}
                    className="cursor-pointer relative bg-gradient-to-r from-orange-500 to-orange-500 
                            font-semibold text-white shadow-xl hover:shadow-2xl overflow-hidden transition-all group transform w-full sm:w-auto text-sm sm:text-base"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingProduct ? "Atualizando..." : "Criando..."}
                      </>
                    ) : (
                      <>
                        <span
                          className="absolute inset-0 bg-white opacity-30 rotate-45 -translate-x-full group-hover:translate-x-full
                                  blur-sm transition-transform duration-500"
                        />
                        {editingProduct ? "Atualizar" : "Criar"} Prato
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete confirmation dialog */}
          <AlertDialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
              if (!open && !isDeleting) {
                handleCancelDelete();
              }
            }}
          >
            <AlertDialogContent className="rounded-2xl flex flex-col items-center w-fit text-center sm:max-w-sm bg-white shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mt-6">
                <TriangleAlert className="w-6 h-6 text-yellow-600" />
              </div>

              <AlertDialogHeader className="space-y-3 px-4">
                <AlertDialogTitle className="text-xl font-bold text-center text-gray-900">
                  Atenção!
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2 text-sm text-gray-600">
                  <p>
                    Você está prestes a remover{" "}
                    <strong className="text-gray-900">
                      &quot;{deleteTarget?.name}&quot;
                    </strong>{" "}
                    do seu cardápio.
                  </p>
                  <p className="text-red-600 font-medium">
                    Esta ação não poderá ser desfeita.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="w-full px-4 pb-4 pt-2 flex flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="rounded-xl cursor-pointer flex-1 border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium h-11"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="rounded-xl cursor-pointer flex-1 bg-red-600 hover:bg-red-700 text-white font-medium h-11 transition-colors"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Removendo...
                    </>
                  ) : (
                    "Remover Prato"
                  )}
                </Button>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  );
}

export default function MenuManagementPage() {
  return (
    <ProtectedRoute allowedRoles={["owner", "admin", "manager"]}>
      <MenuManagementContent />
    </ProtectedRoute>
  );
}
