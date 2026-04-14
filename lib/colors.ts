/**
 * Paleta de cores consistente para o projeto
 * Usado em componentes e páginas para manter consistência visual
 */

export const priorityColors: Record<string, string> = {
  'Alta': 'bg-red-500',
  'Média': 'bg-yellow-500',
  'Baixa': 'bg-neutral-700',
}

export const statusColors: Record<string, string> = {
  'A fazer': 'bg-neutral-200',
  'Em andamento': 'bg-blue-200',
  'Completada': 'bg-green-200',
  'Pausada': 'bg-gray-300',
}

export const habitColors: Record<string, string> = {
  done: 'bg-green-500',
  failed: 'bg-red-500',
  empty: 'bg-neutral-200',
}

export const categoryColors: Record<string, string> = {
  'Saúde': 'bg-red-100 text-red-800',
  'Produtividade': 'bg-blue-100 text-blue-800',
  'Pessoal': 'bg-purple-100 text-purple-800',
}
