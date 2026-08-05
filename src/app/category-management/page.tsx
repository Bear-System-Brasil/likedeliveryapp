"use client";

import ProtectedRoute from "@/components/role-check";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useCategoryManagement } from "@/hooks";
import { Building2, Edit, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";

function CategoryManagementContent() {
  // Hook centralizado para gerenciamento de categorias
  const {
    categories: filteredCategories,
    isLoading: loading,
    isModalOpen,
    editingCategory,
    formData,
    searchQuery,
    setSearchQuery,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseModal,
    handleSaveCategory,
    handleDeleteCategory,
    updateFormField,
  } = useCategoryManagement();

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div
          className="absolute top-20 left-10 w-64 h-64 bg-linear-to-r from-orange-400/20 to-orange-400/20 
                         rounded-full blur-3xl animate-pulse"
        />
        <div
          className="absolute top-40 right-20 w-48 h-48 bg-linear-to-r from-purple-400/15 to-blue-400/15 
                         rounded-full blur-2xl animate-pulse delay-1000"
        />
        <div
          className="absolute bottom-40 left-1/4 w-80 h-80 bg-linear-to-r from-yellow-400/10 to-orange-400/10 
                        rounded-full blur-3xl animate-pulse delay-2000"
        />
      </div>

      <div className="relative z-10 p-3 sm:p-4 md:p-6 pt-20 sm:pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-linear-to-r from-orange-500 to-orange-500 bg-clip-text text-transparent">
                Gerenciamento de Categorias
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                Organize seus produtos em categorias
              </p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Link href="/company-profile" className="flex-1 sm:flex-none">
                <Button
                  variant="outline"
                  className="cursor-pointer border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600 
                             transition-all w-full h-10 sm:h-11 text-sm sm:text-base"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Perfil</span>
                </Button>
              </Link>
              <Button
                onClick={handleOpenCreateModal}
                className="cursor-pointer bg-linear-to-r from-orange-500 to-orange-500 hover:from-orange-600 
                           hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all flex-1 sm:flex-none text-sm sm:text-base h-10 sm:h-11"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Categoria
              </Button>
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <Input
                placeholder="Buscar categorias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 h-10 sm:h-12 text-sm sm:text-base rounded-xl border-2 border-gray-200 focus:border-orange-400 
                         bg-white shadow-sm transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-2 border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-6 w-32" />
                      <div className="flex gap-1">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-24 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredCategories.map((category) => (
                <Card
                  key={category.id}
                  className="border-2 border-gray-200 hover:border-orange-300 transition-all shadow-sm hover:shadow-lg"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between items-start text-base sm:text-lg">
                      <span className="text-gray-900">{category.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(category)}
                          className="h-8 w-8 hover:bg-orange-100 hover:text-orange-600 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category)}
                          className="h-8 w-8 hover:bg-red-100 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {category.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      Criado em:{" "}
                      {new Date(category.created_at).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredCategories.length === 0 && !loading && (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-sm">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-linear-to-r from-orange-100 to-orange-100 
                            flex items-center justify-center"
              >
                <Plus className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-gray-700 font-medium mb-2">
                Nenhuma categoria encontrada
              </p>
              <p className="text-gray-400 text-sm">
                {searchQuery
                  ? "Tente outro termo de busca"
                  : "Comece adicionando sua primeira categoria"}
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b border-gray-100 shrink-0">
            <DialogTitle
              className="text-lg sm:text-xl font-bold bg-linear-to-r from-orange-500 to-orange-500 
                                    bg-clip-text text-transparent"
            >
              {editingCategory
                ? "Editar Categoria"
                : "Adicionar Nova Categoria"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-600">
              Preencha as informações da categoria abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 flex-1">
            <div className="grid gap-2.5 sm:gap-3">
              <div className="grid gap-1 sm:gap-1.5">
                <Label htmlFor="name" className="text-xs sm:text-sm">
                  Nome da Categoria *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormField("name", e.target.value)}
                  placeholder="Ex: Pizza, Sobremesas, Bebidas"
                  className="h-9 sm:h-10 rounded-xl border-2 border-gray-200 focus:border-orange-400 text-xs sm:text-sm"
                />
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
                  placeholder="Descreva a categoria..."
                  rows={3}
                  className="rounded-xl border-2 border-gray-200 focus:border-orange-400 text-xs sm:text-sm resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-4 sm:px-6 pb-3 sm:pb-4 pt-2 sm:pt-3 border-t border-gray-100 flex-col-reverse sm:flex-row gap-2 sm:gap-0 shrink-0">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="cursor-pointer w-full sm:w-auto text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCategory}
              className="cursor-pointer relative bg-linear-to-r from-orange-500 to-orange-500 
                         font-semibold text-white shadow-xl hover:shadow-2xl overflow-hidden transition-all group transform w-full sm:w-auto text-sm sm:text-base"
            >
              <span
                className="absolute inset-0 bg-white opacity-30 rotate-45 -translate-x-full group-hover:translate-x-full
                              blur-sm transition-transform duration-500"
              />
              <span className="relative z-10">
                {editingCategory ? "Atualizar" : "Criar"} Categoria
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CategoryManagementPage() {
  return (
    <ProtectedRoute allowedRoles={["owner", "admin", "manager"]}>
      <CategoryManagementContent />
    </ProtectedRoute>
  );
}
