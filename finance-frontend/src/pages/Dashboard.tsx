import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PlusCircle, 
  LogOut, 
  PieChart as PieIcon,
  Trash2,
  Pencil,
  X,
  Filter,
  Plus,
  PiggyBank,
  Sun,
  Moon
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from 'recharts';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  date: string;
  category_id?: number;
}

interface Category {
  id: number;
  name: string;
}

interface Summary {
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  saldo_mes_anterior: number;
  diferenca_poupanca: number;
}

interface CategoryExpense {
  name: string;
  value: number;
}

interface DashboardProps {
  onLogout: () => void;
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  // Estado do Tema (Light / Dark)
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [summary, setSummary] = useState<Summary>({ 
    total_receitas: 0, 
    total_despesas: 0, 
    saldo: 0,
    saldo_mes_anterior: 0,
    diferenca_poupanca: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filtros de Data
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Estado do formulário de transação
  const [editingId, setEditingId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Estado para criar nova categoria
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const fetchData = async () => {
    try {
      const params = { month: selectedMonth, year: selectedYear };
      
      const [summaryRes, transactionsRes, categoryExpensesRes, categoriesRes] = await Promise.all([
        api.get('/transactions/summary', { params }),
        api.get('/transactions/', { params }),
        api.get('/transactions/by-category', { params }),
        api.get('/categories/'),
      ]);

      setSummary(summaryRes.data);
      setTransactions(transactionsRes.data);
      setCategoryExpenses(categoryExpensesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  useEffect(() => {
    const formattedMonth = String(selectedMonth).padStart(2, '0');
    setDate(`${selectedYear}-${formattedMonth}-01`);
    fetchData();
  }, [selectedMonth, selectedYear]);

  const resetForm = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setType('despesa');
    setCategoryId('');
    const formattedMonth = String(selectedMonth).padStart(2, '0');
    setDate(`${selectedYear}-${formattedMonth}-01`);
  };

  const handleEditInit = (tx: Transaction) => {
    setEditingId(tx.id);
    setDescription(tx.description);
    setAmount(tx.amount.toString());
    setType(tx.type);
    setCategoryId(tx.category_id ? tx.category_id.toString() : '');
    setDate(new Date(tx.date).toISOString().split('T')[0]);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const formattedAmount = parseFloat(amount.toString().replace(',', '.'));

    if (isNaN(formattedAmount)) {
      alert('Por favor, insira um valor numérico válido.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        description,
        amount: formattedAmount,
        type,
        category_id: categoryId ? parseInt(categoryId) : null,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
      };

      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
      } else {
        await api.post('/transactions/', payload);
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      console.error('Erro ao salvar transação:', err);
      alert(err.response?.data?.detail || 'Erro ao comunicar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const response = await api.post('/categories/', { 
        name: newCategoryName,
        type: type 
      });
      setCategories((prev) => [...prev, response.data]);
      setCategoryId(response.data.id.toString());
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const errorMessage = typeof detail === 'string' 
        ? detail 
        : Array.isArray(detail) 
          ? detail[0]?.msg 
          : 'Erro ao criar categoria.';
      alert(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      await api.delete(`/transactions/${id}`);
      fetchData();
    } catch (err: any) {
      console.error('Erro ao deletar transação:', err);
      alert(err.response?.data?.detail || 'Erro ao excluir transação no backend.');
    }
  };

  const chartData = [
    { name: 'Entradas', valor: summary.total_receitas, color: '#10b981' },
    { name: 'Saídas', valor: summary.total_despesas, color: '#ef4444' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 p-4 md:p-8 ${
      isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <header className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-2xl border shadow-lg transition-colors ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h1 className="text-2xl font-bold text-emerald-500">FinanceApp</h1>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Gerencie suas finanças em tempo real
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Toggle de Tema */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl border transition duration-200 flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-700 text-yellow-400 hover:bg-slate-700' 
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
              title={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            >
              {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            {/* Seletor de Período */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
              isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-300'
            }`}>
              <Filter className="size-4 text-emerald-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
              >
                <option value={1} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Janeiro</option>
                <option value={2} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Fevereiro</option>
                <option value={3} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Março</option>
                <option value={4} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Abril</option>
                <option value={5} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Maio</option>
                <option value={6} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Junho</option>
                <option value={7} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Julho</option>
                <option value={8} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Agosto</option>
                <option value={9} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Setembro</option>
                <option value={10} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Outubro</option>
                <option value={11} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Novembro</option>
                <option value={12} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>Dezembro</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className={`bg-transparent text-sm font-medium focus:outline-none cursor-pointer border-l pl-2 ${
                  isDarkMode ? 'border-slate-700' : 'border-slate-300'
                }`}
              >
                <option value={2025} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>2025</option>
                <option value={2026} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>2026</option>
              </select>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl hover:bg-red-500/20 transition duration-200 text-sm font-medium ml-auto md:ml-0"
            >
              <LogOut className="size-4" />
              Sair
            </button>
          </div>
        </header>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`p-6 rounded-2xl border shadow-lg transition-colors ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <span className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Entradas</span>
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <TrendingUp className="text-emerald-500 size-6" />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-500">
              R$ {summary.total_receitas.toFixed(2)}
            </p>
          </div>

          <div className={`p-6 rounded-2xl border shadow-lg transition-colors ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <span className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Saídas</span>
              <div className="p-2 bg-red-500/10 rounded-xl">
                <TrendingDown className="text-red-500 size-6" />
              </div>
            </div>
            <p className="text-3xl font-bold text-red-500">
              R$ {summary.total_despesas.toFixed(2)}
            </p>
          </div>

          <div className={`p-6 rounded-2xl border shadow-lg transition-colors ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <span className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Saldo do Mês</span>
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <DollarSign className="text-blue-500 size-6" />
              </div>
            </div>
            <p className={`text-3xl font-bold ${summary.saldo >= 0 ? (isDarkMode ? 'text-white' : 'text-slate-800') : 'text-red-500'}`}>
              R$ {summary.saldo.toFixed(2)}
            </p>
          </div>

          <div className={`p-6 rounded-2xl border shadow-lg transition-colors ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <span className={`font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>vs. Mês Anterior</span>
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <PiggyBank className="text-purple-500 size-6" />
              </div>
            </div>
            <p className={`text-3xl font-bold ${summary.diferenca_poupanca >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {summary.diferenca_poupanca >= 0 ? '+ ' : ''}
              R$ {summary.diferenca_poupanca.toFixed(2)}
            </p>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {summary.diferenca_poupanca >= 0 
                ? 'Poupou mais que o mês anterior 🎉' 
                : 'Poupou menos que o mês anterior ⚠️'}
            </p>
          </div>
        </div>

        {/* Formulário + Gráficos + Histórico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulário */}
          <div className={`p-6 rounded-2xl border shadow-lg h-fit transition-colors ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                <PlusCircle className="text-emerald-500 size-5" />
                {editingId ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              {editingId && (
                <button
                  onClick={resetForm}
                  className={`p-1 rounded-lg ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Cancelar Edição"
                >
                  <X className="size-5" />
                </button>
              )}
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Supermercado, Salário"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full rounded-xl px-4 py-2.5 border focus:outline-none focus:border-emerald-500 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Data</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full rounded-xl px-4 py-2.5 border focus:outline-none focus:border-emerald-500 cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Valor (R$)</label>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full rounded-xl px-4 py-2.5 border focus:outline-none focus:border-emerald-500 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              {/* Campo de Categoria */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Categoria</label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="text-xs text-emerald-500 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="size-3" />
                    Nova
                  </button>
                </div>

                {showAddCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome da categoria"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 text-sm border focus:outline-none focus:border-emerald-500 ${
                        isDarkMode 
                          ? 'bg-slate-900 border-slate-700 text-white' 
                          : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="bg-emerald-500 text-slate-950 font-semibold px-3 py-2 rounded-xl text-sm hover:bg-emerald-600 transition"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 border focus:outline-none focus:border-emerald-500 cursor-pointer ${
                      isDarkMode 
                        ? 'bg-slate-900 border-slate-700 text-white' 
                        : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tipo</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('receita')}
                    className={`py-2 rounded-xl font-medium border text-sm transition ${
                      type === 'receita'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                        : isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-slate-400'
                          : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('despesa')}
                    className={`py-2 rounded-xl font-medium border text-sm transition ${
                      type === 'despesa'
                        ? 'bg-red-500/20 border-red-500 text-red-500'
                        : isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-slate-400'
                          : 'bg-slate-50 border-slate-300 text-slate-600'
                    }`}
                  >
                    Despesa
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-3 px-4 rounded-xl transition mt-2 shadow-md"
              >
                {loading ? 'Salvando...' : editingId ? 'Atualizar Transação' : 'Adicionar Transação'}
              </button>
            </form>
          </div>

          {/* Gráficos + Histórico */}
          <div className="lg:col-span-2 space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Balanço */}
              <div className={`p-6 rounded-2xl border shadow-lg transition-colors ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  <PieIcon className="text-emerald-500 size-5" />
                  Balanço do Mês
                </h2>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke={isDarkMode ? '#94a3b8' : '#64748b'} tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(value: any) => [`R$ ${Number(value || 0).toFixed(2)}`, 'Valor']}
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                          borderColor: isDarkMode ? '#334155' : '#e2e8f0', 
                          borderRadius: '12px' 
                        }}
                        itemStyle={{ color: isDarkMode ? '#f8fafc' : '#1e293b' }}
                      />
                      <Bar dataKey="valor" radius={[0, 8, 8, 0]} barSize={24}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Categorias (Pie) */}
              <div className={`p-6 rounded-2xl border shadow-lg transition-colors ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <h2 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Gastos por Categoria</h2>
                <div className="h-48 w-full">
                  {categoryExpenses.length === 0 ? (
                    <p className={`text-center py-16 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sem despesas categorizadas.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryExpenses}
                          cx="50%"
                          cy="45%"
                          innerRadius={35}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {categoryExpenses.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any) => [`R$ ${Number(value || 0).toFixed(2)}`, name]}
                          contentStyle={{ 
                            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                            borderColor: isDarkMode ? '#334155' : '#e2e8f0', 
                            borderRadius: '12px' 
                          }}
                          itemStyle={{ color: isDarkMode ? '#f8fafc' : '#1e293b' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>

            {/* Histórico */}
            <div className={`p-6 rounded-2xl border shadow-lg transition-colors ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <h2 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Histórico de Transações</h2>
              {transactions.length === 0 ? (
                <p className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nenhuma transação encontrada para este mês.</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {transactions.map((tx) => {
                    const categoryName = categories.find((c) => c.id === tx.category_id)?.name;
                    return (
                      <div
                        key={tx.id}
                        className={`flex justify-between items-center p-4 rounded-xl border transition ${
                          isDarkMode 
                            ? 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600' 
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{tx.description}</p>
                            {categoryName && (
                              <span className={`text-[10px] font-medium border px-2 py-0.5 rounded-full ${
                                isDarkMode 
                                  ? 'bg-slate-800 text-emerald-400 border-slate-700' 
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              }`}>
                                {categoryName}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {new Date(tx.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span
                            className={`font-bold ${
                              tx.type === 'receita' ? 'text-emerald-500' : 'text-red-500'
                            }`}
                          >
                            {tx.type === 'receita' ? '+ ' : '- '}
                            R$ {tx.amount.toFixed(2)}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditInit(tx)}
                              className={`p-2 rounded-lg transition ${
                                isDarkMode 
                                  ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800' 
                                  : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-200'
                              }`}
                              title="Editar"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className={`p-2 rounded-lg transition ${
                                isDarkMode 
                                  ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800' 
                                  : 'text-slate-500 hover:text-red-600 hover:bg-slate-200'
                              }`}
                              title="Excluir"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};