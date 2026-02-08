import React, { useState } from 'react';
import {
    Package, Plus, Search, Edit2, Trash2, AlertTriangle,
    TrendingDown, CheckCircle, X, Save, Box, MapPin, DollarSign
} from 'lucide-react';
import { InventoryItem, InventoryStatus, InventoryCategory, StockType } from '../../../types';
import { toast } from '../../notifications/ToastSystem';
import { Filter } from 'lucide-react';

interface InventoryTrackerProps {
    inventory: InventoryItem[];
    onAddItem: (item: Omit<InventoryItem, 'id' | 'status'>) => void;
    onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
    onDeleteItem: (id: string) => void;
}

const getStatusConfig = (status: InventoryStatus) => {
    switch (status) {
        case 'AVAILABLE':
            return { label: 'Available', color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle };
        case 'SHORTAGE':
            return { label: 'Shortage', color: 'bg-amber-500/20 text-amber-400', icon: TrendingDown };
        case 'NOT_AVAILABLE':
            return { label: 'Not Available', color: 'bg-rose-500/20 text-rose-400', icon: AlertTriangle };
        case 'PLEASE_MENTEN':
            return { label: 'Please Menten', color: 'bg-yellow-500/20 text-yellow-400', icon: AlertTriangle };
        case 'ORDERED':
            return { label: 'Ordered', color: 'bg-blue-500/20 text-blue-400', icon: Package };
        default:
            return { label: status, color: 'bg-slate-500/20 text-slate-400', icon: Box };
    }
};

export const InventoryTracker: React.FC<InventoryTrackerProps> = ({
    inventory,
    onAddItem,
    onUpdateItem,
    onDeleteItem
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [formData, setFormData] = useState<Partial<InventoryItem>>({
        name: '',
        sku: '',
        category: 'Raw Material',
        productFamily: '',
        quantity: 0,
        previousBalance: 0,
        unit: 'pcs',
        minStock: 10,
        location: '',
        supplier: '',
        unitCost: 0,
        stockType: 'NEW',
        status: 'AVAILABLE',
        expiryDate: undefined,
        deliveryDueDate: undefined
    });

    const [filterCategory, setFilterCategory] = useState<InventoryCategory | 'All'>('All');
    const [filterStockType, setFilterStockType] = useState<StockType | 'All'>('All');

    // Alert Logic
    React.useEffect(() => {
        const expiringItems = inventory.filter(item =>
            item.expiryDate && item.expiryDate > Date.now() &&
            item.expiryDate - Date.now() < 172800000 // 48 hours
        );

        if (expiringItems.length > 0) {
            // Check if we already showed this alert recently? For now just show on mount/update
            // To avoid potential spam loops, we could use a ref, but simple is ok for now
            toast.warning("Expiring Stock Alert", `${expiringItems.length} items are expiring within 48 hours!`);
        }
    }, [inventory]);

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
        const matchesStock = filterStockType === 'All' || item.stockType === filterStockType;

        return matchesSearch && matchesCategory && matchesStock;
    });

    const shortageCount = inventory.filter(i => i.status === 'SHORTAGE' || i.status === 'PLEASE_MENTEN').length;
    const notAvailableCount = inventory.filter(i => i.status === 'NOT_AVAILABLE').length;

    const handleSubmit = () => {
        if (!formData.name?.trim() || !formData.sku?.trim()) return;

        if (editingItem) {
            onUpdateItem(editingItem.id, formData);
        } else {
            // Ensure all required fields are present for new item
            // Auto-generate srNo based on existing inventory length
            const newSrNo = inventory.length > 0
                ? Math.max(...inventory.map(i => i.srNo || 0)) + 1
                : 1;

            const newItem = {
                ...formData,
                srNo: newSrNo,
                stockType: formData.stockType || 'NEW',
                category: formData.category || 'Raw Material',
                productFamily: formData.productFamily || '',
                minStock: formData.minStock || 10,
                quantity: formData.quantity || 0,
                previousBalance: formData.previousBalance || 0,
                unit: formData.unit || 'pcs',
                status: formData.status || 'AVAILABLE'
            } as any;
            onAddItem(newItem);
        }

        resetForm();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            sku: '',
            category: 'Raw Material',
            productFamily: '',
            quantity: 0,
            previousBalance: 0,
            unit: 'pcs',
            minStock: 10,
            maxStock: 1000,
            location: '',
            supplier: '',
            unitCost: 0,
            status: 'AVAILABLE'
        });
        setShowForm(false);
        setEditingItem(null);
    };

    const handleEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            sku: item.sku,
            category: item.category,
            productFamily: item.productFamily || '',
            quantity: item.quantity,
            previousBalance: item.previousBalance || 0,
            unit: item.unit,
            minStock: item.minStock,
            maxStock: item.maxStock,
            location: item.location,
            supplier: item.supplier || '',
            unitCost: item.unitCost || 0,
            status: item.status
        });
        setShowForm(true);
    };

    return (
        <div className="p-6 space-y-6 bg-slate-900 min-h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white">Inventory Tracker</h1>
                    <p className="text-sm text-slate-400 mt-1">Manage materials and supplies</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={18} />
                    Add Item
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Package size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-white">{inventory.length}</p>
                            <p className="text-xs text-slate-400">Total Items</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <TrendingDown size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-amber-400">{shortageCount}</p>
                            <p className="text-xs text-slate-400">Shortage</p>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
                            <AlertTriangle size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-rose-400">{notAvailableCount}</p>
                            <p className="text-xs text-slate-400">Not Available</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">
                    <Search size={18} className="text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search inventory by name or SKU..."
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-500"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                    <div className="relative group">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value as any)}
                            className="appearance-none bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-indigo-500/30 rounded-xl px-5 py-3 pr-12 text-white font-semibold text-sm outline-none hover:border-indigo-400/60 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-w-[160px] shadow-lg shadow-black/20 transition-all duration-200 hover:shadow-indigo-500/10"
                        >
                            <option value="All">All Categories</option>
                            <option value="Raw Material">Raw Material</option>
                            <option value="Paint">Paint</option>
                            <option value="Powder">Powder</option>
                            <option value="Wiring">Wiring</option>
                            <option value="Hardware">Hardware</option>
                            <option value="Gasket">Gasket</option>
                            <option value="Lock">Lock</option>
                            <option value="Hinge">Hinge</option>
                            <option value="Wooden">Wooden</option>
                            <option value="Nails">Nails</option>
                            <option value="Packaging">Packaging</option>
                            <option value="Tools">Tools</option>
                            <option value="Other">Other</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none bg-indigo-500/20 p-1.5 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
                            <Filter size={14} className="text-indigo-300" />
                        </div>
                    </div>

                    <div className="relative group">
                        <select
                            value={filterStockType}
                            onChange={(e) => setFilterStockType(e.target.value as any)}
                            className="appearance-none bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/30 rounded-xl px-5 py-3 pr-12 text-white font-semibold text-sm outline-none hover:border-cyan-400/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 cursor-pointer min-w-[160px] shadow-lg shadow-black/20 transition-all duration-200 hover:shadow-cyan-500/10"
                        >
                            <option value="All">All Stock Types</option>
                            <option value="NEW">New Stock</option>
                            <option value="OLD">Old Stock</option>
                            <option value="EXPIRED">Expired Stock</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none bg-cyan-500/20 p-1.5 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                            <Filter size={14} className="text-cyan-300" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-slate-700 sticky top-0 bg-slate-800">
                            <h2 className="text-lg font-bold text-white">
                                {editingItem ? 'Edit Item' : 'Add New Item'}
                            </h2>
                            <button onClick={resetForm} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Item Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter name"
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">SKU *</label>
                                    <input
                                        type="text"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        placeholder="SKU-001"
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    >
                                        <option value="Raw Material">Raw Material</option>
                                        <option value="Paint">Paint</option>
                                        <option value="Powder">Powder</option>
                                        <option value="Wiring">Wiring</option>
                                        <option value="Hardware">Hardware</option>
                                        <option value="Gasket">Gasket</option>
                                        <option value="Lock">Lock</option>
                                        <option value="Hinge">Hinge</option>
                                        <option value="Wooden">Wooden</option>
                                        <option value="Nails">Nails</option>
                                        <option value="Packaging">Packaging</option>
                                        <option value="Tools">Tools</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Product Family</label>
                                    <input
                                        type="text"
                                        value={formData.productFamily}
                                        onChange={(e) => setFormData({ ...formData, productFamily: e.target.value })}
                                        placeholder="e.g., Hardware, Powder"
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    >
                                        <option value="AVAILABLE">Available</option>
                                        <option value="SHORTAGE">Shortage</option>
                                        <option value="NOT_AVAILABLE">Not Available</option>
                                        <option value="PLEASE_MENTEN">Please Menten</option>
                                        <option value="ORDERED">Ordered</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Stock Type</label>
                                    <select
                                        value={formData.stockType}
                                        onChange={(e) => setFormData({ ...formData, stockType: e.target.value as any })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    >
                                        <option value="NEW">New Stock</option>
                                        <option value="OLD">Old Stock</option>
                                        <option value="EXPIRED">Expired Stock</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.valueAsNumber })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Delivery Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.deliveryDueDate ? new Date(formData.deliveryDueDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setFormData({ ...formData, deliveryDueDate: e.target.valueAsNumber })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Location</label>
                                    <div className="flex items-center gap-2 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3">
                                        <MapPin size={14} className="text-slate-400" />
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="Warehouse A"
                                            className="flex-1 bg-transparent border-none outline-none text-white text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Supplier</label>
                                    <input
                                        type="text"
                                        value={formData.supplier}
                                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                        placeholder="Supplier Name"
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Prev. Balance</label>
                                    <input
                                        type="number"
                                        value={formData.previousBalance}
                                        onChange={(e) => setFormData({ ...formData, previousBalance: Number(e.target.value) })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Balance Qty</label>
                                    <input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Unit</label>
                                    <input
                                        type="text"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        placeholder="pcs"
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Unit Cost</label>
                                    <div className="flex items-center gap-2 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3">
                                        <DollarSign size={14} className="text-slate-400" />
                                        <input
                                            type="number"
                                            value={formData.unitCost}
                                            onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                                            className="flex-1 bg-transparent border-none outline-none text-white text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-2">Min Stock</label>
                                    <input
                                        type="number"
                                        value={formData.minStock}
                                        onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-700">
                            <button onClick={resetForm} className="px-5 py-2.5 text-slate-400 hover:text-white font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.name?.trim() || !formData.sku?.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl disabled:opacity-50"
                            >
                                <Save size={16} />
                                {editingItem ? 'Save Changes' : 'Add Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory Table */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-slate-500 bg-slate-800/50">
                                <th className="px-3 py-4 font-medium text-center w-14">Sr No</th>
                                <th className="px-5 py-4 font-medium">Product Family</th>
                                <th className="px-5 py-4 font-medium">SKU/Code</th>
                                <th className="px-5 py-4 font-medium">Product Name</th>
                                <th className="px-5 py-4 font-medium text-center">Prev. Bal</th>
                                <th className="px-5 py-4 font-medium text-center">Balance Qty</th>
                                <th className="px-5 py-4 font-medium text-center">Status</th>
                                <th className="px-5 py-4 font-medium">Location</th>
                                <th className="px-5 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventory.map((item) => {
                                const { label, color, icon: StatusIcon } = getStatusConfig(item.status);

                                return (
                                    <tr key={item.id} className="border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                                        <td className="px-3 py-4 text-center">
                                            <span className="text-xs font-bold text-slate-400">{item.srNo || '-'}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm text-cyan-400 font-medium">{item.productFamily || item.category}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-xs font-mono text-slate-400">{item.sku}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-medium text-white text-sm">{item.name}</p>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="text-xs text-slate-400">{item.previousBalance || 0}</span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="text-sm font-bold text-white">
                                                {item.quantity} <span className="text-slate-500 font-normal">{item.unit}</span>
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${color}`}>
                                                <StatusIcon size={12} />
                                                {label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <MapPin size={12} />
                                                    {item.location}
                                                </span>
                                                {item.expiryDate && (
                                                    <span className={`text-[10px] font-bold mt-1 ${item.expiryDate - Date.now() < 172800000 ? 'text-rose-500' : 'text-slate-500'
                                                        }`}>
                                                        Exp: {new Date(item.expiryDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteItem(item.id)}
                                                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-400"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};
